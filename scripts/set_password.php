<?php
require __DIR__ . '/../root/db_connect.php';
if ($argc < 3) {
    echo "Usage: php set_password.php username newpassword\n";
    exit(1);
}
$name = $argv[1];
$pwd = $argv[2];
$hash = password_hash($pwd, PASSWORD_DEFAULT);
try {
    $stmt = $pdo->prepare('UPDATE users SET password = :password WHERE name = :name');
    $stmt->execute(['password'=>$hash, 'name'=>$name]);
    echo "Updated password for: $name\n";
} catch (PDOException $e) {
    echo 'ERROR: ' . $e->getMessage() . "\n";
}
