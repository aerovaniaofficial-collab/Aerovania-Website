<?php
// Careers "Apply Now" form: emails the application (with CV) to RECEIVER_EMAIL
// and sends the applicant a confirmation.
require __DIR__ . '/lib.php';

require_post();

const MAX_CV_BYTES = 5 * 1024 * 1024;
const CV_TYPES = [
    'pdf'  => 'application/pdf',
    'doc'  => 'application/msword',
    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// PHP drops the whole form when the upload is bigger than post_max_size.
if (empty($_POST) && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
    respond(400, ['success' => false, 'error' => 'The CV file is too large. Maximum size is 5 MB.']);
}

$name     = clean_line($_POST['name'] ?? '', 100);
$email    = clean_line($_POST['email'] ?? '', 254);
$phone    = clean_line($_POST['phone'] ?? '', 40);
$role     = clean_line($_POST['role'] ?? '', 150);
$linkedin = clean_line($_POST['linkedin'] ?? '', 300);
$cover    = clean_text($_POST['cover'] ?? '', 5000);

if ($name === '' || $email === '' || $role === '') {
    respond(400, ['success' => false, 'error' => 'Name, email, and role are required.']);
}
if (!valid_email($email)) {
    respond(400, ['success' => false, 'error' => 'Please enter a valid email address.']);
}
if ($linkedin !== '' && !preg_match('#^https?://#i', $linkedin)) {
    $linkedin = 'https://' . $linkedin;
}
if ($linkedin !== '' && filter_var($linkedin, FILTER_VALIDATE_URL) === false) {
    $linkedin = '';
}

$attachments = [];
$cv = $_FILES['cv'] ?? null;
if ($cv && $cv['error'] !== UPLOAD_ERR_NO_FILE) {
    if (in_array($cv['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true) || $cv['size'] > MAX_CV_BYTES) {
        respond(400, ['success' => false, 'error' => 'The CV file is too large. Maximum size is 5 MB.']);
    }
    if ($cv['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($cv['tmp_name'])) {
        respond(400, ['success' => false, 'error' => 'The CV upload failed. Please try again.']);
    }
    $ext = strtolower(pathinfo($cv['name'], PATHINFO_EXTENSION));
    if (!isset(CV_TYPES[$ext])) {
        respond(400, ['success' => false, 'error' => 'Only PDF, DOC, and DOCX files are allowed.']);
    }
    $attachments[] = [
        'name' => clean_line(basename($cv['name']), 120),
        'type' => CV_TYPES[$ext],
        'data' => file_get_contents($cv['tmp_name']),
    ];
}

if (rate_limited('careers')) {
    respond(429, ['success' => false, 'error' => 'Too many submissions. Please try again in a few minutes.']);
}

$html = '<h2 style="color:#34C0C5;font-family:sans-serif;">New Job Application</h2>' . details_table([
    'Name'         => '<strong>' . h($name) . '</strong>',
    'Email'        => '<a href="mailto:' . h($email) . '">' . h($email) . '</a>',
    'Phone'        => $phone !== '' ? h($phone) : '—',
    'Role Applied' => '<strong style="color:#34C0C5">' . h($role) . '</strong>',
    'LinkedIn'     => $linkedin !== '' ? '<a href="' . h($linkedin) . '">' . h($linkedin) . '</a>' : '—',
    'Cover Note'   => $cover !== '' ? h($cover) : '—',
    'CV Attached'  => $attachments ? h($attachments[0]['name']) : 'No file uploaded',
]);

if (!send_mail(RECEIVER_EMAIL, "[Application] $role — $name", $html, 'Aerovania Careers', $email, $attachments)) {
    error_log('careers.php: mail() to receiver failed');
    respond(500, ['success' => false, 'error' => 'Failed to submit application. Please try again.']);
}

$confirm = '<p style="font-family:sans-serif;font-size:15px">Hi ' . h($name) . ',</p>'
         . '<p style="font-family:sans-serif;font-size:15px">Thanks for applying for the <strong>' . h($role)
         . '</strong> position at Aerovania. We\'ve received your application and will review it shortly.</p>'
         . '<p style="font-family:sans-serif;font-size:15px">If your profile is a match, we\'ll reach out to schedule a conversation.</p>'
         . '<p style="font-family:sans-serif;font-size:15px;color:#34C0C5;font-weight:600">— Team Aerovania</p>';
if (!send_mail($email, 'Application received — Aerovania', $confirm, 'Aerovania Careers')) {
    error_log('careers.php: confirmation mail() failed');
}

respond(200, ['success' => true, 'message' => 'Application submitted successfully.']);
