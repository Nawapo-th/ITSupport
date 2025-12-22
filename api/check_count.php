<?php
header('Content-Type: application/json; charset=utf-8');
require '../config/db_connect.php';

$techName = $_GET['technician'] ?? '';
$count = 0;

if ($techName) {
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM repairs WHERE status = 'กำลังดำเนินการ' AND technician = ?");
    $stmt->execute([$techName]);
    $result = $stmt->fetch();
    $count = $result['count'] ?? 0;
    
    // Debug
    $debugStmt = $pdo->query("SELECT DISTINCT technician FROM repairs WHERE status = 'กำลังดำเนินการ'");
    $allTechs = $debugStmt->fetchAll(PDO::FETCH_COLUMN);
}

echo json_encode([
    'success' => true,
    'count' => (int)$count,
    'searchedFor' => $techName,
    'allTechnicians' => $allTechs ?? []
]);
?>
