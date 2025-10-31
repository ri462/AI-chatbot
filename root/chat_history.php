<?php
// チャット履歴 API
// GET  : 履歴取得（?limit=50）
// POST : 1件保存（JSON { role: 'user'|'assistant', content: '...' }）

require_once __DIR__ . '/db_connect.php';

// セッションCookie属性の統一（path=/, SameSite=Lax）
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
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if (in_array($origin, $allowed_origins, true)) {
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
    }
    http_response_code(204);
    exit;
}

// 認証チェック
if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
    http_response_code(401);
    echo json_encode(['error' => 'unauthorized']);
    exit;
}

$userId = isset($_SESSION['id']) ? intval($_SESSION['id']) : 0;
if ($userId <= 0) {
    http_response_code(401);
    echo json_encode(['error' => 'invalid-session']);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
        if ($limit <= 0 || $limit > 200) { $limit = 50; }

        $stmt = $pdo->prepare('SELECT role, content, created_at FROM chat_messages WHERE user_id = :uid ORDER BY id ASC LIMIT :lim');
        $stmt->bindValue(':uid', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['items' => $rows]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        $role = isset($data['role']) ? $data['role'] : '';
        $content = isset($data['content']) ? $data['content'] : '';

        if ($role !== 'user' && $role !== 'assistant') {
            http_response_code(400);
            echo json_encode(['error' => 'invalid-role']);
            exit;
        }
        if (!is_string($content) || $content === '') {
            http_response_code(400);
            echo json_encode(['error' => 'invalid-content']);
            exit;
        }

        $stmt = $pdo->prepare('INSERT INTO chat_messages (user_id, role, content) VALUES (:uid, :role, :content)');
        $stmt->bindValue(':uid', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':role', $role, PDO::PARAM_STR);
        $stmt->bindValue(':content', $content, PDO::PARAM_STR);
        $stmt->execute();

        echo json_encode(['ok' => true]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'method-not-allowed']);
    exit;
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'server-error', 'message' => $e->getMessage()]);
    exit;
}
