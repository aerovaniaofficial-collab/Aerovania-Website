<?php
// Shared helpers for the website's form endpoints (careers.php, contact.php).
// Mail is sent through Hostinger's own mail server with PHP mail(), so no
// password or third-party service is needed. The sender must be a mailbox
// that exists on aerovania.com in Hostinger.

if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    http_response_code(404);
    exit;
}

const RECEIVER_EMAIL = 'info@aerovania.com';   // where applications and enquiries arrive
const SENDER_EMAIL   = 'info@aerovania.com';   // must be a real aerovania.com mailbox

function respond(int $code, array $body): void
{
    http_response_code($code);
    header('Content-Type: application/json; charset=UTF-8');
    header('Cache-Control: no-store');
    echo json_encode($body);
    exit;
}

function require_post(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        header('Allow: POST');
        respond(405, ['success' => false, 'error' => 'Method not allowed.']);
    }
}

// One line of text: no line breaks (stops mail header injection), length capped.
function clean_line($value, int $max = 200): string
{
    $value = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', (string) $value);
    return mb_substr(trim($value), 0, $max);
}

// Multi-line text, length capped.
function clean_text($value, int $max = 5000): string
{
    $value = str_replace(["\r\n", "\r"], "\n", (string) $value);
    $value = preg_replace('/[\x00-\x08\x0B-\x1F\x7F]+/u', '', $value);
    return mb_substr(trim($value), 0, $max);
}

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function valid_email(string $email): bool
{
    return strlen($email) <= 254 && filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

// Simple per-IP limit so the forms can't be used to flood inboxes.
function rate_limited(string $bucket, int $max = 5, int $windowSeconds = 600): bool
{
    $ip   = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $file = sys_get_temp_dir() . '/aerovania-form-' . $bucket . '-' . md5($ip);
    $now  = time();
    $fh   = @fopen($file, 'c+');
    if (!$fh) {
        return false;
    }
    flock($fh, LOCK_EX);
    $hits = array_filter(
        array_map('intval', explode(',', stream_get_contents($fh))),
        fn ($t) => $t > $now - $windowSeconds
    );
    $limited = count($hits) >= $max;
    if (!$limited) {
        $hits[] = $now;
        ftruncate($fh, 0);
        rewind($fh);
        fwrite($fh, implode(',', $hits));
    }
    flock($fh, LOCK_UN);
    fclose($fh);
    return $limited;
}

function mime_header(string $text): string
{
    return mb_encode_mimeheader($text, 'UTF-8', 'B', "\r\n");
}

// Sends an HTML email. $attachments: list of ['name' => ..., 'type' => ..., 'data' => ...].
function send_mail(string $to, string $subject, string $html, string $fromName,
                   ?string $replyTo = null, array $attachments = []): bool
{
    $headers = [
        'From: ' . mime_header($fromName) . ' <' . SENDER_EMAIL . '>',
        'MIME-Version: 1.0',
    ];
    if ($replyTo !== null && valid_email($replyTo)) {
        $headers[] = 'Reply-To: ' . $replyTo;
    }

    if ($attachments) {
        $boundary  = '=_aerovania_' . bin2hex(random_bytes(12));
        $headers[] = 'Content-Type: multipart/mixed; boundary="' . $boundary . '"';
        $body  = "--$boundary\r\n"
               . "Content-Type: text/html; charset=UTF-8\r\n"
               . "Content-Transfer-Encoding: base64\r\n\r\n"
               . chunk_split(base64_encode($html));
        foreach ($attachments as $file) {
            $name  = preg_replace('/[^A-Za-z0-9._ -]+/', '_', $file['name']);
            $body .= "--$boundary\r\n"
                   . "Content-Type: {$file['type']}; name=\"$name\"\r\n"
                   . "Content-Transfer-Encoding: base64\r\n"
                   . "Content-Disposition: attachment; filename=\"$name\"\r\n\r\n"
                   . chunk_split(base64_encode($file['data']));
        }
        $body .= "--$boundary--\r\n";
    } else {
        $headers[] = 'Content-Type: text/html; charset=UTF-8';
        $headers[] = 'Content-Transfer-Encoding: base64';
        $body = chunk_split(base64_encode($html));
    }

    return mail($to, mime_header($subject), $body, implode("\r\n", $headers), '-f' . SENDER_EMAIL);
}

// Builds the label/value table used in the notification emails. Values are escaped here.
function details_table(array $rows): string
{
    $out = '<table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%">';
    $i = 0;
    foreach ($rows as $label => $valueHtml) {
        $bg   = $i++ % 2 ? ' style="background:#f9f9f9"' : '';
        $out .= "<tr$bg><td style=\"padding:8px;color:#666;width:160px;vertical-align:top\">" . h($label)
              . "</td><td style=\"padding:8px;white-space:pre-wrap\">$valueHtml</td></tr>";
    }
    return $out . '</table>';
}
