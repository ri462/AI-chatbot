<?php
// セッションCookie属性を統一（path=/, SameSite=Lax）
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

//セッション変数の削除
$_SESSION = array();
//セッション削除
session_destroy();

// Next側の認証フラグCookieを確実にクリア
if (PHP_VERSION_ID >= 70300) {
	setcookie('chat_auth', '', [ 'expires' => time() - 3600, 'path' => '/', 'domain' => '', 'secure' => false, 'httponly' => true, 'samesite' => 'Lax' ]);
} else {
	setcookie('chat_auth', '', time() - 3600, '/');
}

// セッションCookie（PHPSESSID）も削除しておく
$sessName = session_name();
if (isset($_COOKIE[$sessName])) {
	setcookie($sessName, '', time() - 3600, '/');
}

// ログインページへ絶対パスでリダイレクト（確実に http://localhost/AI-chatbot/root/login.php へ）
// NOTE: 実行環境に合わせてホスト/スキームを変更したい場合はここを編集してください。
header('Location: http://localhost/AI-chatbot/root/login.php');
exit;
