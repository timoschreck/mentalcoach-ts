# Mentalcoach V4: frontend backup for review

Frozen local revision: mc-ga4-v4-e316edbf9d2a71e7. This draft backs up exactly31 approved frontend files. It does not authorize merging, deployment or analytics activation. Main baseline: 1b8add8d36136975e6af73bb7a51f28cac5939ef. Existing backend preparation remains separately in draft PR#3; no PHP/private backend files are included here.

Changes preserve the existing design: homepage links, keyboard dropdown/drawer behavior, focus and contrast improvements, public contact address, safe contact fallbacks, homepage navigation/FAQ/mobile contact actions, and a consent-gated GA4 adapter/loader. Previously preserved privacy text is retained; no legal approval is implied.

Tracking remains disabled: enabled=false, deploymentApproved=false and transport=null through closed verification gates. G-1KCTKLLL98 is the Mentalcoach-specific public measurement ID. Nothing is sent merely by importing the modules.

Prior local evidence: focused static, keyboard, desktop/mobile, JavaScript/no-JavaScript and mocked transport tests passed in their documented scopes. The later actual isolated SDK run sent one synthetic page_view and one contact_form_click with observed HTTP204 responses. Neutral page fields and consent/revocation behavior were observed in that short test; additional ERR_ABORTED warnings were retained. Dashboard processing was not confirmed by those HTTP responses; no anonymous-data or complete GA4 acceptance claim. No new emails/events or test suites are run for this backup.

Remaining boundaries: actual production frontend is managed separately; no live equality claim here. Legal/transparency review and production activation remain separate decisions. Contact frontend expects the existing contact.php route; this frontend-only PR neither installs nor modifies that backend. Existing main GitHub Pages source is unchanged. Rollback: leave this draft unmerged; prior main and local candidates remain intact.

## Frozen backup, not approved for live release

The coordinating hosting task reports a contact-form regression followed by a production rollback. V4 is not approved for live release. The focused form regression and complete rollback verification remain release gates; no current live equality is asserted here. A separate local cache follow-up fix is outside this frozen V4 revision and is not included. Do not merge or deploy this draft.
