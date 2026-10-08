<?php
declare(strict_types=1);
require __DIR__ . '/../contact-server/ContactService.php';
$gate = new Mentalcoach\FileGate($argv[1], 'SYNTHETIC-ONLY-NOT-A-SERVER-SECRET-0000');
$allowed = 0;
for ($i = 0; $i < 5; ++$i) {
    try {
        $gate->attempt('192.0.2.1', 1800000000);
        ++$allowed;
    } catch (Mentalcoach\ContactError $error) {
        if ($error->kind !== 'rate_limit') throw $error;
    }
}
echo json_encode(['allowed' => $allowed]);
