<?php
declare(strict_types=1);

// Only this entry point belongs in public_html. Application/config/state stay outside it.
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
try {
    // Confirmed private account path; this nonsecret path contains no credentials.
    // Missing/disabled private config keeps the route unavailable.
    $privateDirectory = '/usr/home/ct56gy/private/mentalcoach-contact';
    $absolute = DIRECTORY_SEPARATOR === '/'
        ? str_starts_with($privateDirectory, '/')
        : preg_match('~^[A-Za-z]:/~D', str_replace('\\', '/', $privateDirectory)) === 1;
    $documentRoot = $_SERVER['DOCUMENT_ROOT'] ?? null;
    if (!$absolute || str_contains($privateDirectory, "\0")
        || !is_string($documentRoot) || $documentRoot === '') {
        throw new RuntimeException('contact unavailable');
    }
    $private = realpath($privateDirectory);
    $public = realpath($documentRoot);
    $entry = realpath(__DIR__);
    if (!$private || !is_dir($private) || !$public || !is_dir($public) || !$entry) {
        throw new RuntimeException('contact unavailable');
    }
    // Resolve aliases before containment checks; the entry directory is also public.
    foreach ([$public, $entry] as $publicRoot) {
        $candidate = DIRECTORY_SEPARATOR === '\\' ? strtolower($private) : $private;
        $root = DIRECTORY_SEPARATOR === '\\' ? strtolower($publicRoot) : $publicRoot;
        $root = rtrim($root, '/\\');
        if ($candidate === $root || str_starts_with($candidate, $root . DIRECTORY_SEPARATOR)) {
            throw new RuntimeException('contact unavailable');
        }
    }
    $bootstrap = $private . DIRECTORY_SEPARATOR . 'bootstrap.php';
    $config = $private . DIRECTORY_SEPARATOR . 'config.php';
    if (!is_file($bootstrap) || is_link($bootstrap)
        || !is_file($config) || is_link($config)) {
        throw new RuntimeException('contact unavailable');
    }
    require $bootstrap;
} catch (Throwable $error) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'code' => 'unavailable',
        'message' => 'Das Formular ist momentan nicht verfügbar. Bitte nutze die angegebene Mail-Adresse.']);
}
