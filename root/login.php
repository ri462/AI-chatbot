<?php
// 軽量化: GET(フォーム表示)では DB に接続しない。POST(ログイン処理)時のみ DB を読み込む。
require_once __DIR__ . '/functions.php';

// セッションCookie属性を統一（Next.js側でも送信されるように path=/, SameSite=Lax）
// 必ず session_start() の前に設定
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

// セッションが既にログイン済みであれば Next 側へリダイレクト
if (isset($_SESSION['loggedin']) && $_SESSION['loggedin'] === true) {
    header('Location: http://localhost:3000/');
    exit;
}

$datas = [ 'name' => '', 'password' => '', 'confirm_password' => '' ];
$errors = [];
$login_err = '';

// GET の場合はトークンを発行してフォーム表示
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    setToken();
} else {
    // POST: ログイン処理
    checkToken();

    // 必要な DB 接続ファイルをここで読み込む（GET 時は読み込まない）
    require_once __DIR__ . '/db_connect.php';

    // POSTデータ収集
    foreach ($datas as $key => $value) {
        $v = filter_input(INPUT_POST, $key, FILTER_DEFAULT);
        if ($v !== null && $v !== false) {
            $datas[$key] = $v;
        }
    }

    // バリデーション
    $errors = validation($datas, false);
    if (empty($errors)) {
        try {
            $sql = 'SELECT id,name,password FROM users WHERE name = :name';
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue('name', $datas['name'], PDO::PARAM_STR);
            $stmt->execute();
            if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                if (password_verify($datas['password'], $row['password'])) {
                    session_regenerate_id(true);
                    $_SESSION['loggedin'] = true;
                    $_SESSION['id'] = $row['id'];
                    $_SESSION['name'] = $row['name'];

                    // 簡易認証フラグCookie
                    if (PHP_VERSION_ID >= 70300) {
                        setcookie('chat_auth', '1', [ 'expires' => 0, 'path' => '/', 'domain' => '', 'secure' => false, 'httponly' => true, 'samesite' => 'Lax' ]);
                    } else {
                        setcookie('chat_auth', '1', 0, '/');
                    }

                    // リダイレクト
                    $redirectTo = 'http://localhost:3000/';
                    $postedNext = filter_input(INPUT_POST, 'next', FILTER_DEFAULT);
                    if (!empty($postedNext)) {
                        $redirectTo = $postedNext;
                    }
                    header('Location: ' . $redirectTo);
                    exit;
                } else {
                    $login_err = 'ユーザーネームまたはパスワードが無効です';
                }
            } else {
                $login_err = 'ユーザーネームまたはパスワードが無効です';
            }
        } catch (PDOException $e) {
            $login_err = 'データベース接続に失敗しました';
        }
    }
}
?>

<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ChatBot | ログイン</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    <link rel="stylesheet" href="css/register.css">
</head>
<body>
    <div class="container-narrow">
        <div class="title">ChatBot</div>
        <div class="subtitle">ログイン</div>
        <div class="note">ユーザーネームとパスワードを入力してください</div>

        <?php if (!empty($login_err)) : ?>
            <div class="error"><?php echo h($login_err); ?></div>
        <?php endif; ?>

        <?php
            // GET/POST混在時でも next を保持
            $next_from_post = filter_input(INPUT_POST, 'next', FILTER_DEFAULT);
            $next_from_get  = filter_input(INPUT_GET, 'next', FILTER_DEFAULT);
            $next_value     = $next_from_post ?: $next_from_get ?: '';
        ?>

        <form action="<?php echo $_SERVER['SCRIPT_NAME']; ?>" method="post" novalidate>
            <div class="form-group">
                <input type="text" name="name" class="form-control input-style <?php echo (!empty($errors['name'])) ? 'is-invalid' : ''; ?>" placeholder="ユーザー名" value="<?php echo h($datas['name']); ?>">
                <?php if(!empty($errors['name'])): ?><div class="error"><?php echo h($errors['name']); ?></div><?php endif; ?>
            </div>
            <div class="form-group">
                <input type="password" name="password" class="form-control input-style <?php echo (!empty($errors['password'])) ? 'is-invalid' : ''; ?>" placeholder="パスワード" value="">
                <?php if(!empty($errors['password'])): ?><div class="error"><?php echo h($errors['password']); ?></div><?php endif; ?>
            </div>
            <input type="hidden" name="token" value="<?php echo h($_SESSION['token'] ?? ''); ?>">
            <input type="hidden" name="next" value="<?php echo h($next_value); ?>">
            <button type="submit" class="btn btn-black w-100">ログイン</button>
        </form>
    </div>
</body>
</html>
