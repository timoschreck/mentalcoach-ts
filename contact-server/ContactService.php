<?php
declare(strict_types=1);

namespace Mentalcoach;

final class ContactError extends \RuntimeException
{
    public function __construct(public readonly string $kind, public readonly int $status)
    {
        parent::__construct($kind);
    }
}

/** No message bodies or raw IP addresses are written to disk. */
final class FileGate
{
    public function __construct(private readonly string $directory, private readonly string $key)
    {
        if (!is_dir($directory) || is_link($directory) || strlen($key) < 32) {
            throw new ContactError('unavailable', 503);
        }
    }

    private function edit(callable $operation, int $now): mixed
    {
        $lockPath = $this->directory . '/contact.lock';
        $statePath = $this->directory . '/contact.json';
        if (is_link($lockPath) || is_link($statePath)) {
            throw new ContactError('unavailable', 503);
        }
        $lock = fopen($lockPath, 'c');
        if ($lock === false) {
            throw new ContactError('unavailable', 503);
        }
        chmod($lockPath, 0600);
        $deadline = microtime(true) + 1.0;
        while (!flock($lock, LOCK_EX | LOCK_NB)) {
            if (microtime(true) >= $deadline) {
                fclose($lock);
                throw new ContactError('unavailable', 503);
            }
            usleep(10000);
        }
        $temporary = null;
        try {
            clearstatcache(true, $statePath);
            $state = ['buckets' => [], 'tokens' => []];
            if (is_file($statePath)) {
                $size = filesize($statePath);
                if ($size === false || $size > 1048576) {
                    throw new ContactError('unavailable', 503);
                }
                $raw = file_get_contents($statePath);
                if ($raw === false) {
                    throw new ContactError('unavailable', 503);
                }
                try {
                    $state = json_decode($raw, true, 16, JSON_THROW_ON_ERROR);
                } catch (\JsonException $error) {
                    throw new ContactError('unavailable', 503);
                }
                if (!is_array($state) || !isset($state['buckets'], $state['tokens'])
                    || !is_array($state['buckets']) || !is_array($state['tokens'])) {
                    throw new ContactError('unavailable', 503);
                }
            }
            foreach ($state['buckets'] as $id => $bucket) {
                if (!is_array($bucket) || !is_int($bucket['until'] ?? null)
                    || !is_int($bucket['count'] ?? null) || $bucket['count'] < 0) {
                    throw new ContactError('unavailable', 503);
                }
                if ($bucket['until'] <= $now) {
                    unset($state['buckets'][$id]);
                }
            }
            foreach ($state['tokens'] as $id => $row) {
                if (!is_array($row) || !is_int($row['until'] ?? null)
                    || !in_array($row['status'] ?? null, ['pending', 'accepted', 'uncertain'], true)) {
                    throw new ContactError('unavailable', 503);
                }
                if ($row['until'] <= $now) {
                    unset($state['tokens'][$id]);
                }
            }
            $result = $operation($state);
            if (count($state['buckets']) > 2048 || count($state['tokens']) > 512) {
                throw new ContactError('rate_limit', 429);
            }
            $encoded = json_encode($state, JSON_THROW_ON_ERROR);
            if (strlen($encoded) > 1048576) {
                throw new ContactError('unavailable', 503);
            }
            // A stable separate lock serializes all readers through the atomic replace.
            $temporary = $this->directory . '/state-' . bin2hex(random_bytes(12)) . '.tmp';
            $stream = fopen($temporary, 'x');
            if ($stream === false) {
                throw new ContactError('unavailable', 503);
            }
            chmod($temporary, 0600);
            try {
                if (fwrite($stream, $encoded) !== strlen($encoded) || !fflush($stream)) {
                    throw new ContactError('unavailable', 503);
                }
                if (function_exists('fsync') && !fsync($stream)) {
                    throw new ContactError('unavailable', 503);
                }
            } finally {
                fclose($stream);
            }
            if (!rename($temporary, $statePath)) {
                throw new ContactError('unavailable', 503);
            }
            $temporary = null;
            return $result;
        } finally {
            if ($temporary !== null && is_file($temporary)) {
                unlink($temporary);
            }
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }

    public function attempt(string $ip, int $now, bool $tokenRequest = false): void
    {
        $hash = hash_hmac('sha256', $ip, $this->key);
        $mode = $tokenRequest ? 'token' : 'post';
        $limits = [[$mode . ':' . $hash, $tokenRequest ? 30 : 5, 900],
            [$mode . ':global', $tokenRequest ? 300 : 60, 3600]];
        $allowed = $this->edit(function (array &$state) use ($limits, $now): bool {
            foreach ($limits as [$id, $max, $window]) {
                if (($state['buckets'][$id]['count'] ?? 0) >= $max) {
                    return false;
                }
            }
            foreach ($limits as [$id, $max, $window]) {
                $state['buckets'][$id] ??= ['until' => $now + $window, 'count' => 0];
                ++$state['buckets'][$id]['count'];
            }
            return true;
        }, $now);
        if (!$allowed) {
            throw new ContactError('rate_limit', 429);
        }
    }

    public function claim(string $token, string $payloadHash, int $until, int $now): ?array
    {
        return $this->edit(function (array &$state) use ($token, $payloadHash, $until): ?array {
            if (isset($state['tokens'][$token])) {
                $prior = $state['tokens'][$token];
                if (!hash_equals($prior['payload'] ?? '', $payloadHash)) {
                    throw new ContactError('duplicate', 409);
                }
                return $prior;
            }
            $state['tokens'][$token] = ['status' => 'pending', 'payload' => $payloadHash, 'until' => $until];
            return null;
        }, $now);
    }

    public function complete(string $token, string $status, int $now): void
    {
        $this->edit(function (array &$state) use ($token, $status): void {
            if (!isset($state['tokens'][$token]) || !in_array($status, ['accepted', 'uncertain'], true)) {
                throw new ContactError('unavailable', 503);
            }
            $state['tokens'][$token]['status'] = $status;
        }, $now);
    }
}

final class ContactService
{
    public const RECIPIENT = 'office@mentalcoach-ts.de';
    public const SENDER = 'office@mentalcoach-ts.de';
    public const TOKEN_TTL = 900;

    public function __construct(private readonly FileGate $gate, private readonly string $key,
        private readonly \Closure $transport)
    {
        if (strlen($key) < 32) {
            throw new ContactError('unavailable', 503);
        }
    }

    public function token(string $ip, int $now): string
    {
        $this->gate->attempt($ip, $now, true);
        $value = $now . '.' . bin2hex(random_bytes(16));
        return $value . '.' . hash_hmac('sha256', $ip . ':' . $value, $this->key);
    }

    private function issuedAt(string $token, string $ip, int $now): int
    {
        if (!preg_match('/^([0-9]{10})\.([a-f0-9]{32})\.([a-f0-9]{64})$/D', $token, $parts)) {
            throw new ContactError('invalid', 400);
        }
        $issued = (int) $parts[1];
        if ($issued > $now || $now - $issued >= self::TOKEN_TTL
            || !hash_equals(hash_hmac('sha256', $ip . ':' . $parts[1] . '.' . $parts[2], $this->key), $parts[3])) {
            throw new ContactError('invalid', 400);
        }
        return $issued;
    }

    public static function validate(array $payload): array
    {
        $expected = ['name', 'email', 'message', 'website', 'token'];
        if (count($payload) !== count($expected) || array_diff($expected, array_keys($payload))) {
            throw new ContactError('invalid', 400);
        }
        foreach ($expected as $key) {
            if (!is_string($payload[$key]) || !preg_match('//u', $payload[$key])) {
                throw new ContactError('invalid', 400);
            }
        }
        $name = trim($payload['name']);
        $email = trim($payload['email']);
        $message = trim(str_replace(["\r\n", "\r"], "\n", $payload['message']));
        $nameLength = preg_match_all('/./us', $name);
        $messageLength = preg_match_all('/./us', $message);
        if ($payload['website'] !== '' || $nameLength < 1 || $nameLength > 120
            || preg_match('/\p{Cc}/u', $name) || strlen($email) > 254
            || preg_match('/\p{Cc}/u', $email) || !filter_var($email, FILTER_VALIDATE_EMAIL)
            || $messageLength < 10 || $messageLength > 5000
            || preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/', $message)) {
            throw new ContactError('invalid', 400);
        }
        return ['name' => $name, 'email' => $email, 'message' => $message];
    }

    public function submit(array $payload, string $ip, int $now): array
    {
        $this->gate->attempt($ip, $now);
        $clean = self::validate($payload);
        $issued = $this->issuedAt($payload['token'], $ip, $now);
        $id = hash('sha256', $payload['token']);
        // Keyed digest prevents offline recovery of low-entropy submitted text.
        $digest = hash_hmac('sha256', json_encode($clean, JSON_THROW_ON_ERROR), $this->key);
        $prior = $this->gate->claim($id, $digest, $issued + self::TOKEN_TTL + 60, $now);
        if ($prior !== null) {
            if ($prior['status'] === 'accepted') {
                return ['ok' => true, 'code' => 'accepted'];
            }
            throw new ContactError('uncertain', 409);
        }
        try {
            ($this->transport)($clean);
            $this->gate->complete($id, 'accepted', $now);
        } catch (\Throwable $error) {
            // SMTP may have accepted mail before disconnecting. Never resend this token.
            try {
                $this->gate->complete($id, 'uncertain', $now);
            } catch (\Throwable $ignored) {
                // A durable pending token also blocks another send.
            }
            throw new ContactError('uncertain', 503);
        }
        return ['ok' => true, 'code' => 'accepted'];
    }
}
