# Eigenes Kontaktformular: lokale Vorbereitung

Arbeitsbasis: `main` bei `1b8add8d36136975e6af73bb7a51f28cac5939ef`.
Diese Änderung ist ein prüfbarer lokaler Entwurf. Kein Push, Liveupload,
Formspree-Eingriff oder Testmail. Die veröffentlichte Seite bleibt aktiv.
Die Änderung betrifft `kontakt.html`; das bestehende Homepage-mailto-Formular
bleibt unverändert. Gestaltung, CSS, Navigation und übrige Seiten bleiben erhalten.

## Verhalten und Schutzgrenzen

`contact.php` lädt die Anwendung aus dem privaten Verzeichnis neben `public_html`.
Der Server akzeptiert ausschließlich begrenztes UTF-8-JSON, feste Feldnamen,
Name 1–120 Zeichen, validierte Mail-Adresse bis 254 Bytes, Nachricht 10–5000
Zeichen und insgesamt höchstens 22000 Bytes. Steuerzeichen in Headerfeldern,
zusätzliche Empfänger-/Anhangsfelder, gefüllter Honeypot und ungültige Tokens
werden abgewiesen. Nachricht ist ausschließlich Klartext.

From, Envelope-Sender und Empfänger sind fest `office@mentalcoach-ts.de`.
Besucheradresse wird nur Reply-To. Keine Anhänge, Autoreplies oder freien
Empfänger. SMTP über PHPMailer, Pflicht-TLS mit Zertifikatsprüfung, 465/SMTPS
oder 587/STARTTLS; keine Debugausgabe oder Wiedergabe interner Fehlermeldungen.
SMTP-Host und aktive Hetzner-PHP-Version sind noch nicht im Auftrag verifiziert.

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
Aktive Hosting-Version, private Ablage, Schreibrechte, TLS/SMTP und Zustellung
sind vor Veröffentlichung noch nachzuweisen.

Nach gesonderter Nutzerfreigabe am 08.10.2026 läuft PHP 8.5.11 x64 NTS VS17
portabel außerhalb des Repositorys. Offizielle ZIP-Quelle und SHA256 wurden
vor Ausführung geprüft: `0ea96e0d2b9b737a6036f05cf4e95c49313faa6d0f27bd97edb2742503f0c043`.
Keine PATH-, Firewall- oder Systemkonfigurationsänderung, keine Zusatzinstallation;
die nötige Microsoft-Laufzeit war bereits vorhanden. Composer bleibt unnötig.

Alle zehn PHP-Dateien bestehen `php -l`; 27 PHP-Mock-/Negativ-/Paralleltests PASS.
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
Nur Windows/PHP8.5.11 geprüft, keine Ausführung auf PHP8.2 oder Hetzner/Linux.
Insbesondere Linux-Rechte, Hosting-Pfade/open_basedir, aktives PHP, SMTP und
Postfachzustellung bleiben vor Veröffentlichung gesondert nachzuweisen.

Mit bereits vorhandener Laufzeit, ohne Installation:

```text
php tests/contact-service.php
# Syntax: jede *.php-Datei mit php -l prüfen, einschließlich vendorter Klassen.
node --check assets/contact-form.mjs
node --test tests/contact-form.test.mjs
python scripts/check-contact-static.py
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

Nach gesonderter Deploy- und Secretfreigabe soll die Zielstruktur sein:

```text
ACCOUNT_ROOT/
  public_html/
    kontakt.html
    contact.php
    assets/contact-form.mjs
    ...bestehende Website...
  private/
    mentalcoach-contact/
      bootstrap.php
      ContactService.php
      SmtpTransport.php
      config.php
      state/                        # 0700, PHP-User muss schreiben können
      vendor/PHPMailer/...
```

Der Einstieg verlangt genau `dirname(public_html)/private/mentalcoach-contact`.
Absoluten Kontopfad, DOCUMENT_ROOT, open_basedir und private Lesbarkeit vorab
im vorhandenen Hosting prüfen. Bei anderem Documentroot den kleinen Einstieg
vor Deployment kontrolliert anpassen und erneut testen. Kein unbekanntes
automatisches Fallback in Webroot. config.php 0600, state 0700; außerhalb Webroot.
Die Anwendung verweigert unter Linux gruppen-/weltlesbare config/state.

Timo trägt später im geschützten Provider-/Serverkontext den **verifizierten**
Hetzner-SMTP-Host, vorhandene Office-Zugangsdaten und einen unvorhersehbaren
Token-Schlüssel (mindestens 32 Bytes) ein. Vorlage zunächst `enabled=false`;
keine echten Werte ins Repo, Archiv oder Chat. Diese Vorbereitung erzeugt oder
liest keine produktiven Secrets. Aktivierung ist kein Teil dieses Auftrags.

Reihenfolge für einen späteren freigegebenen Einsatz: PHP-/Dateirechte- und
Pfadkompatibilität der tatsächlichen Hostingumgebung nachweisen; Datenschutztext
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

Rollback: vorherige kontakt.html wiederherstellen und neuen Moduleintrag
entfernen; dann neuen öffentlichen contact.php entfernen/deaktivieren.
Vorherige Formspree-Konfiguration unverändert erhalten. Private state-Ledger
bis zum Ablauf laufender Tokens erhalten; Löschen/Leeren im Betrieb könnte
Replay-Schutz aufheben. Kein automatisches Provider- oder Mailkontoänderungsverfahren.
