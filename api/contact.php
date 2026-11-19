<?php
// Contact Us form: emails the enquiry to RECEIVER_EMAIL and sends the visitor a confirmation.
require __DIR__ . '/lib.php';

require_post();

// The contact page posts JSON; accept a normal form post too.
$in = json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) {
    $in = $_POST;
}

$fname   = clean_line($in['fname'] ?? '', 80);
$lname   = clean_line($in['lname'] ?? '', 80);
$email   = clean_line($in['email'] ?? '', 254);
$company = clean_line($in['company'] ?? '', 150);
$topic   = clean_line($in['subject'] ?? '', 100);
$message = clean_text($in['message'] ?? '', 5000);

if ($fname === '' || $email === '' || $message === '') {
    respond(400, ['success' => false, 'error' => 'Name, email, and message are required.']);
}
if (!valid_email($email)) {
    respond(400, ['success' => false, 'error' => 'Please enter a valid email address.']);
}
if (rate_limited('contact')) {
    respond(429, ['success' => false, 'error' => 'Too many messages. Please try again in a few minutes.']);
}

$fullName = trim("$fname $lname");
$html = '<h2 style="color:#34C0C5;font-family:sans-serif;">New Contact Form Submission</h2>' . details_table([
    'Name'    => '<strong>' . h($fullName) . '</strong>',
    'Email'   => '<a href="mailto:' . h($email) . '">' . h($email) . '</a>',
    'Company' => $company !== '' ? h($company) : '—',
    'Topic'   => $topic !== '' ? h($topic) : '—',
    'Message' => h($message),
]);

$subject = '[Contact] ' . ($topic !== '' ? $topic : 'New enquiry') . " — $fullName";
if (!send_mail(RECEIVER_EMAIL, $subject, $html, 'Aerovania Website', $email)) {
    error_log('contact.php: mail() to receiver failed');
    respond(500, ['success' => false, 'error' => 'Failed to send message. Please try again.']);
}

$confirm = '<p style="font-family:sans-serif;font-size:15px">Hi ' . h($fname) . ',</p>'
         . '<p style="font-family:sans-serif;font-size:15px">Thanks for reaching out. Our team will get back to you within one business day.</p>'
         . '<p style="font-family:sans-serif;font-size:15px;color:#34C0C5;font-weight:600">— Team Aerovania</p>';
if (!send_mail($email, 'We received your message — Aerovania', $confirm, 'Aerovania')) {
    error_log('contact.php: confirmation mail() failed');
}

respond(200, ['success' => true, 'message' => 'Message sent successfully.']);
