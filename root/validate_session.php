<?php
// セッション状態をJSONで返すエンドポイント
// Next.js( http://localhost:3000 ) からのクロスサイト検証でも使えるようにCORS許可を付与

// セッションCookie属性を統一（Next.jsでも受け取れるように path=/, SameSite=Lax）
if (PHP_VERSION_ID >= 70300) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => false,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
} else {
    ini_set('session.cookie_path', '/');
    ini_set('session.cookie_secure', '0');
    ini_set('session.cookie_httponly', '1');
}
session_start();

header('Content-Type: application/json; charset=utf-8');

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
$allowed_origins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
];
if (in_array($origin, $allowed_origins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}

// Preflight対応
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if (in_array($origin, $allowed_origins, true)) {
        header('Access-Control-Allow-Methods: GET, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
    }
    http_response_code(204);
    exit;
}

$loggedIn = isset($_SESSION['loggedin']) && $_SESSION['loggedin'] === true;
$user = null;
if ($loggedIn) {
    $user = [
        'id' => isset($_SESSION['id']) ? $_SESSION['id'] : null,
        'name' => isset($_SESSION['name']) ? $_SESSION['name'] : null,
    ];
}

echo json_encode([
    'loggedIn' => $loggedIn,
    'user' => $user,
]);
