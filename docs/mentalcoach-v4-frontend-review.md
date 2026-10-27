# Aktueller Versionsabgleich, 27.10.2026 (nur lokal vorbereitet)

Der am 26.10.2026 veröffentlichte Stand mc-contact-focus-6877692ffc18b142 wurde am 27.10. erneut über öffentliche HTTPS-Rohbytes abgeglichen: 79/79 Dateien entsprechen dem gesicherten Live-Manifest. Der unveränderte PR4-Head 90509aa09f7d3801c549e83d0feb272874938a0a enthält noch 22 ältere HTML-Dateien; zwei versionierte CSS fehlen. Dieses lokal vorbereitete Delta umfasst genau diese 24 Frontendpfade und diesen aktualisierten Prüfbericht. Noch nicht nach GitHub übertragen. Kein Merge oder neuer Livewechsel.

WhatsApp: bestehender Link auf mobilen Ansichten im Footerfluss. Kontaktseite: zusätzliche Scrollreserve und unmittelbares Scrollen bei kurzen mobilen Ansichten. Farben, Bilder, Rechtstexte, Formularmodul, Backend und Mailroute werden durch dieses Delta nicht geändert. Tracking bleibt deaktiviert. Automatische Eingangsbestätigung wurde vom Nutzer gestrichen und bleibt inaktiv; ältere diesbezügliche Vorschläge sind keine aktuellen Anforderungen.

Historische Releasebelege vom 26.10.: 22 HTML und zwei CSS live hashgeprüft, 55 weitere öffentliche Dateien unverändert, 12 echte Browserfälle mit mobilen Emulationsansichten und Desktop sowie 10 HTTPS-Weiterleitungsprüfungen bestanden. Diese Browserprüfungen wurden am 27.10. nicht erneut ausgeführt. Physische Bildschirmtastatur, andere Browser und Screenreader bleiben ungeprüft. Vollständige lokale Rückfalldateien: 22 HTML. Private serverseitige Backup-Nachinventur aktuell nicht möglich, da keine Chrome/WebFTP-Anbindung in der ASUS-Toolübersicht verfügbar ist; keine neue Anmeldung begonnen.

Vier bekannte reine CRLF/LF-Abweichungen (beide Fontlizenzen, robots.txt, sitemap.xml) bleiben aus diesem Delta ausgeschlossen. .htaccess ist separat produktiv und nicht Teil dieses Frontendpakets. Main unverändert; PR bleibt Draft/unmerged. Keine Workflow-Läufe am überprüften Head gemeldet: dies ist keine bestandene CI-Prüfung. Historischer Pages-Trigger main/root erfordert vor jedem späteren Merge eine frische Nebenwirkungsprüfung.

Die folgenden Abschnitte dokumentieren ältere Stände und werden nicht als aktueller Aktivierungsstatus ausgegeben.

---

# Neuer lokaler Kontaktfeedback-Stand, 26.10.2026

Revision mc-contact-feedback-41572a4d5b1d8e15, nur lokal geprüft. Das folgende Zwei-Dateien-Frontenddelta ist noch nicht veröffentlicht: kontakt.html mit Warnhinweis vor Gesundheits-/vertraulichen Coachingdaten und Bindung an assets/contact-form.99d3ab941aec.mjs. Neues Modul zeigt Nachricht versendet ausschließlich nach erfolgreicher HTTP-Antwort mit ok:true/code:accepted. Status bleibt zum Versand angenommen, kein Zustellnachweis. Fehler/Timeouts, Wiederholungssperre und No-JS-Sperre bleiben erhalten. Alte Modulversionen bleiben bestehen. Kein CSS-/Design-, Backend-, Datenschutztext- oder Trackingdelta.

12 lokale echte Chrome-Browserfälle mit synthetischem Mocktransport bestanden, Windows Chrome156.0.8078.47, Desktop1440/mobile390-Emulation und Tastatur. Erfolg, Serverfehler, ungültige/limitierte/widersprüchliche Antwort, simulierte Token-/POST-Timeouts, ungültiges JSON, Modulfehler, JS aus und Doppelereignisse geprüft. 0 reale Backend-/SMTP-/externe Requests. Modulsyntax und Zwei-Dateien-Patch mit exaktem Roundtrip bestanden. Fehlgeschlagener erster Tastatur-Fixturelauf lokal erhalten und durch korrigierten vollständigen Lauf aufgelöst. Keine Tests unveränderter Gesamtseite wiederholt.

Eine automatische Empfangsbestätigung ist NICHT aktiviert. Separater lokaler Policy-Prototyp mit 13 Node-Mocktests prüft neutrale Inhalte, getrennte Hauptannahme, Empfänger-/IP-/Gesamtbudgets und Idempotenz. Keine PHP-/SMTP-/persistente Workerabnahme; Prototyp und Datenschutzentwurf werden nicht in diesen PR-Upload aufgenommen.

Letzter bestätigter PR4-Head nach manuellem Startseitencommit: 74b31845a7237b7bafc153d3402ffef868a5f986. Vor jedem menschlichen Upload frisch prüfen; bei Drift stoppen. Genau zwei Frontenddateien plus dieser bestehende Prüfbericht, keine .htaccess oder Backups. Kein Merge; Pages aus main/root kann bei Mainänderung veröffentlichen. Livewechsel separat durch Nutzerentscheidung, neues Modul vor Kontakt-HTML, Rückweg nur Kontakt-HTML bei Erhalt aller Module.

---

# Vorheriger Startseiten-/V4-Prüfstand (historisch, zeitlich getrennt)

# Aktueller Prüfstand: bestätigte Live-Startseitenkorrektur

Stand 25.10.2026. Dieser Abschnitt ersetzt die überholten Release-Gates der unten ausdrücklich historischen Vorabprüfung.

Die genehmigte V4-Veröffentlichung ist erfolgt. Danach wurde ausschließlich die Startseite aus dem lokal geprüften Kandidaten **mc-mobile-render-jpeg-6d8d83d27fde3079** korrigiert: vier vorhandene Motive als JPEG unter neuen Pfaden, zwei responsive Stylesheets und index.html. Keine anderen HTML-Änderungen dieses lokalen Gesamtkandidaten übernehmen. Die sechs Assets wurden zuerst auf öffentliche Rohbytes, Größe, MIME und TLS geprüft; danach Indexwechsel. Öffentlicher Index: 54668 Bytes, SHA256 0634557b37a2244a96ecd74bdc9a7e5641976e7453550e39f39ad923f793a1e5. Nutzer bestätigte auf dem betroffenen Handy: „Ja, läuft wieder. Danke“. Keine Ausweitung dieser Bestätigung auf Unterseiten.

Fünf neue produktive Windows-Chrome-Prüfungen bei 320/360/390/412 und 1440px bestanden: vollständige mobile Bildverhältnisse, kein horizontaler Überlauf, Sportteaser/Karten, mobile Menü-Tastatur/Escape/Fokusrückgabe, Desktop-Dropdown und Kontaktinitialisierung mit genau einem Handler. Screenshots visuell geprüft. Echte Formularübertragung und externe Requests blockiert, tatsächlich 0 Submit-/Backend-/externe Versuche in diesen Prüfungen. Mobile ist Desktop-Chrome-Emulation; der zusätzliche Nutzerbeleg ist kein instrumentierter Android-/Cachetest. Farbstreifenursache nicht eindeutig bewiesen. JPEGs zusammen 964440 Bytes, können auch versteckt auf Desktop zusätzlich geladen werden.

21 übrige HTML-Seiten und vier Originalbilder nach dem Wechsel bytegenau unverändert geprüft. Kontaktseite, beide Modulversionen und measurement-config unverändert. Tracking enabled=false und deploymentApproved=false. Keine Backend/PHP/Mail/DNS-Änderung. Separat produktive HTTPS-Konfiguration bleibt auf dem Server, wird in diesem genehmigten Frontend-Commit nicht veröffentlicht.

Rückweg: unmittelbar vorher gesicherter V4-Index, 52848 Bytes, SHA256 44b530904109d28874f7da54a5a334eccd89a34bf028de55952433547cac2923. Nur diesen Index bei Regression wieder einsetzen; neue Assets für gecachte Sitzungen, beide Formularmodule und HTTPS bewahren. Kein pauschaler Vor-V4-Rollback. Regulärer WebFTP-Austausch ist nicht atomar; mögliche kurze Seitenlücke wurde genehmigt. Keine Regression beobachtet, kein Rückweg ausgeführt.

Vor dieser Branchsicherung frisch geprüft: erwarteter Parent d022e294de84e5845ee836960d5423406f8101bb, PR4 Draft/unmerged, Main 1b8add8d36136975e6af73bb7a51f28cac5939ef unverändert. Keine eigenen Workflowdateien oder Repository-Webhooks sichtbar. Installierte Apps: ChatGPT Codex Connector, Linear Code, Slack; kein Deploymentanbieter sichtbar. GitHub Pages veröffentlicht aus main / (root), deshalb weiterhin **kein Merge**; Merge könnte einen Pages-Build/Deployment auslösen. Kein Workflow gestartet und keine Kostenfreiheit behauptet. Vorher 0 Reviews/Statuschecks/Check-Runs/Head-Workflow-Runs: keine CI-Abnahme.

Dieser Commit sichert ausschließlich die sieben bereits bestätigten öffentlichen Frontendpfade plus diesen Prüfbericht im bestehenden Draft-PR. Keine neue Liveänderung, keine Trackingaktivierung, keine .htaccess-Datei, Backups, Fixtures, Rohlogs, Zugangsdaten oder Kundendaten. Ein separat genehmigter einmaliger synthetischer Mailtest ist hier nicht vorweg als erfolgreich dargestellt; Versand und tatsächlicher Eingang erfordern getrennte Belege.

---

# Historische Vorabprüfung vor Veröffentlichung

Der folgende ursprüngliche Bericht dokumentiert damalige Tests und damalige offene Gates; seine Aussagen „not live approved“ oder „not executed in production“ beschreiben den damaligen Stand und werden durch den aktuellen Abschnitt oben berichtigt.

# Mentalcoach frontend: version-separated contact module, review only

Current local candidate: **mc-form-split-95ad245f2de82ca5**, based on mc-v4-cachefix-3980c90aaa40bba2 and frozen V4 mc-ga4-v4-e316edbf9d2a71e7. **NOT APPROVED FOR LIVE RELEASE. Do not merge, deploy or activate tracking.** The earlier production form regression was rolled back. These local checks do not prove its sole historical cause or current live equality.

## Exact follow-up scope

Three public paths change from PR4 head 1b40d9f0a9e83dc3433c0fadfa1ed73dd5e86975:

- kontakt.html binds assets/contact-form.ac9845e62fdb.mjs instead of the former query-versioned bare path. HTML SHA256: 5f78098210798be0a5e31e2c882048ab42f132f9ef929014e54609025ac66ef7.
- assets/contact-form.ac9845e62fdb.mjs is added with the unchanged reviewed new module bytes, SHA256 ac9845e62fdbc10c57c4d59540fdb2d67b8a6a8f2ced680394e82dd878c2e170.
- assets/contact-form.mjs retains the verified legacy module bytes, SHA256 ab725fa954a45d0e744029595ea281e9ef29963c8134ab4ca83f53b5cf470312, to support old HTML sessions.

This technical report is the fourth updated path. The new complete local package has 70 public files; 67 remain byte-identical to the previous 69-file candidate. All public HTML/JS/MJS/CSS were checked for contact-module references: only kontakt.html loads it. No backend/PHP/mail/DNS/layout/legal-text or analytics implementation changes. Public contact remains timo@mentalcoach-ts.de; technical office mail roles are unchanged. No fixtures, raw logs, backups, customer data or credentials are included.

## Why separate file identities

Twelve preceding isolated transition cases showed that old HTML with the newer bare module returns before attaching a submit handler, permitting native fallback. New HTML with the old module stays disabled. Warm caches can mask both incomplete updates and rollbacks. Query versioning alone does not preserve old and new origin bytes independently. These findings supersede the earlier recommendation to replace the bare module first.

The new candidate keeps the legacy bare path and binds new HTML to a separate content-bound file. Neither module's implementation was edited. The original old-form native fallback when JavaScript or its module is unavailable is unchanged and is not claimed fixed.

## New local verification

**14 actual Chrome/Playwright browser cases PASS** on the version-separated package: staging both files while old HTML remains active; existing and fresh old pages; new HTML with warm legacy cache; old open session after activation; new open session after HTML rollback; warm-cache rollback and reactivation; cold new and rollback controls; new module HTTP404 and wrong MIME/nosniff; actual browser JavaScript disabled; mobile390px controlled flow and keyboard-accessible email alternative; previous PR4 query-bound HTML remaining safely disabled.

Each exercised active submission had exactly one application handler, application preventDefault and one in-memory token/accepted exchange. Modules were checked against their hashes. Cache reuse was checked using server request counts without browser request-routing/cache disabling. No disk-cache claim, production cache equivalence, physical-mobile or full accessibility certification is made. The mobile screenshot was visually reviewed. Prior four Node/nine browser checks and twelve transition cases are historical evidence, not newly rerun tests in this step.

Both module syntax checks and the minimal three-file patch apply-check/byte-exact isolated roundtrip PASS. All 69 source candidate files and the old source pair remained unchanged; all 70 new candidate files matched their manifest. One initial fixture-server path-normalization error prevented module loading; that zero-case failed run is retained locally, followed by one complete successful 14-case run. No product code was changed to satisfy the test helper.

Tests used isolated local loopback serving, restrictive CSP, external HTTPS blocking, memory-only fetch mocks and a final observer that blocks uncaught native submission. Zero non-GET or backend requests reached the test server; no external transfers, real mail, analytics events or PHP execution. Browsers and servers were closed. No local tests were repeated merely for this GitHub update. Mock acceptance does not prove real delivery.

## Exchange and rollback plan, not executed

Keep the old bare module unchanged. Stage the independently named new module and required supporting assets first; verify the exact public filename, MIME, redirects, headers and full hash. WebFTP suffix copies are not canonical replacements. Only then switch HTML and inspect initialization without a real message. Never overwrite immutable module bytes under the same content-bound filename.

For HTML rollback restore the verified old HTML and preserve both module versions plus assets needed by still-open/cached new HTML. Do not immediately apply the old absence/deletion list to the new versioned module. Asset cleanup requires a verified cache/session-retention strategy. Atomic directory replacement alone does not eliminate cached old HTML. The local exchange/rollback sequence passed in the stated cases; productive acceptance and complete overall release-manifest binding remain separate gates.

Earlier PR4/V4 HTML using the old bare/query binding can remain disabled until it reloads the new HTML. No universal compatibility with every cached prior draft is claimed. Existing legacy fallback risks are unchanged.

## Remaining boundaries

Open before release: current raw server-backup content hashes, full release/rollback manifest retaining both modules, actual new production URL/header/MIME/hash checks after separately approved staging, productive switch acceptance and explicit release permission. No release is authorized by this draft.

Tracking remains enabled=false/deploymentApproved=false with transport closed. The public project measurement ID is not activation; prior isolated SDK HTTP204 responses did not establish dashboard processing. Real analytics activation and legal/transparency decisions remain separate. Existing contact.php/backend and technical mail route are not changed or installed by this frontend draft; backend draft PR3 remains separate. No new mail-delivery proof is claimed. Main and production remain untouched by this GitHub backup step.


