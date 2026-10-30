<?php
declare(strict_types=1);
/*
  お問い合わせフォームの受け取り用プログラム（PHP 7.4 以上を想定。未確認：Xserver 側の PHP バージョンは公開時に確認）
  前提：同じフォルダに send_config.php がある（send_config.sample.php をコピーして作る）。
  動き：入力を検査 → 迷惑送信でないか確認 → お店のメールアドレスへ送る → 結果を返す。
*/
mb_language('Japanese');
mb_internal_encoding('UTF-8');
date_default_timezone_set('Asia/Tokyo');

header('X-Robots-Tag: noindex');
header('Cache-Control: no-store');

$isAjax = (($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'fetch');

function respond(bool $ok, string $message, int $status = 200): void {
    global $isAjax;
    http_response_code($status);
    if ($isAjax) {
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE);
        exit;
    }
    header('Content-Type: text/html; charset=UTF-8');
    $m = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
    $t = $ok ? 'お問い合わせを受け付けました' : '送信できませんでした';
    echo '<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
       . '<meta name="robots" content="noindex"><title>' . $t . '｜スキップ</title>'
       . '<style>body{font-family:sans-serif;max-width:560px;margin:48px auto;padding:0 16px;line-height:1.8;color:#14284B}a{color:#14284B}</style></head><body>'
       . '<h1>' . $t . '</h1><p>' . $m . '</p><p><a href="./">トップページへ戻る</a></p></body></html>';
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(false, 'このページは、フォームから送信されたときだけ使います。', 405);
}

// 設定の読み込み
$cfgPath = __DIR__ . '/send_config.php';
$cfg = is_file($cfgPath) ? include $cfgPath : null;
if (!is_array($cfg) || empty($cfg['to']) || empty($cfg['from'])
    || !filter_var($cfg['to'], FILTER_VALIDATE_EMAIL) || !filter_var($cfg['from'], FILTER_VALIDATE_EMAIL)) {
    error_log('[skip-form] send_config.php が無い、または内容が正しくありません');
    respond(false, '現在、フォームが利用できません。お手数ですが、お電話でご連絡ください。', 500);
}

// 別のサイトからの送信を拒否（Origin または Referer のホストが、このサイトと同じか確認）
$host = $_SERVER['HTTP_HOST'] ?? '';
$from = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? '');
if ($from !== '') {
    $fh = parse_url($from, PHP_URL_HOST);
    $hh = parse_url('//' . $host, PHP_URL_HOST);
    if (!$fh || !$hh || strcasecmp($fh, $hh) !== 0) {
        respond(false, '送信元を確認できませんでした。', 403);
    }
}

// 迷惑送信対策 1：人には見えない欄に入力があれば、ロボットとみなす（成功したように見せて捨てる）
if (trim((string)($_POST['website'] ?? '')) !== '') {
    respond(true, '受け付けました。折り返しご連絡します。');
}

// 迷惑送信対策 2：ページを開いてから送信までが早すぎる／古すぎる場合は拒否（JS が付ける時刻。無い場合は検査を省く）
if (isset($_POST['t']) && $_POST['t'] !== '') {
    $el = time() - (int)floor(((float)$_POST['t']) / 1000);
    if ($el < 3 || $el > 86400) {
        respond(false, '送信に失敗しました。ページを読み込み直して、もう一度お試しください。', 400);
    }
}

// 迷惑送信対策 3：同じ接続元からの送信は 1時間に5回まで
$rlFile = sys_get_temp_dir() . '/skipform_' . hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|' . __DIR__);
$now = time();
$log = [];
if (is_file($rlFile)) {
    foreach (explode("\n", (string)file_get_contents($rlFile)) as $v) {
        if ($v !== '' && (int)$v > $now - 3600) $log[] = (int)$v;
    }
}
if (count($log) >= 5) {
    respond(false, '短い時間に送信が続いたため、いったん受け付けられません。しばらくしてから、またはお電話でご連絡ください。', 429);
}

// 入力の取り出しと検査
function clean(string $s, int $max, bool $multiline = false): string {
    $s = str_replace("\r\n", "\n", $s);
    $s = str_replace("\r", "\n", $s);
    $s = preg_replace($multiline ? '/[^\P{C}\n]/u' : '/\p{C}/u', '', $s) ?? '';  // 制御文字を除去（改行は本文のみ許可）
    $s = trim($s);
    return mb_substr($s, 0, $max);
}
$name = clean((string)($_POST['name'] ?? ''), 50);
$tel  = clean((string)($_POST['tel'] ?? ''), 20);
$kind = (string)($_POST['kind'] ?? '');
$body = clean((string)($_POST['body'] ?? ''), 2000, true);
$agree = !empty($_POST['agree']);

$errors = [];
if ($name === '') $errors[] = 'お名前を入力してください。';
$digits = preg_replace('/\D/', '', mb_convert_kana($tel, 'n', 'UTF-8')) ?? '';
if (strlen($digits) < 10 || strlen($digits) > 11) $errors[] = 'お電話番号は、10〜11桁の数字で入力してください。';
if (!in_array($kind, ['外壁', '屋根', '内装', 'わからない'], true)) $kind = 'わからない';
if (!$agree) $errors[] = '個人情報の利用目的への同意にチェックを入れてください。';
if ($errors) respond(false, implode(' ', $errors), 422);

// メールの作成（件名・宛先は固定。入力値はヘッダーに入れない＝ヘッダー注入を防ぐ）
$subject = '【' . ($cfg['site'] ?? 'スキップ') . '】ホームページからのお問い合わせ';
$text = "ホームページのフォームから、お問い合わせがありました。\n\n"
      . "お名前：" . $name . "\n"
      . "お電話：" . $tel . "\n"
      . "気になる箇所：" . $kind . "\n"
      . "ご相談内容：\n" . ($body !== '' ? $body : '（なし）') . "\n\n"
      . "受信日時：" . date('Y-m-d H:i:s') . "\n"
      . "※このメールには返信せず、お電話でご連絡ください。\n";

$headers = 'From: ' . $cfg['from'];
// -f で送信元（エンベロープ）も指定。拒否される環境では、第5引数を外す（未確認）
$sent = mb_send_mail($cfg['to'], $subject, $text, $headers, '-f' . $cfg['from']);
if (!$sent) {
    error_log('[skip-form] メール送信に失敗しました');
    respond(false, '送信できませんでした。お手数ですが、お電話でご連絡ください。', 500);
}

$log[] = $now;
@file_put_contents($rlFile, implode("\n", $log), LOCK_EX);

respond(true, '受け付けました。折り返しご連絡します。');
