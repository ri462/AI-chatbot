<?php
require __DIR__ . '/../root/db_connect.php';
$name = 'testuser';
$pwd = 'Password123';
$hash = password_hash($pwd, PASSWORD_DEFAULT);
try {
    $stmt = $pdo->prepare('INSERT INTO users (name,password) VALUES (:name,:password)');
    $stmt->execute(['name'=>$name, 'password'=>$hash]);
    echo "Inserted user: $name\n";
} catch (PDOException $e) {
    echo 'ERROR: ' . $e->getMessage() . "\n";
}
