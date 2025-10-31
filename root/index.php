<?php
// 最初にアクセスしたときは登録ページへ
$next = isset($_GET['next']) ? $_GET['next'] : '';
$target = 'register.php';
if (!empty($next)) {
    // nextをそのままregisterに渡す（ログインや登録後の戻り先用）
    $target .= '?next=' . urlencode($next);
}
header('Location: ' . $target, true, 302);
exit;
