const EVENTS = new Set(['page_view', 'contact_form_click', 'contact_email_click', 'contact_phone_click']);
const PAGES = new Set(['home', 'contact']);
const PLACEMENTS = new Set(['hero', 'mobile', 'process', 'contact', 'faq', 'footer', 'other']);

// Explicit application events only. Google still has its own documented automatic events/metadata.
export function createGa4BasicAdapter(options = {}, createDriver = null) {
  const id = options.measurementId;
  const reasons = [];
  if (options.enabled !== true) reasons.push('disabled');
  if (options.deploymentApproved !== true) reasons.push('deployment-not-approved');
  if (typeof id !== 'string' || !/^G-[A-Z0-9]{6,15}$/.test(id)) reasons.push('measurement-id-unverified');
  for (const key of ['projectBindingVerified', 'streamSettingsVerified', 'noticeReviewed', 'driverPrivacyVerified']) {
    if (options[key] !== true) reasons.push(key);
  }
  if (typeof createDriver !== 'function') reasons.push('no-verified-driver');
  const ready = reasons.length === 0;
  let state = null;
  let pageViewAttempted = false;
  const payloadValid = payload => payload && typeof payload === 'object' && !Array.isArray(payload)
    && Object.keys(payload).sort().join(',') === 'event_name,page_id,placement,source'
    && EVENTS.has(payload.event_name) && PAGES.has(payload.page_id)
    && PLACEMENTS.has(payload.placement) && payload.source === 'unknown';
  const neutral = Object.freeze({
    page_location: 'https://mentalcoach-ts.de/', page_title: 'Mentalcoach', page_referrer: '',
    ignore_referrer: true, campaign_id: 'unknown', campaign_source: 'unknown',
    campaign_medium: 'unknown', campaign_name: 'unknown', campaign_term: 'unknown', campaign_content: 'unknown'
  });
  function stop(current) {
    current.stopped = true;
    // The Google driver disables measurement before consent denial and reloads on withdrawal.
    if (!current.driver || current.driverStopped) return;
    current.driverStopped = true;
    try { current.driver.stop(); } catch { /* Remain closed. */ }
  }
  async function transport(payload, context = {}) {
    const {signal} = context;
    if (!ready || !payloadValid(payload) || !signal || signal.aborted) return false;
    const {event_name:eventName, page_id:pageId, placement} = payload;
    if (state && state.signal !== signal) {
      if (!state.stopped) return false;
      state = null;
    }
    if (!state) {
      const current = state = {signal, driver: null, initialized: false, stopped: false, busy: true};
      signal.addEventListener('abort', () => stop(current), {once: true});
      try {
        current.driver = createDriver(Object.freeze({measurementId: id, signal}));
        if (!current.driver || typeof current.driver.initialize !== 'function'
          || typeof current.driver.send !== 'function' || typeof current.driver.stop !== 'function') {
          stop(current); return false;
        }
        if (signal.aborted) { stop(current); return false; }
        const commands = [
          ['consent', 'default', {analytics_storage:'denied', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'}],
          ['set', {...neutral, allow_google_signals:false, allow_ad_personalization_signals:false, ads_data_redaction:true, url_passthrough:false}],
          ['consent', 'update', {analytics_storage:'granted', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied'}],
          ['config', id, {...neutral, send_page_view:false, allow_google_signals:false, allow_ad_personalization_signals:false,
            cookie_domain:'mentalcoach-ts.de', cookie_path:'/'}]
        ];
        const initialized = await current.driver.initialize(commands);
        if (initialized === false || signal.aborted || current.stopped) { stop(current); return false; }
        current.initialized = true;
      } catch { stop(current); return false; }
      finally { current.busy = false; }
    }
    const current = state;
    if (!current.initialized || current.busy || current.stopped || signal.aborted) return false;
    if (eventName === 'page_view') {
      if (pageViewAttempted) return false;
      pageViewAttempted = true;
    }
    // Only explicit public labels. No URL, document.title, referrer or form inspection.
    const command = ['event', eventName, {...neutral, send_to:id,
      page_id:pageId, placement, source:'unknown'}];
    try {
      const accepted = await current.driver.send(command);
      return accepted !== false && !signal.aborted && !current.stopped;
    } catch { stop(current); return false; }
  }
  return Object.freeze({ready, blockedReasons:Object.freeze(reasons), transport:ready ? transport : null});
}
