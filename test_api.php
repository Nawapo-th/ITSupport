<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    require_once 'config/db_connect.php';
    
    $action = $_GET['action'] ?? '';
    
    if ($action === 'testPending') {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM repairs WHERE status = 'รอรับเรื่อง'");
        $result = $stmt->fetch();
        echo json_encode(['success' => true, 'count' => (int)$result['count'], 'status' => 'รอรับเรื่อง']);
    } elseif ($action === 'testMyJobs') {
        $techName = $_GET['technician'] ?? 'Admin IT';
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM repairs WHERE status = 'กำลังดำเนินการ' AND technician = ?");
        $stmt->execute([$techName]);
        $result = $stmt->fetch();
        echo json_encode(['success' => true, 'count' => (int)$result['count'], 'technician' => $techName, 'status' => 'กำลังดำเนินการ']);
    } elseif ($action === 'listAll') {
        $stmt = $pdo->query("SELECT ticket_id, status, technician FROM repairs ORDER BY created_at DESC LIMIT 10");
        $jobs = $stmt->fetchAll();
        echo json_encode(['success' => true, 'jobs' => $jobs]);
    } else {
        echo json_encode(['error' => 'Unknown action', 'action' => $action]);
    }
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
}
?>
