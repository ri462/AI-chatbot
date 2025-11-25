<?php
function http_get($url, &$outHeaders = null, &$cookieFile = null){
    $ch = curl_init($url);
    $cookieFile = tempnam(sys_get_temp_dir(), 'ck');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieFile);
    curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieFile);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $body = curl_exec($ch);
    $outHeaders = curl_getinfo($ch);
    curl_close($ch);
    return [$body, $cookieFile];
}
function http_post($url, $postFields, $cookieFile){
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
    curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieFile);
    curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieFile);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $resp = curl_exec($ch);
    $info = curl_getinfo($ch);
    curl_close($ch);
    return [$resp, $info];
}
$base = 'http://localhost/AI-chatbot/root/login.php';
list($body, $cookieFile) = http_get($base, $info, $cookieFile);
if (!$body) { echo "GET failed\n"; exit(1); }
if (preg_match('/name="token" value="([^"]+)"/', $body, $m)){
    $token = $m[1];
    echo "Token: $token\n";
} else {
    echo "Token not found\n";
    exit(1);
}
$post = [
    'name' => 'testuser',
    'password' => 'Password123',
    'token' => $token
];
list($resp, $info) = http_post($base, $post, $cookieFile);
echo "HTTP_CODE: " . $info['http_code'] . "\n";
// print headers (split)
$hEnd = strpos($resp, "\r\n\r\n");
$headers = substr($resp, 0, $hEnd);
echo "---HEADERS---\n". $headers ."\n";
// check for Set-Cookie
if (preg_match('/Set-Cookie: ([^;\r\n]+)/i', $headers, $mc)){
    echo "Set-Cookie: " . $mc[1] . "\n";
}
// print a small portion of body for debugging
$bodyPart = substr($resp, $hEnd === false ? 0 : $hEnd+4, 800);
echo "---BODY PREVIEW---\n" . $bodyPart . "\n";
// cleanup
@unlink($cookieFile);
