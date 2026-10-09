<?php
declare(strict_types=1);

namespace Mentalcoach;

use PHPMailer\PHPMailer\PHPMailer;

final class SmtpTransport
{
    public static function create(array $config, ?\Closure $factory = null): \Closure
    {
        if (!is_string($config['smtp_host'] ?? null)
            || !preg_match('/^[a-z0-9][a-z0-9.-]+$/D', $config['smtp_host'])
            || ($config['smtp_username'] ?? null) !== ContactService::SENDER
            || !is_string($config['smtp_password'] ?? null) || $config['smtp_password'] === ''
            || !in_array($config['smtp_port'] ?? null, [465, 587], true)) {
            throw new ContactError('unavailable', 503);
        }
        return static function (array $input) use ($config, $factory): void {
            $mail = $factory ? $factory() : new PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = $config['smtp_host'];
            $mail->Port = $config['smtp_port'];
            $mail->SMTPAuth = true;
            $mail->Username = ContactService::SENDER;
            $mail->Password = $config['smtp_password'];
            $mail->SMTPSecure = $mail->Port === 465 ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
            $mail->SMTPOptions = ['ssl' => ['verify_peer' => true, 'verify_peer_name' => true,
                'allow_self_signed' => false]];
            $mail->SMTPDebug = 0;
            $mail->Timeout = 10;
            $mail->Timelimit = 15;
            $mail->CharSet = PHPMailer::CHARSET_UTF8;
            $mail->Encoding = PHPMailer::ENCODING_BASE64;
            $mail->setFrom(ContactService::SENDER, 'Mentalcoach Website');
            $mail->Sender = ContactService::SENDER;
            $mail->addAddress(ContactService::RECIPIENT);
            $mail->addReplyTo($input['email'], $input['name']);
            $mail->Subject = 'Kontaktanfrage über mentalcoach-ts.de';
            $mail->isHTML(false);
            $mail->Body = "Name: " . $input['name'] . "\nMail-Adresse: " . $input['email']
                . "\n\n" . $input['message'];
            if (!$mail->send()) {
                throw new ContactError('uncertain', 503);
            }
        };
    }
}
