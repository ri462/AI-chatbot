<?php
//ファイルの読み込み
require_once "db_connect.php";
require_once "functions.php";

//セッションの開始
session_start();

//POSTされてきたデータを格納する変数の定義と初期化
$datas = [
    'name'  => '',
    'password'  => '',
    'confirm_password'  => ''
];
$errors = [];

//GET通信だった場合はセッション変数にトークンを追加
if($_SERVER['REQUEST_METHOD'] != 'POST'){
    setToken();
}
//POST通信だった場合はDBへの新規登録処理を開始
if($_SERVER["REQUEST_METHOD"] == "POST"){
    //CSRF対策
    checkToken();

    // POSTされてきたデータを変数に格納
    foreach($datas as $key => $value) {
        if($value = filter_input(INPUT_POST, $key, FILTER_DEFAULT)) {
            $datas[$key] = $value;
        }
    }

    // バリデーション
    $errors = validation($datas);

    //データベースの中に同一ユーザー名が存在していないか確認
    if(empty($errors['name'])){
    $sql = "SELECT id FROM users WHERE name = :name";
        $stmt = $pdo->prepare($sql);
    // ユーザー名は文字列のため PARAM_STR を使用
    $stmt->bindValue('name', $datas['name'], PDO::PARAM_STR);
        $stmt->execute();
        if($row = $stmt->fetch(PDO::FETCH_ASSOC)){
            $errors['name'] = 'この名前は既に使用されています';
        }
    }
    //エラーがなかったらDBへの新規登録を実行
    if(empty($errors)){
        $params = [
            'id' =>null,
            'name'=>$datas['name'],
            'password'=>password_hash($datas['password'], PASSWORD_DEFAULT),
            'created_at'=>null
        ];

        $count = 0;
        $columns = '';
        $values = '';
        foreach (array_keys($params) as $key) {
            if($count > 0){
                $columns .= ',';
                $values .= ',';
            }
            $columns .= $key;
            $values .= ':'.$key;
            $count++;
        }

        $pdo->beginTransaction();//トランザクション処理
        try {
            $sql = 'insert into users ('.$columns .')values('.$values.')';
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $pdo->commit();
            header("location: login.php");
            exit;
        } catch (PDOException $e) {
            echo 'ERROR: Could not register.';
            $pdo->rollBack();
        }
    }
}
?>
 
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>ChatBot | アカウント作成</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    <link rel="stylesheet" href="css/register.css">
</head>
<body>
    <div class="container-narrow">
        <div class="title">ChatBot</div>
        <div class="subtitle">アカウントの作成</div>
        <div class="note">このアプリに登録するには<br>ユーザーネームとパスワードを入力してください</div>

        <form id="registerForm" action="<?php echo $_SERVER ['SCRIPT_NAME']; ?>" method="post" novalidate>
            <input type="hidden" name="token" value="<?php echo h($_SESSION['token']); ?>">
            <!-- 確認用パスワードは非表示。送信時にパスワードと同値を入れる -->
            <input type="hidden" name="confirm_password" id="confirm_password_hidden" value="">

            <div class="form-group">
                <input type="text" name="name" class="form-control input-style <?php echo (!empty($errors['name'])) ? 'is-invalid' : ''; ?>" placeholder="username" value="<?php echo h($datas['name']); ?>">
                <?php if(!empty($errors['name'])): ?><div class="error"><?php echo h($errors['name']); ?></div><?php endif; ?>
            </div>
            <div class="form-group">
                <input type="password" name="password" id="password_input" class="form-control input-style <?php echo (!empty($errors['password'])) ? 'is-invalid' : ''; ?>" placeholder="password" value="">
                <?php if(!empty($errors['password'])): ?><div class="error"><?php echo h($errors['password']); ?></div><?php endif; ?>
                <?php if(!empty($errors['confirm_password'])): ?><div class="error"><?php echo h($errors['confirm_password']); ?></div><?php endif; ?>
            </div>

            <button type="submit" class="btn btn-black w-100">新規登録</button>
            <div class="space-8"></div>
            <a class="btn btn-black w-100" href="login.php">ログインはこちらへ</a>
            <div class="space-8"></div>
            <a class="btn btn-black w-100" href="http://localhost:3000/?guest=1">登録せずに利用</a>
        </form>
    </div>

        <script>
            // 送信直前に confirm_password を password と同じに設定（純粋なJS）
            var form = document.getElementById('registerForm');
            if (form) {
                form.addEventListener('submit', function() {
                    var pwInput = document.getElementById('password_input');
                    var hidden = document.getElementById('confirm_password_hidden');
                    var pw = pwInput && 'value' in pwInput ? pwInput.value : '';
                    if (hidden && 'value' in hidden) hidden.value = pw;
                });
            }
        </script>
</body>
</html>
