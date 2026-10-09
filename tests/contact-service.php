<?php
declare(strict_types=1);

// CLI-only synthetic tests. No SMTP sockets, real mail, credentials or provider writes.
use Mentalcoach\ContactError;
use Mentalcoach\ContactService;
use Mentalcoach\FileGate;
use Mentalcoach\SmtpTransport;
use PHPMailer\PHPMailer\PHPMailer;

require __DIR__ . '/../contact-server/ContactService.php';
require __DIR__ . '/../contact-server/SmtpTransport.php';
require __DIR__ . '/../contact-server/vendor/PHPMailer/src/Exception.php';
require __DIR__ . '/../contact-server/vendor/PHPMailer/src/SMTP.php';
require __DIR__ . '/../contact-server/vendor/PHPMailer/src/PHPMailer.php';

const TEST_NOW = 1800000000;
const TEST_IP = '192.0.2.1';
const TEST_KEY = 'SYNTHETIC-ONLY-NOT-A-SERVER-SECRET-0000';
$directories = [];
$passed = 0;
$failed = 0;

function expect(bool $condition, string $label = 'assertion'): void
{
    if (!$condition) {
        throw new RuntimeException($label);
    }
}

function fixture(?Closure $transport = null): array
{
    global $directories;
    $directory = sys_get_temp_dir() . '/mentalcoach-fixture-' . bin2hex(random_bytes(12));
    mkdir($directory, 0700);
    $directories[] = $directory;
    $sent = (object) ['calls' => 0, 'input' => null];
    $transport ??= static function (array $input) use ($sent): void {
        ++$sent->calls;
        $sent->input = $input;
    };
    $gate = new FileGate($directory, TEST_KEY);
    return [new ContactService($gate, TEST_KEY, $transport), $directory, $sent, $gate];
}

function payload(ContactService $service, array $changes = []): array
{
    return array_replace(['name' => 'Synthetische Testperson', 'email' => 'visitor@example.invalid',
        'message' => "Nur synthetischer Test.\nKeine echte Nachricht.", 'website' => '',
        'token' => $service->token(TEST_IP, TEST_NOW)], $changes);
}

function stops(Closure $operation, string $kind, int $status): void
{
    try {
        $operation();
    } catch (ContactError $error) {
        expect($error->kind === $kind && $error->status === $status, 'wrong safe failure');
        return;
    }
    throw new RuntimeException('expected stop missing');
}

function test(string $label, Closure $body): void
{
    global $passed, $failed;
    try {
        $body();
        ++$passed;
        echo "PASS $label\n";
    } catch (Throwable $error) {
        ++$failed;
        echo "FAIL $label: " . $error->getMessage() . "\n";
    }
}

test('valid synthetic submission and exact replay send once', function (): void {
    [$service, $dir, $sent] = fixture();
    $body = payload($service);
    expect($service->submit($body, TEST_IP, TEST_NOW)['code'] === 'accepted');
    expect($service->submit($body, TEST_IP, TEST_NOW)['code'] === 'accepted');
    expect($sent->calls === 1);
    $disk = file_get_contents($dir . '/contact.json');
    expect(!str_contains($disk, $body['email']) && !str_contains($disk, $body['name'])
        && !str_contains($disk, TEST_IP) && !str_contains($disk, $body['message']), 'private content persisted');
});

foreach ([['name', ''], ['name', str_repeat('A', 121)], ['name', "Visitor\r\nBcc: other@example.invalid"],
    ['email', "visitor@example.invalid\r\nCc: other@example.invalid"], ['email', 'not-mail'],
    ['email', str_repeat('a', 250) . '@example.invalid'], ['email', ['array']],
    ['message', 'short'], ['message', str_repeat('a', 5001)], ['message', "bad\0message content"],
    ['message', "bad\xffUTF8 content"], ['website', 'https://bot.example.invalid']] as $index => [$field, $value]) {
    test('invalid input or header injection ' . $index, function () use ($field, $value): void {
        [$service, $dir, $sent] = fixture();
        $body = payload($service, [$field => $value]);
        stops(fn() => $service->submit($body, TEST_IP, TEST_NOW), 'invalid', 400);
        expect($sent->calls === 0);
    });
}

test('unknown recipient or attachment fields cannot expand schema', function (): void {
    [$service, $dir, $sent] = fixture();
    $body = payload($service, ['to' => 'other@example.invalid', 'attachment' => 'secret.txt']);
    stops(fn() => $service->submit($body, TEST_IP, TEST_NOW), 'invalid', 400);
    expect($sent->calls === 0);
});

test('unicode boundary and CRLF normalization', function (): void {
    [$service, $dir, $sent] = fixture();
    $body = payload($service, ['name' => str_repeat('ö', 120), 'message' => "Guten Tag.\r\nSynthetisch."]);
    $service->submit($body, TEST_IP, TEST_NOW);
    expect($sent->input['message'] === "Guten Tag.\nSynthetisch.");
});

foreach (['forged', 'expired', 'future', 'wrong_ip'] as $scenario) {
    test('signed token rejects ' . $scenario, function () use ($scenario): void {
        [$service, $dir, $sent] = fixture();
        $body = payload($service);
        $now = TEST_NOW;
        $ip = TEST_IP;
        if ($scenario === 'forged') $body['token'] = substr($body['token'], 0, -1) . 'z';
        if ($scenario === 'expired') $now += ContactService::TOKEN_TTL;
        if ($scenario === 'future') --$now;
        if ($scenario === 'wrong_ip') $ip = '192.0.2.2';
        stops(fn() => $service->submit($body, $ip, $now), 'invalid', 400);
        expect($sent->calls === 0);
    });
}

test('changed replay cannot submit another message', function (): void {
    [$service, $dir, $sent] = fixture();
    $body = payload($service);
    $service->submit($body, TEST_IP, TEST_NOW);
    $body['message'] = 'Changed synthetic content.';
    stops(fn() => $service->submit($body, TEST_IP, TEST_NOW), 'duplicate', 409);
    expect($sent->calls === 1);
});

test('transport error is safe and uncertain replay is never resent', function (): void {
    $calls = 0;
    [$service] = fixture(function () use (&$calls): void { ++$calls; throw new RuntimeException('FAKE-SMTP-SECRET'); });
    $body = payload($service);
    stops(fn() => $service->submit($body, TEST_IP, TEST_NOW), 'uncertain', 503);
    stops(fn() => $service->submit($body, TEST_IP, TEST_NOW), 'uncertain', 409);
    expect($calls === 1);
});

test('pending parallel claim stops before mock send', function (): void {
    [$service, $dir, $sent, $gate] = fixture();
    $body = payload($service);
    $digest = hash_hmac('sha256', json_encode(ContactService::validate($body), JSON_THROW_ON_ERROR), TEST_KEY);
    $gate->claim(hash('sha256', $body['token']), $digest, TEST_NOW + 960, TEST_NOW);
    stops(fn() => $service->submit($body, TEST_IP, TEST_NOW), 'uncertain', 409);
    expect($sent->calls === 0);
});

test('per-IP invalid-attempt limit and expiry', function (): void {
    [$service, $dir, $sent, $gate] = fixture();
    for ($i = 0; $i < 5; ++$i) {
        stops(fn() => $service->submit([], TEST_IP, TEST_NOW), 'invalid', 400);
    }
    stops(fn() => $service->submit([], TEST_IP, TEST_NOW), 'rate_limit', 429);
    $gate->attempt(TEST_IP, TEST_NOW + 900);
    expect($sent->calls === 0);
});

test('global limit applies across distinct synthetic IPs', function (): void {
    [$service, $dir, $sent, $gate] = fixture();
    for ($i = 1; $i <= 60; ++$i) $gate->attempt('192.0.2.' . $i, TEST_NOW);
    stops(fn() => $gate->attempt('192.0.2.61', TEST_NOW), 'rate_limit', 429);
});

test('corrupt state fails closed before sending', function (): void {
    [$service, $dir, $sent] = fixture();
    $body = payload($service);
    file_put_contents($dir . '/contact.json', '{broken');
    stops(fn() => $service->submit($body, TEST_IP, TEST_NOW), 'unavailable', 503);
    expect($sent->calls === 0);
});

test('fixed sender, recipient, Reply-To, TLS and plain body with PHPMailer mock', function (): void {
    $mail = new class(true) extends PHPMailer {
        public int $mockSends = 0;
        public function send(): bool { ++$this->mockSends; return true; }
    };
    $transport = SmtpTransport::create(['smtp_host' => 'smtp.example.invalid', 'smtp_port' => 465,
        'smtp_username' => ContactService::SENDER, 'smtp_password' => 'SYNTHETIC-ONLY'], fn() => $mail);
    [$service] = fixture($transport);
    $body = payload($service);
    $service->submit($body, TEST_IP, TEST_NOW);
    expect($mail->mockSends === 1, 'mock send count');
    expect($mail->From === ContactService::SENDER && $mail->Sender === ContactService::SENDER, 'fixed sender');
    expect($mail->getToAddresses() === [[ContactService::RECIPIENT, '']], 'fixed recipient');
    expect($mail->getCcAddresses() === [] && $mail->getBccAddresses() === [], 'no secondary recipients');
    expect($mail->getReplyToAddresses() === [[$body['email'], $body['name']]], 'visitor reply-to');
    expect($mail->getAttachments() === [] && $mail->ContentType === PHPMailer::CONTENT_TYPE_PLAINTEXT, 'plain body no attachments');
    expect($mail->SMTPSecure === PHPMailer::ENCRYPTION_SMTPS && $mail->SMTPDebug === 0, 'TLS and debug');
    expect($mail->SMTPOptions['ssl']['verify_peer'] === true, 'peer verification');
});

test('four concurrent PHP workers share one atomic rate budget', function (): void {
    [$service, $dir] = fixture();
    $workers = [];
    for ($i = 0; $i < 4; ++$i) {
        $pipes = [];
        $process = proc_open([PHP_BINARY, __DIR__ . '/rate-worker.php', $dir],
            [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
        expect(is_resource($process), 'worker unavailable');
        fclose($pipes[0]);
        $workers[] = [$process, $pipes];
    }
    $allowed = 0;
    foreach ($workers as [$process, $pipes]) {
        $text = stream_get_contents($pipes[1]);
        $errors = stream_get_contents($pipes[2]);
        fclose($pipes[1]); fclose($pipes[2]);
        expect(proc_close($process) === 0 && $errors === '', 'worker error');
        $allowed += json_decode($text, true, 8, JSON_THROW_ON_ERROR)['allowed'];
    }
    expect($allowed === 5, 'non-atomic rate admission');
});

foreach ($directories as $directory) {
    foreach (glob($directory . '/*') as $path) if (is_file($path)) unlink($path);
    rmdir($directory);
}
echo "RESULT $passed PASS, $failed FAIL; SMTP/mock only, no real delivery\n";
exit($failed === 0 ? 0 : 1);
