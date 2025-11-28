<?php
// Simple registration confirmation page — shows a message and then redirects to login
// Accepts optional `name` query param (URL-encoded) to show the registered username.
$name = isset($_GET['name']) ? htmlspecialchars(rawurldecode($_GET['name']), ENT_QUOTES, 'UTF-8') : '';
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>登録完了</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    <style>
        body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif; padding: 2rem; }
        .container-narrow { max-width:420px; margin:0 auto; }
        .title { font-size:28px; font-weight:700; margin-bottom:8px }
        .subtitle { font-size:18px; margin-bottom:12px }
    </style>
    <!-- Auto-redirect to login after 5 seconds -->
    <meta http-equiv="refresh" content="5;url=login.php">
</head>
<body>
    <div class="container-narrow">
        <div class="title">登録が完了しました</div>
        <div class="subtitle"><?php if($name): ?><?php echo $name; ?> さん、<?php endif; ?>ようこそ！</div>
        <p>アカウントの登録が完了しました。5秒後にログイン画面へ移動します。すぐに移動する場合は下のボタンを押してください。</p>

        <div style="margin-top:1rem">
            <a href="login.php" class="btn btn-black w-100" style="display:inline-block;padding:.6rem 1rem;background:#000;color:#fff;border-radius:6px;text-decoration:none">ログイン画面へ</a>
        </div>
    </div>
</body>
</html>
