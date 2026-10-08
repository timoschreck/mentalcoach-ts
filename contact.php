<?php
declare(strict_types=1);

// Only this entry point belongs in public_html. Application/config/state stay outside it.
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
try {
    $bootstrap = dirname(__DIR__) . '/private/mentalcoach-contact/bootstrap.php';
    if (!is_file($bootstrap)) {
        throw new RuntimeException('contact unavailable');
    }
    require $bootstrap;
} catch (Throwable $error) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'code' => 'unavailable',
        'message' => 'Das Formular ist momentan nicht verfügbar. Bitte nutze die angegebene Mail-Adresse.']);
}
