<?php
declare(strict_types=1);

// Copy to config.php ONLY outside public_html; user supplies secrets later.
return [
    'enabled' => false,
    'smtp_host' => 'SET_VERIFIED_HETZNER_SMTP_HOST',
    'smtp_port' => 465,
    'smtp_username' => 'office@mentalcoach-ts.de',
    'smtp_password' => '',
    'token_key' => '', // At least 32 unpredictable bytes; never commit the real value.
    'state_directory' => __DIR__ . '/state',
];
