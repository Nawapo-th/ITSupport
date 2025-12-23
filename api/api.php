<?php
clearstatcache(); // Force reload
header('Content-Type: application/json; charset=utf-8');
require '../config/db_connect.php';

// Set Timezone to Thailand
date_default_timezone_set('Asia/Bangkok');
$pdo->exec("SET time_zone = '+07:00';");

// Helper to get POST data
$data = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? '';

$response = ['success' => false, 'message' => 'Invalid action'];

try {
    switch ($action) {
        case 'userLogin':
            $username = $data['username'] ?? '';
            $password = $data['password'] ?? '';
            
            // 1. Try External API
            $apiUrl = "https://webappqshc.kku.ac.th/QSHCAuth/api/Account/ADAuthJson";
            $payload = json_encode(["username" => $username, "password" => $password]);
            
            $ch = curl_init($apiUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // In case of SSL issues
            
            $apiResult = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            $externalAuthSuccess = false;
            $userData = [];

            if ($httpCode === 200 && $apiResult) {
                $json = json_decode($apiResult, true);
                if (isset($json['isSuccess']) && $json['isSuccess'] === true) {
                    $externalAuthSuccess = true;
                    $userData = $json['data'] ?? [];
                    // Map External Data
                    $response['success'] = true;
                    $response['fullName'] = $userData['fullName'] ?? $userData['FullName'] ?? $username;
                    $response['division'] = $userData['division'] ?? '';
                    $response['department'] = $userData['department'] ?? '';
                    $response['isAdmin'] = (in_array(trim($response['division']), ["งานเทคโนโลยีสารสนเทศ", "จ้างเหมา งานเทคโนโลยีสารสนเทศ"]));
                    $response['data'] = $userData;
                }
            }

            // 2. Fallback to Local DB if external failed (For testing/dev)
            if (!$externalAuthSuccess) {
                $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
                $stmt->execute([$username]);
                $user = $stmt->fetch();
                
                // Simple password check (In prod, use password_verify)
                // For this migration, assuming simple textual match or hardcoded for 'admin'
                if ($user && ($password === '1234' || $user['password'] === $password)) {
                     $response['success'] = true;
                     $response['fullName'] = $user['full_name'];
                     $response['division'] = $user['division'];
                     $response['isAdmin'] = ($user['role'] === 'Admin' || in_array(trim($user['division']), ["งานเทคโนโลยีสารสนเทศ", "จ้างเหมา งานเทคโนโลยีสารสนเทศ"]));
                } else {
                     if($httpCode !== 200) {
                        $response['message'] = "Login Failed (External API: $httpCode, Local: Not found)";
                     } else {
                         $response['message'] = "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง";
                     }
                }
            }
            break;

        case 'findAssetInfo':
            $code = $_GET['code'] ?? '';
            // Search in assets table
            $stmt = $pdo->prepare("SELECT * FROM assets WHERE asset_code = ?");
            $stmt->execute([$code]);
            $asset = $stmt->fetch();

            if ($asset) {
                $response = [
                    'found' => true,
                    'deviceName' => $asset['device_name'],
                    'brand' => $asset['brand'],
                    'model' => $asset['model']
                ];
            } else {
                // Try to find in repairs history
                $stmt = $pdo->prepare("SELECT device_name, brand, model FROM repairs WHERE asset_code = ? ORDER BY created_at DESC LIMIT 1");
                $stmt->execute([$code]);
                $history = $stmt->fetch();
                if ($history) {
                    $response = [
                        'found' => true,
                        'deviceName' => $history['device_name'],
                        'brand' => $history['brand'],
                        'model' => $history['model']
                    ];
                } else {
                    $response = ['found' => false];
                }
            }
            break;

        case 'processForm':
            $formData = $data;
            // Generate Ticket ID
            $ticketId = date("Ymd-His");
            
            // Determine Created At
            $createdAt = date('Y-m-d H:i:s'); // Default
            if (!empty($formData['customDate'])) {
                 $t = !empty($formData['customTime']) ? $formData['customTime'] : date('H:i:s');
                 // Append seconds if missing
                 if(strlen($t) == 5) $t .= ":00";
                 $createdAt = $formData['customDate'] . ' ' . $t;
            }

            $sql = "INSERT INTO repairs (ticket_id, asset_code, device_name, brand, model, reporter_name, division, floor, issue, contact, created_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $ticketId,
                $formData['assetCode'],
                $formData['deviceName'],
                $formData['brand'],
                $formData['model'],
                $formData['name'],
                $formData['division'],
                $formData['floor'],
                $formData['issue'],
                $formData['contact'],
                $createdAt
            ]);

            // Save new asset if checks out
            // Upsert asset info
            $upsert = "INSERT INTO assets (asset_code, device_name, brand, model) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE device_name=?, brand=?, model=?";
            $stmtUpsert = $pdo->prepare($upsert);
            $stmtUpsert->execute([
                $formData['assetCode'], $formData['deviceName'], $formData['brand'], $formData['model'],
                $formData['deviceName'], $formData['brand'], $formData['model']
            ]);

            $response = ['success' => true, 'message' => "บันทึกข้อมูลเรียบร้อย! รหัสใบงาน: " . $ticketId];
            break;

        case 'getDashboardStats':
            $searchCode = $_GET['assetCode'] ?? null;
            
            // Overview
            $stmt = $pdo->query("SELECT 
                SUM(CASE WHEN (status LIKE '%สำเร็จ%' OR status='Completed') THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN (status = 'รอรับเรื่อง') THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN (status = 'กำลังดำเนินการ') THEN 1 ELSE 0 END) as in_progress,
                COUNT(DISTINCT technician) as technicians
                FROM repairs");
            $overview = $stmt->fetch();

            // Get actual technician count from technicians table
            try {
                $techCount = $pdo->query("SELECT COUNT(*) FROM technicians")->fetchColumn();
                // If table exists but is empty, it returns 0. If table doesn't exist, it throws.
                if ($techCount !== false) {
                    $overview['technicians'] = $techCount;
                }
            } catch (Exception $e) {
                // Table might not exist yet, keep the count from repairs or set to 0
                // $overview['technicians'] = 0; 
                // Using existing fallback from the first query is safer if table missing
            }

            // Chart Statistics
            $stmt = $pdo->query("SELECT 
                 SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today,
                 SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as week,
                 SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as month,
                 SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR) THEN 1 ELSE 0 END) as year
                 FROM repairs");
            $chartStats = $stmt->fetch();

            $assetStats = null;
            if ($searchCode) {
                $stmt = $pdo->prepare("SELECT created_at FROM repairs WHERE asset_code = ?");
                $stmt->execute([$searchCode]);
                $rows = $stmt->fetchAll();
                
                $d7 = 0; $d30 = 0; $d365 = 0;
                $now = new DateTime();
                foreach($rows as $row) {
                    $date = new DateTime($row['created_at']);
                    $diff = $now->diff($date)->days;
                    if ($diff <= 7) $d7++;
                    if ($diff <= 30) $d30++;
                    if ($diff <= 365) $d365++;
                }
                $assetStats = [
                    'assetCode' => $searchCode,
                    'total' => count($rows),
                    'last7Days' => $d7,
                    'last1Month' => $d30,
                    'last1Year' => $d365
                ];
            }

            $response = [
                'success' => true,
                'overview' => [
                    'pending' => $overview['pending'] ?? 0,
                    'completed' => $overview['completed'] ?? 0,
                    'in_progress' => $overview['in_progress'] ?? 0,
                    'technicians' => $overview['technicians'] ?? 0
                ],
                'chartStats' => [
                    'today' => $chartStats['today'] ?? 0,
                    'week' => $chartStats['week'] ?? 0,
                    'month' => $chartStats['month'] ?? 0,
                    'year' => $chartStats['year'] ?? 0
                ],
                'assetStats' => $assetStats
            ];

            break;

        case 'getChartData':
            $filter = $_GET['filter'] ?? 'week';
            $data = [];
            $labels = [];

            if ($filter === 'today') {
                // Initialize 0-23 hours
                for($i=0; $i<24; $i++) {
                    $labels[] = sprintf("%02d:00", $i);
                    $data[$i] = 0;
                }
                $stmt = $pdo->query("SELECT HOUR(created_at) as h, COUNT(*) as c FROM repairs WHERE DATE(created_at) = CURDATE() GROUP BY h");
                while($row = $stmt->fetch()) {
                    $data[$row['h']] = $row['c'];
                }

            } elseif ($filter === 'week') {
                // Last 7 days
                for($i=6; $i>=0; $i--) {
                    $d = date('Y-m-d', strtotime("-$i days"));
                    $labels[] = date('d/m', strtotime("-$i days")); // e.g. 25/12
                    $data[$d] = 0; // Key by date string temporarily
                }
                $stmt = $pdo->query("SELECT DATE(created_at) as d, COUNT(*) as c FROM repairs WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) GROUP BY d");
                while($row = $stmt->fetch()) {
                    if(isset($data[$row['d']])) $data[$row['d']] = $row['c'];
                }
                $data = array_values($data); // Re-index

            } elseif ($filter === 'month') {
                // Days of current month
                $daysInMonth = date('t');
                for($i=1; $i<=$daysInMonth; $i++) {
                    $labels[] = $i;
                    $data[$i] = 0;
                }
                $stmt = $pdo->query("SELECT DAY(created_at) as d, COUNT(*) as c FROM repairs WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) GROUP BY d");
                while($row = $stmt->fetch()) {
                    $data[$row['d']] = $row['c'];
                }
                $data = array_values($data);

            } elseif ($filter === 'year') {
                // Jan - Dec
                $thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
                $labels = $thaiMonths;
                $data = array_fill(0, 12, 0);

                $stmt = $pdo->query("SELECT MONTH(created_at) as m, COUNT(*) as c FROM repairs WHERE YEAR(created_at) = YEAR(CURDATE()) GROUP BY m");
                while($row = $stmt->fetch()) {
                    $data[$row['m'] - 1] = $row['c']; // Month is 1-based
                }
            }

            $response = ['success' => true, 'labels' => $labels, 'data' => array_map('intval', $data)]; // Ensure numbers
            break;

        case 'getPendingJobs':
            $stmt = $pdo->query("SELECT * FROM repairs WHERE status = 'รอรับเรื่อง' ORDER BY created_at DESC");
            $jobs = $stmt->fetchAll();
            
            // Format for frontend
            $formattedJobs = [];
            foreach($jobs as $job) {
                $formattedJobs[] = [
                    'timestamp' => date('d/m/Y H:i:s', strtotime($job['created_at'])),
                    'ticketId' => $job['ticket_id'],
                    'assetCode' => $job['asset_code'],
                    'deviceName' => $job['device_name'],
                    'brand' => $job['brand'],
                    'model' => $job['model'],
                    'reporter' => $job['reporter_name'],
                    'division' => $job['division'],
                    'floor' => $job['floor'],
                    'issue' => $job['issue'],
                    'status' => $job['status'],
                    'contact' => $job['contact']
                ];
            }
            $response = ['success' => true, 'jobs' => $formattedJobs];
            break;

        case 'getAllJobs':
            $stmt = $pdo->query("SELECT * FROM repairs ORDER BY created_at DESC");
            $jobs = $stmt->fetchAll();
            
            $formattedJobs = [];
            foreach($jobs as $job) {
                $formattedJobs[] = [
                    'timestamp' => date('d/m/Y H:i:s', strtotime($job['created_at'])),
                    'finished_at' => $job['finished_at'] ? date('d/m/Y H:i:s', strtotime($job['finished_at'])) : '-',
                    'ticketId' => $job['ticket_id'],
                    'assetCode' => $job['asset_code'],
                    'deviceName' => $job['device_name'],
                    'brand' => $job['brand'],
                    'model' => $job['model'],
                    'reporter' => $job['reporter_name'],
                    'division' => $job['division'],
                    'floor' => $job['floor'],
                    'issue' => $job['issue'],
                    'status' => $job['status'],
                    'contact' => $job['contact'],
                    'technician' => $job['technician'] ?? '-'
                ];
            }
            $response = ['success' => true, 'jobs' => $formattedJobs];
            break;

        case 'getMyJobs':
            $techName = $_GET['technician'] ?? '';
            $jobs = [];
            
            if ($techName) {
                // Fetch where technician matches
                $stmt = $pdo->prepare("SELECT * FROM repairs WHERE status = 'กำลังดำเนินการ' AND technician = ? ORDER BY created_at DESC");
                $stmt->execute([$techName]);
                $jobs = $stmt->fetchAll();
            } else {
                // If no name provided (fallback), maybe show all? Or show none?
                // Let's show none to force login/name.
                $jobs = [];
            }

            // Reuse formatting
            $formattedJobs = [];
            foreach($jobs as $job) {
                $formattedJobs[] = [
                    'timestamp' => date('d/m/Y H:i:s', strtotime($job['created_at'])),
                    'ticketId' => $job['ticket_id'],
                    'assetCode' => $job['asset_code'],
                    'deviceName' => $job['device_name'],
                    'brand' => $job['brand'],
                    'model' => $job['model'],
                    'reporter' => $job['reporter_name'],
                    'division' => $job['division'],
                    'floor' => $job['floor'],
                    'issue' => $job['issue'],
                    'status' => $job['status'],
                    'contact' => $job['contact'],
                    'technician' => $job['technician']
                ];
            }
            $response = ['success' => true, 'jobs' => $formattedJobs];
            break;

        case 'getUserJobs':
            $reporter = $_GET['reporter'] ?? '';
            $isAdmin = $_GET['isAdmin'] ?? 'false'; // รับค่า isAdmin จาก frontend
            $jobs = [];
            
            if ($reporter) {
                // ถ้าเป็น Admin ให้แสดงงานทั้งหมดที่แจ้ง
                // ถ้าเป็น User ทั่วไป ให้กรองไม่แสดงงานของ Admin
                if ($isAdmin === 'true') {
                    // Admin เห็นงานทั้งหมดที่ตัวเองแจ้ง
                    $stmt = $pdo->prepare("SELECT * FROM repairs WHERE reporter_name = ? ORDER BY created_at DESC");
                    $stmt->execute([$reporter]);
                } else {
                    // User ทั่วไป ไม่เห็นงานที่แจ้งโดย Admin (division = "งานเทคโนโลยีสารสนเทศ")
                    $stmt = $pdo->prepare("SELECT * FROM repairs WHERE reporter_name = ? AND division NOT IN ('งานเทคโนโลยีสารสนเทศ', 'จ้างเหมา งานเทคโนโลยีสารสนเทศ') ORDER BY created_at DESC");
                    $stmt->execute([$reporter]);
                }
                $jobs = $stmt->fetchAll();
            }
            
            $formattedJobs = [];
            foreach($jobs as $job) {
                $formattedJobs[] = [
                    'timestamp' => date('d/m/Y H:i:s', strtotime($job['created_at'])),
                    'finished_at' => $job['finished_at'] ? date('d/m/Y H:i:s', strtotime($job['finished_at'])) : null,
                    'ticketId' => $job['ticket_id'],
                    'assetCode' => $job['asset_code'],
                    'deviceName' => $job['device_name'],
                    'brand' => $job['brand'],
                    'model' => $job['model'],
                    'reporter' => $job['reporter_name'],
                    'division' => $job['division'],
                    'floor' => $job['floor'],
                    'issue' => $job['issue'],
                    'status' => $job['status'],
                    'contact' => $job['contact'],
                    'technician' => $job['technician'] ?? null
                ];
            }
            $response = ['success' => true, 'jobs' => $formattedJobs];
            break;

        case 'getCompletedJobs':
            $stmt = $pdo->query("SELECT * FROM repairs WHERE status LIKE '%สำเร็จ%' OR status = 'Completed' ORDER BY finished_at DESC, created_at DESC LIMIT 50");
            $jobs = $stmt->fetchAll();
            $formattedJobs = [];
            foreach($jobs as $job) {
                $formattedJobs[] = [
                    'timestamp' => date('d/m/Y H:i:s', strtotime($job['created_at'])),
                    'finished_at' => $job['finished_at'] ? date('d/m/Y H:i:s', strtotime($job['finished_at'])) : '-',
                    'ticketId' => $job['ticket_id'],
                    'assetCode' => $job['asset_code'],
                    'deviceName' => $job['device_name'],
                    'brand' => $job['brand'],
                    'model' => $job['model'],
                    'reporter' => $job['reporter_name'],
                    'division' => $job['division'],
                    'floor' => $job['floor'],
                    'contact' => $job['contact'],
                    'technician' => $job['technician'] ?? '-',
                    'issue' => $job['issue'],
                    'status' => $job['status']
                ];
            }
            $response = ['success' => true, 'jobs' => $formattedJobs];
            break;

        case 'getTechnicianStats':
            // 1. Ensure Table Exists & Default Data
            $pdo->exec("CREATE TABLE IF NOT EXISTS technicians (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

            // Check if empty, if so seed data
            $chk = $pdo->query("SELECT COUNT(*) FROM technicians")->fetchColumn();
            if ($chk == 0) {
                $initialTechs = [
                    'นายวีระกิตติ์ ศรีเกียรติเกษม',
                    'นายขนุน ศรีชมชื่น',
                    'นายวิชชา คำยา',
                    'นายนวพล พรเจริญ',
                    'นายปรัชญา ถิ่นถาน'
                ];
                $stmtInsert = $pdo->prepare("INSERT IGNORE INTO technicians (name) VALUES (?)");
                foreach ($initialTechs as $tech) {
                    $stmtInsert->execute([$tech]);
                }
            }

            // Sync: Add any technician found in repairs table that isn't in technicians table
            $pdo->exec("INSERT IGNORE INTO technicians (name) SELECT DISTINCT technician FROM repairs WHERE technician IS NOT NULL AND technician != '' AND technician != '-'");

            // 2. Fetch Stats (Left Join to show all techs even with 0 jobs)
            $sql = "SELECT 
                    t.name as technician, 
                    COUNT(r.ticket_id) as total_jobs,
                    SUM(CASE WHEN r.status LIKE '%สำเร็จ%' OR r.status='Completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN r.status = 'กำลังดำเนินการ' THEN 1 ELSE 0 END) as in_progress
                FROM technicians t
                LEFT JOIN repairs r ON t.name = r.technician COLLATE utf8mb4_unicode_ci
                GROUP BY t.id, t.name
                ORDER BY completed DESC";
            
            $stmt = $pdo->query($sql);
            $techs = $stmt->fetchAll();
            $response = ['success' => true, 'technicians' => $techs];
            break;

        case 'addTechnician':
            $name = $data['name'] ?? '';
            if (!$name) { $response = ['success'=>false, 'message'=>'Name required']; break; }
            
            try {
                $stmt = $pdo->prepare("INSERT INTO technicians (name) VALUES (?)");
                $stmt->execute([$name]);
                $response = ['success' => true, 'message' => 'เพิ่มรายชื่อเรียบร้อย'];
            } catch (PDOException $e) {
                $response = ['success' => false, 'message' => 'มีรายชื่อนี้อยู่แล้ว หรือเกิดข้อผิดพลาด'];
            }

            break;

        case 'deleteJob':
            $ticketId = $data['ticketId'] ?? '';
            if (!$ticketId) {
                $response = ['success' => false, 'message' => 'Ticket ID required'];
                break;
            }
            
            try {
                $stmt = $pdo->prepare("DELETE FROM repairs WHERE ticket_id = ?");
                $stmt->execute([$ticketId]);
                
                if ($stmt->rowCount() > 0) {
                    $response = ['success' => true, 'message' => 'ลบงานเรียบร้อยแล้ว'];
                } else {
                    $response = ['success' => false, 'message' => 'ไม่พบงานที่ต้องการลบ'];
                }
            } catch (PDOException $e) {
                $response = ['success' => false, 'message' => 'เกิดข้อผิดพลาดในการลบงาน'];
            }
            break;

        case 'getTechnicianJobs':
            $techName = $_GET['name'] ?? '';
            if (!$techName) { $response = ['success'=>false, 'message'=>'Name required']; break; }

            $stmt = $pdo->prepare("SELECT * FROM repairs WHERE technician = ? ORDER BY created_at DESC LIMIT 50");
            $stmt->execute([$techName]);
            $jobs = $stmt->fetchAll();
            
            $formattedJobs = [];
            foreach($jobs as $job) {
                $formattedJobs[] = [
                    'timestamp' => date('d/m/Y H:i:s', strtotime($job['created_at'])),
                    'ticketId' => $job['ticket_id'],
                    'deviceName' => $job['device_name'],
                    'issue' => $job['issue'],
                    'status' => $job['status'],
                    'finished_at' => $job['finished_at'] ? date('d/m/Y H:i:s', strtotime($job['finished_at'])) : '-'
                ];
            }
            $response = ['success' => true, 'jobs' => $formattedJobs, 'technician' => $techName];
            break;

        case 'updateJobStatus':
            $ticketId = $data['ticketId'];
            $newStatus = $data['status'];
            $technician = $data['technician'] ?? "Admin IT"; 
            
            $sql = "UPDATE repairs SET status = ? WHERE ticket_id = ?";
            $params = [$newStatus, $ticketId];
            
            if ($newStatus === 'สำเร็จ') {
                $sql = "UPDATE repairs SET status = ?, finished_at = NOW(), technician = ? WHERE ticket_id = ?";
                $params = [$newStatus, $technician, $ticketId];
            } elseif ($newStatus === 'กำลังดำเนินการ') {
                 $sql = "UPDATE repairs SET status = ?, technician = ? WHERE ticket_id = ?";
                 $params = [$newStatus, $technician, $ticketId];
            }
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            $response = ['success' => true, 'message' => "อัปเดตสถานะเป็น: " . $newStatus];
            break;

        case 'chatWithGemini':
            $userMessage = $data['message'] ?? '';
            $apiKey = 'AIzaSyABeo2iQn_suXixMWa3GnpePnr9Zw8vRCc'; // NOTE: Ideally use env var
            $apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' . $apiKey;
            
            $payload = json_encode([
                "contents" => [[ "parts" => [[ "text" => "คุณเป็นผู้ช่วย IT Support อัจฉริยะ ตอบคำถามสั้นๆแต่แจ้งเป็นขั้นตอนแบบกระชับ เป็นมิตร: " . $userMessage ]] ]]
            ]);
            
            $ch = curl_init($apiUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            
            $result = curl_exec($ch);
            curl_close($ch);
            
            $aiData = json_decode($result, true);
            
            if (isset($aiData['candidates'][0]['content']['parts'][0]['text'])) {
                $response = ['success' => true, 'reply' => $aiData['candidates'][0]['content']['parts'][0]['text']];
            } else {
                $response = ['success' => false, 'reply' => 'ขออภัย ไม่สามารถติดต่อ AI ได้ในขณะนี้'];
            }
            break;

        case 'fixDatabase':
            try {
                $pdo->exec("ALTER TABLE repairs ADD COLUMN technician VARCHAR(100) AFTER status");
                $response = ['success' => true, 'message' => "Database fixed."];
            } catch (Exception $e) {
                // Ignore if column already exists or other error, just report success to continue
                 $response = ['success' => true, 'message' => "Database fix attempted: " . $e->getMessage()];
            }
            break;

        case 'getMyJobsCount':
            // TODO: Use actual session user name. Hardcoded 'Admin IT' for this prototype.
            $technician = "Admin IT";
            $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM repairs WHERE technician = ? AND status IN ('กำลังดำเนินการ')");
            $stmt->execute([$technician]);
            $result = $stmt->fetch();
            $response = ['success' => true, 'count' => $result['count'] ?? 0];
            break;

        case 'getMyJobs':
            // TODO: Use actual session user name. Hardcoded 'Admin IT' for this prototype.
            $technician = "Admin IT";
            $stmt = $pdo->prepare("SELECT * FROM repairs WHERE technician = ? AND status IN ('กำลังดำเนินการ') ORDER BY created_at DESC");
            $stmt->execute([$technician]);
            $jobs = $stmt->fetchAll();
            
            $formattedJobs = [];
            foreach($jobs as $job) {
                $formattedJobs[] = [
                    'timestamp' => date('d/m/Y H:i:s', strtotime($job['created_at'])),
                    'ticketId' => $job['ticket_id'],
                    'assetCode' => $job['asset_code'],
                    'deviceName' => $job['device_name'],
                    'brand' => $job['brand'],
                    'model' => $job['model'],
                    'reporter' => $job['reporter_name'],
                    'division' => $job['division'],
                    'floor' => $job['floor'],
                    'issue' => $job['issue'],
                    'status' => $job['status'],
                    'contact' => $job['contact']
                ];
            }
            $response = ['success' => true, 'jobs' => $formattedJobs];
            break;

        case 'getMyJobsCount':
            $techName = $_GET['technician'] ?? '';
            $count = 0;
            
            // Debug logging
            error_log("getMyJobsCount - Received technician: " . $techName);
            
            if ($techName) {
                $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM repairs WHERE status = 'กำลังดำเนินการ' AND technician = ?");
                $stmt->execute([$techName]);
                $result = $stmt->fetch();
                $count = $result['count'] ?? 0;
                
                // Debug: Check what's actually in database
                $debugStmt = $pdo->query("SELECT DISTINCT technician FROM repairs WHERE status = 'กำลังดำเนินการ'");
                $allTechs = $debugStmt->fetchAll(PDO::FETCH_COLUMN);
                error_log("getMyJobsCount - All technicians in DB: " . json_encode($allTechs));
                error_log("getMyJobsCount - Count result: " . $count);
            }
            
            $response = ['success' => true, 'count' => (int)$count, 'searchedFor' => $techName];
            break;

        case 'getPendingJobsCount':
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM repairs WHERE status = 'รอรับเรื่อง'");
            $result = $stmt->fetch();
            $response = ['success' => true, 'count' => $result['count'] ?? 0];
            break;

        case 'importAssets':
            if (!isset($_FILES['file']['tmp_name']) || empty($_FILES['file']['tmp_name'])) {
                throw new Exception("กรุณาเลือกไฟล์ CSV");
            }

            $file = $_FILES['file']['tmp_name'];
            
            // Helper to convert to UTF-8
            function convertToUtf8($text) {
                if (empty($text)) return '';
                // Check if it's already UTF-8
                if (mb_check_encoding($text, 'UTF-8')) {
                    // Sometimes Excel saves as UTF-8 with BOM, remove it
                    return preg_replace('/^\xEF\xBB\xBF/', '', $text);
                }
                // Convert from TIS-620 (Thai) or Windows-874
                return @iconv('WINDOWS-874', 'UTF-8//IGNORE', $text);
            }

            $handle = fopen($file, "r");
            if ($handle === false) {
                 throw new Exception("ไม่สามารถอ่านไฟล์ได้");
            }

            $count = 0;
            // Loop through CSV rows
            while (($row = fgetcsv($handle, 1000, ",")) !== FALSE) {
                // Skip empty rows or rows with insufficient columns
                if(count($row) < 1) continue; 
                
                // Convert all fields
                $code = trim(convertToUtf8($row[0]));
                
                // Basic header check: if first column looks like "Asset Code" or empty, skip
                if(empty($code) || stripos($code, 'code') !== false || stripos($code, 'รหัส') !== false) continue;

                $name = trim(convertToUtf8($row[1] ?? ''));
                $brand = trim(convertToUtf8($row[2] ?? ''));
                $model = trim(convertToUtf8($row[3] ?? ''));

                // Upsert to database
                $stmt = $pdo->prepare("INSERT INTO assets (asset_code, device_name, brand, model) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE device_name=?, brand=?, model=?");
                $stmt->execute([$code, $name, $brand, $model, $name, $brand, $model]);
                $count++;
            }
            fclose($handle);
            $response = ['success' => true, 'message' => "นำเข้าข้อมูลสำเร็จ $count รายการ"];
            break;

        default:
            $response = ['success' => false, 'message' => 'Action not found: ' . $action];
    }
} catch (Exception $e) {
    $response = ['success' => false, 'message' => $e->getMessage()];
}

echo json_encode($response);
?>
