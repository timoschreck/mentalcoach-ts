<?php
declare(strict_types=1);

use Mentalcoach\ContactError;
use Mentalcoach\ContactService;
use Mentalcoach\FileGate;
use Mentalcoach\SmtpTransport;

require_once __DIR__ . '/ContactService.php';
require_once __DIR__ . '/SmtpTransport.php';

function contact_response(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}

try {
    if (PHP_VERSION_ID < 80200 || !extension_loaded('openssl')
        || !is_file(__DIR__ . '/config.php') || is_link(__DIR__ . '/config.php')) {
        throw new ContactError('unavailable', 503);
    }
    $private = realpath(__DIR__);
    $public = realpath($_SERVER['DOCUMENT_ROOT'] ?? '');
    if (!$private || !$public || $private === $public
        || str_starts_with($private, $public . DIRECTORY_SEPARATOR)) {
        throw new ContactError('unavailable', 503);
    }
    $config = require __DIR__ . '/config.php';
    if (!is_array($config) || ($config['enabled'] ?? false) !== true
        || !is_string($config['token_key'] ?? null) || strlen($config['token_key']) < 32) {
        throw new ContactError('unavailable', 503);
    }
    $statePath = realpath($config['state_directory'] ?? '');
    if (!$statePath || is_link(__DIR__ . '/state') || $statePath !== $private . '/state') {
        throw new ContactError('unavailable', 503);
    }
    if (DIRECTORY_SEPARATOR === '/') {
        // Secrets/state must not be accessible to other account users.
        foreach ([__DIR__ . '/config.php', $statePath] as $path) {
            if ((fileperms($path) & 0077) !== 0) {
                throw new ContactError('unavailable', 503);
            }
        }
    }
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    if (!filter_var($ip, FILTER_VALIDATE_IP)) {
        throw new ContactError('unavailable', 503);
    }
    // No proxy headers are trusted. Verify topology separately before deployment.
    $origin = $_SERVER['HTTP_ORIGIN'] ?? null;
    $allowedOrigins = ['https://mentalcoach-ts.de', 'https://www.mentalcoach-ts.de'];
    if ($origin !== null && !in_array($origin, $allowedOrigins, true)) {
        throw new ContactError('invalid', 403);
    }
    $method = $_SERVER['REQUEST_METHOD'] ?? '';
    if ($method === 'POST' && $origin === null) {
        throw new ContactError('invalid', 403);
    }
    require_once __DIR__ . '/vendor/PHPMailer/src/Exception.php';
    require_once __DIR__ . '/vendor/PHPMailer/src/SMTP.php';
    require_once __DIR__ . '/vendor/PHPMailer/src/PHPMailer.php';
    $service = new ContactService(new FileGate($statePath, $config['token_key']),
        $config['token_key'], SmtpTransport::create($config));
    if ($method === 'GET' && ($_GET['token'] ?? null) === '1') {
        contact_response(200, ['ok' => true, 'token' => $service->token($ip, time())]);
    }
    if ($method !== 'POST') {
        header('Allow: GET, POST');
        throw new ContactError('invalid', 405);
    }
    if (!preg_match('/^application\/json(?:\s*;\s*charset=utf-8)?$/iD', $_SERVER['CONTENT_TYPE'] ?? '')) {
        throw new ContactError('invalid', 415);
    }
    if (isset($_SERVER['CONTENT_LENGTH']) && (int) $_SERVER['CONTENT_LENGTH'] > 22000) {
        throw new ContactError('invalid', 413);
    }
    $body = file_get_contents('php://input', false, null, 0, 22001);
    if ($body === false || strlen($body) > 22000) {
        throw new ContactError('invalid', 413);
    }
    $payload = json_decode($body, true, 8, JSON_THROW_ON_ERROR);
    if (!is_array($payload)) {
        throw new ContactError('invalid', 400);
    }
    contact_response(200, $service->submit($payload, $ip, time()));
} catch (ContactError $error) {
    $messages = [
        'invalid' => 'Bitte prüfe Deine Eingaben oder lade das Formular neu.',
        'duplicate' => 'Dieser Sendeversuch wurde bereits verwendet. Bitte prüfe den bisherigen Status.',
        'rate_limit' => 'Zu viele Anfragen. Bitte versuche es später oder nutze die Mail-Adresse.',
        'uncertain' => 'Der Versandstatus ist unklar. Bitte sende nicht erneut und kontaktiere Timo per Mail.',
        'unavailable' => 'Das Formular ist momentan nicht verfügbar. Bitte nutze die angegebene Mail-Adresse.',
    ];
    if ($error->status === 429) {
        header('Retry-After: 3600');
    }
    contact_response($error->status, ['ok' => false, 'code' => $error->kind,
        'message' => $messages[$error->kind] ?? $messages['unavailable']]);
} catch (JsonException $error) {
    contact_response(400, ['ok' => false, 'code' => 'invalid', 'message' => 'Bitte prüfe Deine Eingaben.']);
} catch (Throwable $error) {
    // Neither SMTP exception strings, credentials nor message bodies are exposed/logged.
    contact_response(503, ['ok' => false, 'code' => 'unavailable',
        'message' => 'Das Formular ist momentan nicht verfügbar. Bitte nutze die angegebene Mail-Adresse.']);
}
