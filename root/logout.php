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

// Next側の認証フラグCookieをクリア
setcookie('chat_auth', '', 0, '/');

//ログインページへリダイレクト
header("location: login.php");
exit;
