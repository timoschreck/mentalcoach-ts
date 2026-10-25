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
