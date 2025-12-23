<?php
$host = "db";
$db   = "inventory_db";
$user = "root";
$pass = "nawapon1234";
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    // If database doesn't exist, try to create it (though docker-compose should handle this)
    throw new \PDOException($e->getMessage(), (int)$e->getCode());
}
?>
