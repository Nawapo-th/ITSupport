<?php
require 'config/db_connect.php';

echo "Adding 'technicians' table...\n";

try {
    $sql = "CREATE TABLE IF NOT EXISTS technicians (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    $pdo->exec($sql);
    echo "Table 'technicians' created or already exists.\n";

    // Initial Data
    $initialTechs = [
        'นายวีระกิตติ์ ศรีเกียรติเกษม',
        'นายขนุน ศรีชมชื่น',
        'นายวิชชา คำยา',
        'นายนวพล พรเจริญ',
        'นายปรัชญา ถิ่นถาน'
    ];

    $stmt = $pdo->prepare("INSERT IGNORE INTO technicians (name) VALUES (?)");
    foreach ($initialTechs as $tech) {
        $stmt->execute([$tech]);
    }
    echo "Initial technicians inserted.\n";

} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
}
?>
