/* Disclosure navigation: ordinary links retain their normal browser behavior. */
(() => {
  const items = [...document.querySelectorAll('.nav-item.has-dropdown')];
  const setExpanded = (item, expanded) => {
    item.querySelector('.dropdown-toggle').setAttribute('aria-expanded', String(expanded));
    item.querySelector('.dropdown').hidden = !expanded;
  };
  const closeOthers = (keep) => items.forEach(item => { if (item !== keep) setExpanded(item, false); });
  items.forEach(item => {
    const toggle = item.querySelector('.dropdown-toggle');
    const links = [...item.querySelectorAll('.dropdown a')];
    const open = () => { closeOthers(item); setExpanded(item, true); };
    toggle.addEventListener('click', () => {
      if (toggle.getAttribute('aria-expanded') === 'true') setExpanded(item, false);
      else open();
    });
    item.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') open(); });
    item.addEventListener('pointerleave', () => {
      if (!item.contains(document.activeElement)) setExpanded(item, false);
    });
    item.addEventListener('focusout', event => {
      if (!item.contains(event.relatedTarget)) setExpanded(item, false);
    });
    item.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        if (toggle.getAttribute('aria-expanded') === 'true') {
          event.preventDefault(); event.stopPropagation();
          setExpanded(item, false); toggle.focus();
        }
      } else if (event.target === toggle || event.target === item.querySelector(':scope > a')) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault(); open();
          (event.key === 'ArrowDown' ? links[0] : links.at(-1)).focus();
        }
      }
    });
  });
  document.addEventListener('click', event => {
    if (!items.some(item => item.contains(event.target))) closeOthers();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeOthers();
  });

  const drawer = document.getElementById('mobileDrawer');
  const toggle = document.getElementById('navToggle');
  const closeButton = document.getElementById('navClose');
  const desktop = window.matchMedia('(min-width: 981px)');
  let opener = toggle;
  let previousOverflow = '';
  const previousInert = new Map();
  const focusables = () => [...drawer.querySelectorAll('a[href], button:not([disabled])')]
    .filter(element => element.getClientRects().length);
  const closeDrawer = () => {
    if (drawer.hidden) return;
    previousInert.forEach((value, element) => { element.inert = value; });
    previousInert.clear();
    drawer.classList.remove('open'); drawer.inert = true; drawer.hidden = true;
    drawer.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = previousOverflow;
    const target = opener?.getClientRects().length ? opener : document.querySelector('.brand-lockup');
    target?.focus();
  };
  toggle.addEventListener('click', () => {
    if (!drawer.hidden || desktop.matches) return;
    closeOthers();
    opener = document.activeElement;
    previousOverflow = document.body.style.overflow;
    [...document.body.children].forEach(element => {
      if (element !== drawer && !['SCRIPT', 'STYLE'].includes(element.tagName)) {
        previousInert.set(element, element.inert); element.inert = true;
      }
    });
    drawer.hidden = false; drawer.inert = false; drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false'); toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; closeButton.focus();
  });
  closeButton.addEventListener('click', closeDrawer);
  drawer.querySelectorAll('a').forEach(link => link.addEventListener('click', closeDrawer));
  document.addEventListener('keydown', event => {
    if (drawer.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); closeDrawer(); }
    else if (event.key === 'Tab') {
      const targets = focusables();
      const first = targets[0], last = targets.at(-1);
      if (event.shiftKey && (document.activeElement === first || !drawer.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !drawer.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    }
  });
  desktop.addEventListener('change', () => { closeOthers(); if (desktop.matches) closeDrawer(); });
})();
