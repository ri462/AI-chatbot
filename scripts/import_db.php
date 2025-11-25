<?php
require __DIR__ . '/../root/db_connect.php';
$sqlFile = __DIR__ . '/../root/db.sql';
if (!file_exists($sqlFile)) {
    echo "SQL file not found: $sqlFile\n";
    exit(1);
}
$sql = file_get_contents($sqlFile);
// crude split on semicolon
$stmts = array_filter(array_map('trim', explode(';', $sql)));
foreach ($stmts as $i => $stmt) {
    if ($stmt === '') continue;
    try {
        $pdo->exec($stmt);
        echo "OK: statement $i\n";
    } catch (PDOException $e) {
        echo "ERROR stmt $i: " . $e->getMessage() . "\n";
    }
}
