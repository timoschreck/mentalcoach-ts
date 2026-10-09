# Eigenes Kontaktformular: lokale Vorbereitung

Arbeitsbasis dieser lokalen Pfadkorrektur: Draft PR3 bei
`6ae613dd55a69c79a4e8d8ab92f4b0dd07601852`; ursprüngliche main-Basis
`1b8add8d36136975e6af73bb7a51f28cac5939ef`. Kein Push, Formular-Deployment,
Formspree-Eingriff oder Testmail durch diese Korrektur. Die veröffentlichte Seite bleibt aktiv.
Die Änderung betrifft `kontakt.html`; das bestehende Homepage-mailto-Formular
bleibt unverändert. Gestaltung, CSS, Navigation und übrige Seiten bleiben erhalten.

## Verhalten und Schutzgrenzen

`contact.php` lädt ausschließlich aus dem bestätigten privaten Kontopfad
`/usr/home/ct56gy/private/mentalcoach-contact`. Die frühere Ableitung mit
`dirname(__DIR__)` war bei Webroot `/usr/www/users/ct56gy` falsch. Der Einstieg
prüft den aufgelösten absoluten Pfad außerhalb Webroot und Entry-Verzeichnis
sowie vorhandene, nicht als Symlink eingebundene Bootstrap-/Config-Dateien.
Fehlende Config oder unklarer DOCUMENT_ROOT liefern neutrales JSON-503;
kein öffentlicher Config-/Secret-Fallback und kein requestgesteuerter Pfad.
Der Server akzeptiert ausschließlich begrenztes UTF-8-JSON, feste Feldnamen,
Name 1–120 Zeichen, validierte Mail-Adresse bis 254 Bytes, Nachricht 10–5000
Zeichen und insgesamt höchstens 22000 Bytes. Steuerzeichen in Headerfeldern,
zusätzliche Empfänger-/Anhangsfelder, gefüllter Honeypot und ungültige Tokens
werden abgewiesen. Nachricht ist ausschließlich Klartext.

From, Envelope-Sender und Empfänger sind fest `office@mentalcoach-ts.de`.
Besucheradresse wird nur Reply-To. Keine Anhänge, Autoreplies oder freien
Empfänger. SMTP über PHPMailer, Pflicht-TLS mit Zertifikatsprüfung, 465/SMTPS
oder 587/STARTTLS; keine Debugausgabe oder Wiedergabe interner Fehlermeldungen.
Die aktive Version PHP8.2.34/FPM ist nachgewiesen. Eine vollständige
App-/SMTP-/TLS-Abnahme ist noch offen; dieser Auftrag liest keine Mail-Secrets.

Rate-Limit: fünf anwendungsgültig decodierte POST-Versuche pro IP/15 Minuten,
60 insgesamt/Stunde; Tokenabfragen 30 pro IP/15 Minuten und 300/Stunde.
Auch semantisch ungültige POSTs zählen. Abgewiesene HTTP-Methoden, falsche
Content-Types und nicht decodierbare Bodies erreichen keine Mailroute.
Dateisperre über eine stabile Lockdatei und atomischer Austausch der Zustandsdatei
serialisieren parallele PHP-Prozesse auf **einem** Server/Dateisystem.
Speicher ist begrenzt, abgelaufene Einträge werden bei Zugriff entfernt;
fehlende, korrupte, nicht schreibbare oder überfüllte Ablage sperrt Versand.
IP wird nur als HMAC gespeichert, Nachricht/Adresse/Name werden nicht gespeichert;
die Replaykennung enthält einen HMAC des Inhalts. Serverzugriffslogs können
separat IPs enthalten. E-Mail-Postfachaufbewahrung ist davon unabhängig.

Token gilt 15 Minuten, ist HMAC-signiert und an die tatsächlich beobachtete
REMOTE_ADDR gebunden. POST erfordert einen der beiden festen HTTPS-Origins und
application/json. Kein CORS und keine Proxy-Headerfreigabe. Das ist keine
Benutzerauthentifizierung und kein vollständiger Botschutz. NAT-Nutzer teilen
das Budget; globale Limits können Verfügbarkeit bei Missbrauch begrenzen.
Vor Deployment echte Proxy-/CDN-Topologie prüfen, nicht blind X-Forwarded-For nutzen.

Ein Token wird vor dem Transport dauerhaft als pending reserviert. Gleicher
Token/Inhalt nach Annahme liefert denselben Erfolg ohne erneutes Senden.
Parallele, abweichende oder unklare Wiederholung wird gesperrt. Bei SMTPfehler
oder Prozessabbruch kann eine Nachricht bereits angenommen sein: kein automatischer
Retry. Auch der Browser blockiert dann den erneuten Klick und bewahrt den Text.
Nach Reload/neuem Token ist kein globales Inhalts-Deduplikat garantiert.
„Zum Versand angenommen“ ist **kein** Beweis für tatsächliche Postfachzustellung.

## Abhängigkeit und Tests

Unveränderte notwendige PHPMailer-SMTP-Klassen, LGPL-Lizenz und Metadaten sind
vendort: Release `v7.1.1`, Commit `1bc1716a507a65e039d4ac9d9adebbbd0d346e15`.
Jede Datei ist in `contact-server/vendor/PHPMailer/PROVENANCE.json` SHA256-gebunden.
Offizielle Quelle: <https://github.com/PHPMailer/PHPMailer/releases/tag/v7.1.1>.
Kein Composer-Aufruf, keine Entwicklungsabhängigkeiten, keine Softwareinstallation.
Das vendorte composer.json ist ausschließlich unveränderte Herkunftsmetadaten;
keinen Composer-Installationsschritt im Deployment ausführen.

PHP-Backend benötigt PHP **8.2+**, OpenSSL, ctype, filter, hash, JSON und
normales lokales flock/rename. Keine Datenbank, PHP-Session oder Composer nötig.
Hosting-Version und private synthetische Dateioperationen sind nachgewiesen.
Tatsächliche App-/Config-/State-Rechte sowie TLS/SMTP und Zustellung müssen
vor Veröffentlichung noch geprüft werden.

Nach gesonderter Nutzerfreigabe am 08.10.2026 läuft PHP 8.5.11 x64 NTS VS17
portabel außerhalb des Repositorys. Offizielle ZIP-Quelle und SHA256 wurden
vor Ausführung geprüft: `0ea96e0d2b9b737a6036f05cf4e95c49313faa6d0f27bd97edb2742503f0c043`.
Keine PATH-, Firewall- oder Systemkonfigurationsänderung, keine Zusatzinstallation;
die nötige Microsoft-Laufzeit war bereits vorhanden. Composer bleibt unnötig.

Alle acht aktuellen PHP-Dateien bestehen `php -l`; 27 PHP-Mock-/Negativ-/Paralleltests PASS.
`tests/contact-http.py` prüft zusätzlich 20 HTTP-Szenariogruppen gegen die echte
PHP-Route in einer isolierten temporären Kopie mit ausschließlich ersetztem
SMTP-Mockadapter. Die Anwendung selbst besitzt keinen Testmodus/Mockschalter.
Zwei Chromium-Szenarien prüfen tatsächliche PHP-Antworten: Desktop-Annahme und
Mobil-Fehler mit bewahrtem Text und gesperrtem Wiederholungsbutton. Der Testforwarder
setzt für Loopback einen zulässigen HTTPS-Origin; Produktions-Allowlist unverändert.
Fixture-Konfiguration wechselt mehrfach innerhalb einer Sekunde, daher OPcache
nur in diesem lokalen Testserver deaktiviert. Produktionscache-Einstellungen
wurden weder gelesen noch geändert.

Ein Windows-Pfadvergleich in bootstrap.php wurde auf DIRECTORY_SEPARATOR
korrigiert. Die PHPMailer-Mockprüfung wurde an die tatsächliche Reply-To-Liste
angepasst; die Produktions-Reply-To-Bindung war bereits richtig.
Zusätzlich neun JS-Mocktests und zwei lokale statische Browser-Szenarien PASS.
Keine echte SMTP-Verbindung oder Mail; kein TLS-/Zustellnachweis beim Provider.
Die Pfadkorrektur ist lokal unter PHP 8.2.34 und 8.5.11 geprüft: Syntax aller
PHP-Dateien, 18 Entry-Pfad-/Abbruchfälle je Version, 27 Backendfälle je Version,
20 HTTP-Gruppen und 2 Browserfälle je Version. Prüfberichte gehören zur lokalen
Auslieferung. Reale SMTP-Verbindungen bleiben ausgeschlossen. CI NOT_RUN.

Der freigegebene einmalige Hetzner-Pfadtest am09.10.2026 um02:30:51UTC
lieferte HTTP200 unter PHP8.2.34/fpm-fcgi: Webroot `/usr/www/users/ct56gy`,
private realpath `/usr/home/ct56gy/private/mentalcoach-diagnostic-20261009-v3-d66cfcbb72`,
synthetische Datei lesbar und inhaltlich SHA256-bestätigt; Verzeichnis700,
Datei600, Eigentümer/PHP-UID1316, open_basedir leer. Synthetisches Erstellen,
Schreiben/fflush, Lesen, flock, rename und Entfernen bestanden.
fsync war vorhanden, wurde dort nicht separat ausgeführt. Das ist ein
Linux-Hosting-Pfad-/Dateifunktionsnachweis, **kein vollständiger App-E2E-Test**.
Alle eigenen Diagnoseartefakte und der lokale Zugriffsschlüssel sind entfernt;
frische WebFTP-Listen und unabhängiger HTTPS404 ohne Diagnosemarker belegen Cleanup.
Es wurde keine produktive private App-/Config-/State-Installation angelegt.

Offizielle Grundlage des geprüften Pfads:
<https://docs.hetzner.com/managed/webserver/php-configuration/#php-error-log>
und <https://docs.hetzner.com/managed/administration-on-konsoleh/installation-of-additional-software/#setup-sabredav>.


Mit bereits vorhandener Laufzeit, ohne Installation:

```text
php tests/contact-service.php
# Syntax: jede *.php-Datei mit php -l prüfen, einschließlich vendorter Klassen.
node --check assets/contact-form.mjs
node --test tests/contact-form.test.mjs
python scripts/check-contact-static.py
python tests/contact-entry.py --php /ABS/php.exe --ini /ABS/php-test.ini --output /ABS/entry-evidence
```

Portable Laufzeit per absolutem Pfad mit eigener php-test.ini (OpenSSL aktiviert)
aufrufen; nicht auf einen systemweiten PATH vertrauen. HTTP-/Browsersuite benötigt
die vorhandenen Node-/Playwright-/Chrome-Pfade, installiert selbst nichts:

```text
python tests/contact-http.py --php /ABS/php.exe --ini /ABS/php-test.ini --node /ABS/node.exe --chrome /ABS/chrome.exe --playwright /ABS/playwright/index.mjs --output /ABS/evidence
```

`contact-service.php` verwendet ausschließlich synthetische Tempdateien und
Mocktransporte. Prüft gültige/ungültige Eingaben, Header-Injection, Honeypot,
Tokenintegrität/IP/Frist, Rate-Limits, konkurrierende PHP-Prozesse, Replay,
unsicheren SMTP-Ausgang, korrupte Ablage und PHPMailer-Absender/Reply-To/TLS.
Die vier PHP-Kinder im Rate-Test sind lokale Prozesse desselben installierten
PHP, keine externen Agenten und keine Modell-API.

## Deploymentvorbereitung – separat freizugeben

Der Paketbuilder erzeugt getrennte Archive außerhalb des Repositorys:

```text
python scripts/build-contact-bundle.py ../contact-bundles
```

`public-webroot.zip` enthält öffentliche Website und den kleinen PHP-Einstieg.
`private-contact-server.zip` enthält ausschließlich Anwendung/Vendor und die
leere deaktivierte Vorlage. Es enthält weder `config.php` noch state.
**Repository nicht komplett in public_html hochladen.** Keine Tests, Dokumentation,
Konfiguration oder Anwendung/Vendor im öffentlichen Webroot ablegen.

Nach gesonderter Deploy- und Secretfreigabe gelten diese beiden Ansichten:

```text
WebFTP Home/public_html       -> PHP-Webroot /usr/www/users/ct56gy
  kontakt.html
  contact.php
  assets/contact-form.mjs
WebFTP Home/private/mentalcoach-contact
  -> /usr/home/ct56gy/private/mentalcoach-contact
     bootstrap.php
     ContactService.php
     SmtpTransport.php
     vendor/PHPMailer/...     # Code, Lizenz und Herkunftsmanifest
     config.example.php      # deaktivierte, leere Vorlage
     config.php              # ausschließlich spätere private Secret-Konfiguration,0600
     state/                  #0700, PHP-User muss schreiben können
```

`contact.php` enthält den nichtgeheimen absoluten App-Pfad. Nicht erneut aus
dem Webroot ableiten. Der Pfadtest beweist das private Elternverzeichnis;
die tatsächliche App, config.php und state müssen noch bereitgestellt werden.
Private Ordner0700; config.php0600; Code ausschließlich außerhalb Webroot.
Die Anwendung verweigert unter Linux gruppen-/weltlesbare config/state.

Für die spätere Installation nur die3öffentlichen Delta-Dateien hochladen:
`kontakt.html`, `contact.php`, `assets/contact-form.mjs`. Der volle
`public-webroot.zip` ist eine Reviewkopie, kein Auftrag zum Überschreiben
der gesamten Website. Das private Archiv enthält Code/Vendor/Vorlage,
**keine config.php und keinen state**. Kein Repository, Test oder Bericht in Webroot.

Geschützter Secret-Handoff: Timo trägt den verifizierten Hetzner-SMTP-Host,
Port465/SMTPS oder587/STARTTLS, Benutzer `office@mentalcoach-ts.de`, vorhandenes
Office-Passwort und einen kryptografisch erzeugten zufälligen Token-Schlüssel
(mindestens32Bytes) ausschließlich in private config.php ein. Beispielvorlage
zunächst `enabled=false`. Kein Passwort-/Token-Wert im Chat, Repo, Commit,
Archiv, Formular-HTML oder Diagnose. Diese Vorbereitung liest/erzeugt keine
produktiven Secrets. Kein neues Postfach und keine Konto-/Provideränderung.

Reihenfolge für einen späteren freigegebenen Einsatz: tatsächliche private
App-/Config-/State-Installation und Rechte prüfen (Elternpfad/PHP bereits
nachgewiesen); Datenschutztext
menschlich prüfen (Hosting/SMTP-Verarbeitung,
Zweck/Rechtsgrundlage, Log-/Mailaufbewahrung und Providerbeziehungen);
alte Website/Formspree-route als Rollback erhalten; private Anwendung und
geschützte Config vorbereiten; dann öffentlichen Einstieg und zuletzt die
Kontaktseite/JS veröffentlichen und gegebenenfalls den Hosting-Codecache kontrolliert
aktualisieren. Vor dem letzten Schritt weiterhin alte Route.
Die bestehende Datenschutzerklärung wurde hier nicht rechtlich geändert oder
als passend freigegeben. Homepage-mailto und Kontakt-Mailangaben separat prüfen.

Manuelle Abnahme benötigt später separate Erlaubnis für genau eine klar
markierte Testmail: Formular-Success, Office-Eingang samt Headerpfad, From,
Reply-To, kein Zweitversand bei Doppelklick, Fehler-/Rate-Limit-UX sowie
HTTP-Unerreichbarkeit aller privaten Dateien. Nicht reale Spam-/Lasttests senden.
Mailzustellung, SPF/DKIM/DMARC und operative Überwachung sind aktuell offen.

Konkrete einzelne Abnahmemail, erst nach gesonderter Versandfreigabe:

- Formularname: `Timo Formularabnahme`.
- Besucheradresse/erwartetes Reply-To: `timoschreck@live.com`.
- Nachricht: `SYNTHETISCHE FORMULARABNAHME mentalcoach-ts.de — einmaliger freigegebener Test. Keine Kundendaten. Bitte nicht weiterleiten.`
- Fester From/Envelope und einziger Empfänger: `office@mentalcoach-ts.de`.
- Genau eine Formularabgabe. Annahmeantwort und tatsächlichen Office-Eingang
  einschließlich From/Reply-To/Transportheader prüfen. Keine Autoantwort.
- Doppelklick nur an derselben Browserabgabe bewerten; keinen zweiten
  Live-Versand und kein Wiederholen bei unklarem SMTP-Status. Fehler-/Rate-
  Limitfälle bleiben synthetisch/lokal. Kein Resetten/Leeren des State-Ledgers.
- Bei fehlendem Eingang oder unklarem Versand: Aktivierung stoppen, Status
  prüfen; nicht automatisch nochmals absenden.

Rollback vor Installation vorbereiten: aktuelle Livekontakt.html und den
Bestand/Abwesenheit von contact.php und assets/contact-form.mjs außerhalb
Webroot sichern. Während privater Vorbereitung bleibt die alte Route aktiv.
Öffentlichen Einstieg/JS zuerst bereitstellen, kontakt.html zuletzt umstellen.
Bei Fehler zuerst exakt gesicherte Livekontakt.html zurückspielen, dann
private Config `enabled=false`; neue öffentliche Dateien entfernen oder
vorherigen Bestand wiederherstellen. Keine gesamte Website zurückrollen.

Vorherige Formspree-Konfiguration unverändert erhalten. Private state-Ledger
bis zum Ablauf laufender Tokens erhalten; Löschen/Leeren im Betrieb könnte
Replay-Schutz aufheben. Kein automatisches Provider- oder Mailkontoänderungsverfahren.
