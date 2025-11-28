<?php
// Simple helper to list tables and report presence of expected tables.
require_once __DIR__ . '/db_connect.php';

try {
    $stmt = $pdo->query("SHOW TABLES");
    $tables = [];
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $tables[] = $row[0];
    }
} catch (Exception $e) {
    echo "ERROR: " . h($e->getMessage());
    exit;
}

header('Content-Type: text/plain; charset=UTF-8');
echo "Detected tables:\n";
foreach ($tables as $t) echo " - $t\n";

$want = ['users', 'chat_messages'];
foreach ($want as $w) {
    echo "\nChecking presence: $w -> " . (in_array($w, $tables) ? 'FOUND' : 'NOT FOUND') . "\n";
}

?>
