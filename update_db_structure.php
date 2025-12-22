<?php
require 'api/config/db_connect.php';

try {
    $sql = "ALTER TABLE repairs ADD COLUMN technician VARCHAR(100) AFTER status";
    $pdo->exec($sql);
    echo "Column 'technician' added successfully.";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
