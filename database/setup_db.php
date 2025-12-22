<?php
require '../config/db_connect.php';

try {
    $sql = file_get_contents(__DIR__ . '/schema.sql');
    $pdo->exec($sql);
    echo "Database schema initialized successfully.";
} catch (PDOException $e) {
    echo "Error initializing database: " . $e->getMessage();
}
?>
