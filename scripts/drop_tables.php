<?php
require __DIR__ . '/../root/db_connect.php';
$tables = ['chat_messages', 'users'];
foreach ($tables as $t) {
    try {
        $pdo->exec("DROP TABLE IF EXISTS `$t`");
        echo "Dropped (if existed): $t\n";
    } catch (PDOException $e) {
        echo "ERROR dropping $t: " . $e->getMessage() . "\n";
    }
}
