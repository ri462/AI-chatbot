<?php
require __DIR__ . '/../root/db_connect.php';
try {
    $stmt = $pdo->query("SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema='user_login'");
    $out = [];
    foreach ($stmt as $r) {
        $out[] = $r['TABLE_NAME'];
    }
    file_put_contents(__DIR__ . '/tables.txt', implode(PHP_EOL, $out) . PHP_EOL);
    echo "WROTE\n";
} catch (Exception $e) {
    echo 'ERROR: ' . $e->getMessage() . PHP_EOL;
}
