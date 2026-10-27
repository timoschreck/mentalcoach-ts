const HOSTS = new Set(['mentalcoach-ts.de', 'www.mentalcoach-ts.de']);
const LAYER = 'mentalcoachDataLayer';
const MARKER = '__mentalcoachGa4Loader';
const denied = Object.freeze({analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});

/** Google is loaded only after the consent-gated adapter invokes initialize(). */
export function createGoogleTagDriver({measurementId, signal}, win = window) {
  if (!/^G-[A-Z0-9]{6,15}$/.test(measurementId) || !signal || signal.aborted
    || !HOSTS.has(win.location.hostname)) throw new Error('GA4 driver prerequisites unavailable');
  if (win[MARKER] || win.gtag || win.google_tag_manager || win[LAYER]
    || win.document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
    throw new Error('Existing Google tag will not be adopted or loaded twice');
  }
  const disableKey = `ga-disable-${measurementId}`;
  const layer = [];
  const tag = function () { layer.push(arguments); };
  let script = null, loaded = false, stopped = false, timer = null, finish = null;
  win[MARKER] = Object.freeze({measurementId});
  const clearCookies = () => {
    const names = ['_ga', `_ga_${measurementId.slice(2)}`];
    // Only this stream's known root-path cookies; no wildcard deletion or other project cookies.
    for (const name of names) for (const domain of ['', '; Domain=mentalcoach-ts.de', '; Domain=.mentalcoach-ts.de']) {
      win.document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax; Secure${domain}`;
    }
  };
  const close = () => {
    if (stopped) return;
    stopped = true; // Own event gate closes before touching the vendor API.
    win[disableKey] = true;
    const hadScript = script !== null;
    // Disable first; never run a denied-state tag before initial consent.
    if (loaded) tag('consent', 'update', {...denied});
    layer.length = 0;
    if (win.gtag === tag) win.gtag = () => {};
    if (timer !== null) win.clearTimeout(timer);
    if (script) { script.onload = null; script.onerror = null; script.remove(); }
    clearCookies();
    finish?.(false); finish = null;
    // A new document removes vendor timers/listeners. No consent is persisted, so reload has no loader.
    // Loading failure alone never reloads or interrupts a contact action.
    if (signal.aborted && hadScript) win.location.reload();
  };
  return Object.freeze({
    initialize(commands) {
      if (stopped || signal.aborted || script) return Promise.resolve(false);
      win[LAYER] = layer;
      win.gtag = tag;
      win[disableKey] = false;
      for (const command of commands) {
        if (command[0] === 'config') tag('js', new Date());
        tag(...command);
      }
      script = win.document.createElement('script');
      script.async = true;
      script.referrerPolicy = 'no-referrer';
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}&l=${LAYER}`;
      return new Promise(resolve => {
        finish = resolve;
        script.onload = () => {
          if (stopped || signal.aborted) { close(); resolve(false); return; }
          loaded = true; win.clearTimeout(timer); finish = null; resolve(true);
        };
        script.onerror = () => { close(); resolve(false); };
        timer = win.setTimeout(() => { close(); resolve(false); }, 10000);
        win.document.head.append(script);
      });
    },
    send(command) {
      if (stopped || signal.aborted || !loaded || win[disableKey] === true) return false;
      tag(...command);
      return true; // Accepted by local tag API; not proof of Google ingestion or a business conversion.
    },
    stop: close
  });
}
