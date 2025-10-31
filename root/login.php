<?php
//ファイルの読み込み
require_once "db_connect.php";
require_once "functions.php";
// セッションCookie属性を統一（Next.js側でも送信されるように path=/, SameSite=Lax）
// 必ず session_start() の前に設定
if (PHP_VERSION_ID >= 70300) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => false, // ローカルHTTP開発のため false（HTTPS 時は true 推奨）
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
} else {
    ini_set('session.cookie_path', '/');
    ini_set('session.cookie_secure', '0');
    ini_set('session.cookie_httponly', '1');
    // 古いPHPでは samesite をヘッダ追加で対応することも可能
}
//セッション開始
session_start();

// 安全なリダイレクト先か簡易チェック（localhost/127.0.0.1 のみ許可）
function isSafeRedirect($url){
    $parts = parse_url($url);
    if ($parts === false) return false;
    $scheme = isset($parts['scheme']) ? strtolower($parts['scheme']) : 'http';
    $host = isset($parts['host']) ? strtolower($parts['host']) : '';
    if (!in_array($scheme,["http","https"],true)) return false;
    if (!in_array($host,["localhost","127.0.0.1"],true)) return false;
    return true;
}

// セッション変数 $_SESSION["loggedin"]を確認。ログイン済だったらチャット画面（Next.js）へリダイレクト
if(isset($_SESSION["loggedin"]) && $_SESSION["loggedin"] === true){
    $next_from_get  = filter_input(INPUT_GET, 'next', FILTER_DEFAULT);
    if (!empty($next_from_get) && isSafeRedirect($next_from_get)) {
        header("location: " . $next_from_get);
    } else {
        header("location: http://localhost:3000/");
    }
    exit;
}

//POSTされてきたデータを格納する変数の定義と初期化
$datas = [
    'name'  => '',
    'password'  => '',
    'confirm_password'  => ''
];
$errors = [];
$login_err = "";

//GET通信だった場合はセッション変数にトークンを追加
if($_SERVER['REQUEST_METHOD'] != 'POST'){
    setToken();
}

//POST通信だった場合はログイン処理を開始
if($_SERVER["REQUEST_METHOD"] == "POST"){
    ////CSRF対策
    checkToken();

    // POSTされてきたデータを変数に格納
    foreach($datas as $key => $value) {
        if($value = filter_input(INPUT_POST, $key, FILTER_DEFAULT)) {
            $datas[$key] = $value;
        }
    }

    // バリデーション
    $errors = validation($datas,false);
    if(empty($errors)){
        //ユーザーネームから該当するユーザー情報を取得
        $sql = "SELECT id,name,password FROM users WHERE name = :name";
        $stmt = $pdo->prepare($sql);
    // ユーザー名は文字列のため PARAM_STR を使用
    $stmt->bindValue('name', $datas['name'], PDO::PARAM_STR);
        $stmt->execute();

        //ユーザー情報があれば変数に格納
        if($row = $stmt->fetch(PDO::FETCH_ASSOC)){
            //パスワードがあっているか確認
            if (password_verify($datas['password'],$row['password'])) {
                //セッションIDをふりなおす
                session_regenerate_id(true);
                //セッション変数にログイン情報を格納
                $_SESSION["loggedin"] = true;
                $_SESSION["id"] = $row['id'];
                $_SESSION["name"] =  $row['name'];
                // 簡易認証フラグCookie（Next側のリダイレクト抑制用）
                if (PHP_VERSION_ID >= 70300) {
                    setcookie('chat_auth', '1', [
                        'expires' => 0,
                        'path' => '/',
                        'domain' => '',
                        'secure' => false,
                        'httponly' => true,
                        'samesite' => 'Lax',
                    ]);
                } else {
                    setcookie('chat_auth', '1', 0, '/');
                }
                // リダイレクト先の決定（POSTのnextが安全であれば優先）
                $redirectTo = 'http://localhost:3000/';
                $postedNext = filter_input(INPUT_POST, 'next', FILTER_DEFAULT);
                if (!empty($postedNext) && isSafeRedirect($postedNext)) {
                    $redirectTo = $postedNext;
                }
                header("location: " . $redirectTo);
                exit();
            } else {
                $login_err = 'ユーザーネームまたはパスワードが無効です';
            }
        }else {
            $login_err = 'ユーザーネームまたはパスワードが無効です';
        }
    }
}
?>
 
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>ChatBot | ログイン</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    <link rel="stylesheet" href="css/register.css">
    <!-- register.css をログイン画面でも共用 -->
    </head>
<body>
    <div class="container-narrow">
        <div class="title">ChatBot</div>
        <div class="subtitle">ログイン</div>
        <div class="note">ユーザーネームとパスワードを入力してください</div>

        <?php 
        if(!empty($login_err)){
            echo '<div class="error">' . h($login_err) . '</div>';
        }
        ?>

        <?php 
            // GET/POST混在時でも next を保持
            $next_from_post = filter_input(INPUT_POST, 'next', FILTER_DEFAULT);
            $next_from_get  = filter_input(INPUT_GET, 'next', FILTER_DEFAULT);
            $next_value     = $next_from_post ?: $next_from_get ?: '';
        ?>

        <form action="<?php echo $_SERVER ['SCRIPT_NAME']; ?>" method="post" novalidate>
            <div class="form-group">
                <input type="text" name="name" class="form-control input-style <?php echo (!empty($errors['name'])) ? 'is-invalid' : ''; ?>" placeholder="address" value="<?php echo h($datas['name']); ?>">
                <?php if(!empty($errors['name'])): ?><div class="error"><?php echo h($errors['name']); ?></div><?php endif; ?>
            </div>
            <div class="form-group">
                <input type="password" name="password" class="form-control input-style <?php echo (!empty($errors['password'])) ? 'is-invalid' : ''; ?>" placeholder="password" value="">
                <?php if(!empty($errors['password'])): ?><div class="error"><?php echo h($errors['password']); ?></div><?php endif; ?>
            </div>
            <input type="hidden" name="token" value="<?php echo h($_SESSION['token']); ?>">
            <input type="hidden" name="next" value="<?php echo h($next_value); ?>">
            <button type="submit" class="btn btn-black w-100">続行</button>
        </form>
    </div>
</body>
</html>
