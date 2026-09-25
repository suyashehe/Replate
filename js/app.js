/* RePlate – router, app shell and role-based navigation */
(function () {
  const Views = window.Views = {};
  const e = s => Fmt.esc(s);

  /* ---------- role navigation ---------- */
  const NAV = {
    donor: [
      { id: 'dashboard', label: 'Dashboard', icon: 'grid', href: '#/app/dashboard', bottom: 'Home', bIcon: 'home' },
      { id: 'donate', label: 'Donate Food', icon: 'plus', href: '#/app/donate', bottom: 'Donate', primary: true },
      { id: 'donations', label: 'My Donations', icon: 'list', href: '#/app/donations', bottom: 'Donations' },
      { id: 'notifications', label: 'Notifications', icon: 'bell', href: '#/app/notifications', bottom: 'Alerts' },
      { id: 'profile', label: 'Profile', icon: 'user', href: '#/app/profile', bottom: 'Profile' }
    ],
    ngo: [
      { id: 'dashboard', label: 'Dashboard', icon: 'grid', href: '#/app/dashboard', bottom: 'Home', bIcon: 'home' },
      { id: 'available', label: 'Available Donations', icon: 'soup', href: '#/app/available', bottom: 'Available' },
      { id: 'accepted', label: 'My Accepted Donations', icon: 'handHeart', href: '#/app/accepted', bottom: 'Accepted' },
      { id: 'pickup-requests', label: 'Pickup Requests', icon: 'userCheck', href: '#/app/pickup-requests' },
      { id: 'notifications', label: 'Notifications', icon: 'bell', href: '#/app/notifications', bottom: 'Alerts' },
      { id: 'profile', label: 'Profile', icon: 'user', href: '#/app/profile', bottom: 'Profile' }
    ],
    volunteer: [
      { id: 'dashboard', label: 'Dashboard', icon: 'grid', href: '#/app/dashboard', bottom: 'Home', bIcon: 'home' },
      { id: 'pickups', label: 'Available Pickups', icon: 'inbox', href: '#/app/pickups', bottom: 'Requests' },
      { id: 'verify', label: 'QR Verification', icon: 'qr', href: '#/app/verify', bottom: 'Scan QR', primary: true },
      { id: 'my-pickups', label: 'My Pickups', icon: 'package', href: '#/app/my-pickups', bottom: 'My Pickups' },
      { id: 'notifications', label: 'Notifications', icon: 'bell', href: '#/app/notifications' },
      { id: 'profile', label: 'Profile', icon: 'user', href: '#/app/profile', bottom: 'Profile' }
    ],
    supermarket: [
      { id: 'dashboard', label: 'Dashboard', icon: 'grid', href: '#/app/dashboard', bottom: 'Home', bIcon: 'home' },
      { id: 'sm-add', label: 'Add Packaged Food', icon: 'plus', href: '#/app/sm-add', bottom: 'Add' },
      { id: 'scanner', label: 'Barcode Scanner', icon: 'barcode', href: '#/app/scanner', bottom: 'Scan', primary: true },
      { id: 'expiry', label: 'Expiry Alerts', icon: 'hourglass', href: '#/app/expiry', bottom: 'Expiry' },
      { id: 'donations', label: 'Donations', icon: 'list', href: '#/app/donations' },
      { id: 'notifications', label: 'Notifications', icon: 'bell', href: '#/app/notifications' },
      { id: 'profile', label: 'Profile', icon: 'user', href: '#/app/profile', bottom: 'Profile' }
    ],
    admin: [
      { id: 'dashboard', label: 'Dashboard', icon: 'grid', href: '#/app/dashboard', bottom: 'Home', bIcon: 'home' },
      { id: 'users', label: 'Users', icon: 'users', href: '#/app/users', bottom: 'Users' },
      { id: 'all-donations', label: 'Donations', icon: 'list', href: '#/app/all-donations', bottom: 'Donations' },
      { id: 'users-ngo', label: 'NGOs', icon: 'handHeart', href: '#/app/users/ngo' },
      { id: 'users-volunteer', label: 'Volunteers', icon: 'userCheck', href: '#/app/users/volunteer' },
      { id: 'monitor', label: 'Monitor Pickups', icon: 'qr', href: '#/app/monitor' },
      { id: 'reports', label: 'Reports', icon: 'chart', href: '#/app/reports', bottom: 'Reports' },
      { id: 'notifications', label: 'Notifications', icon: 'bell', href: '#/app/notifications' },
      { id: 'profile', label: 'Profile', icon: 'user', href: '#/app/profile', bottom: 'Profile' }
    ]
  };
  const MORE = {
    donor: [{ id: 'history', label: 'Donation History', icon: 'history', href: '#/app/history' }, { id: 'reports', label: 'Impact Report', icon: 'chart', href: '#/app/reports' }],
    ngo: [{ id: 'history', label: 'Donation History', icon: 'history', href: '#/app/history' }, { id: 'reports', label: 'Reports', icon: 'chart', href: '#/app/reports' }],
    volunteer: [{ id: 'reports', label: 'My Impact', icon: 'chart', href: '#/app/reports' }],
    supermarket: [{ id: 'history', label: 'Donation History', icon: 'history', href: '#/app/history' }, { id: 'reports', label: 'Impact Report', icon: 'chart', href: '#/app/reports' }],
    admin: [{ id: 'users-donor', label: 'Donors', icon: 'store', href: '#/app/users/donor' }]
  };

  /* ---------- routes ---------- */
  const ALL = ['donor', 'ngo', 'volunteer', 'supermarket', 'admin'];
  const ROUTES = [
    { p: /^#?\/?$/, v: 'landing', pub: true },
    { p: /^#\/login$/, v: 'login', pub: true },
    { p: /^#\/register$/, v: 'register', pub: true },
    { p: /^#\/components$/, v: 'components', pub: true },
    { p: /^#\/app\/dashboard$/, v: 'dashboard', nav: 'dashboard', roles: ALL },
    { p: /^#\/app\/donate$/, v: 'donate', nav: 'donate', roles: ['donor', 'supermarket'] },
    { p: /^#\/app\/donate\/edit\/([\w-]+)$/, v: 'donate', nav: 'donations', roles: ['donor', 'supermarket'], k: ['editId'] },
    { p: /^#\/app\/donations$/, v: 'myDonations', nav: 'donations', roles: ['donor', 'supermarket'] },
    { p: /^#\/app\/donation\/([\w-]+)$/, v: 'donationDetails', roles: ALL, k: ['id'] },
    { p: /^#\/app\/track\/([\w-]+)$/, v: 'track', roles: ALL, k: ['id'] },
    { p: /^#\/app\/history$/, v: 'history', nav: 'history', roles: ['donor', 'ngo', 'supermarket'] },
    { p: /^#\/app\/available$/, v: 'available', nav: 'available', roles: ['ngo'] },
    { p: /^#\/app\/accept\/([\w-]+)$/, v: 'accept', nav: 'available', roles: ['ngo'], k: ['id'] },
    { p: /^#\/app\/accepted$/, v: 'accepted', nav: 'accepted', roles: ['ngo'] },
    { p: /^#\/app\/pickup-requests$/, v: 'pickupRequests', nav: 'pickup-requests', roles: ['ngo'] },
    { p: /^#\/app\/pickups$/, v: 'availablePickups', nav: 'pickups', roles: ['volunteer'] },
    { p: /^#\/app\/request\/([\w-]+)$/, v: 'request', nav: 'pickups', roles: ['volunteer'], k: ['id'] },
    { p: /^#\/app\/my-pickups$/, v: 'myPickups', nav: 'my-pickups', roles: ['volunteer'] },
    { p: /^#\/app\/verify$/, v: 'verify', nav: 'verify', roles: ['volunteer'] },
    { p: /^#\/app\/verify\/([\w-]+)$/, v: 'verify', nav: 'verify', roles: ['volunteer'], k: ['id'] },
    { p: /^#\/app\/sm-add$/, v: 'smAdd', nav: 'sm-add', roles: ['supermarket'] },
    { p: /^#\/app\/scanner$/, v: 'scanner', nav: 'scanner', roles: ['supermarket'] },
    { p: /^#\/app\/expiry$/, v: 'expiry', nav: 'expiry', roles: ['supermarket'] },
    { p: /^#\/app\/notifications$/, v: 'notifications', nav: 'notifications', roles: ALL },
    { p: /^#\/app\/profile$/, v: 'profile', nav: 'profile', roles: ALL },
    { p: /^#\/app\/reports$/, v: 'reports', nav: 'reports', roles: ALL },
    { p: /^#\/app\/users$/, v: 'users', nav: 'users', roles: ['admin'] },
    { p: /^#\/app\/users\/(\w+)$/, v: 'users', roles: ['admin'], k: ['role'] },
    { p: /^#\/app\/all-donations$/, v: 'history', nav: 'all-donations', roles: ['admin'] },
    { p: /^#\/app\/monitor$/, v: 'monitor', nav: 'monitor', roles: ['admin'] },
    { p: /^#\/app\/components$/, v: 'components', nav: 'components', roles: ALL }
  ];

  /* ---------- shared donation card ---------- */
  const Cards = window.Cards = {
    donation(d, o) {
      o = o || {};
      const pickup = Fmt.pickup(d);
      const safe = d.safeUntil ? Fmt.dateTime(d.safeUntil) : '—';
      return '<article class="dcard">' +
        '<div class="dcard-main">' + UI.thumb(d) +
        '<div class="dcard-info"><div class="dcard-top"><div><span class="id-tag">' + d.id + '</span><h4>' + e(d.food) + '</h4></div>' + (o.badge || UI.status(d.status)) + '</div>' +
        '<div class="sub">' + e(o.sub || (d.quantity + ' · ' + d.servings + ' servings · ' + d.category)) + '</div>' +
        '<div class="metas">' + (o.metas || [
          UI.meta('clock', 'Pickup ' + pickup),
          UI.meta('pin', e(d.location)),
          o.showSafe ? UI.meta('hourglass', 'Safe till ' + safe) : '',
          o.showDistance ? UI.meta('nav', d.distance + ' km away') : ''
        ]).join('') + '</div></div></div>' +
        (o.foot ? '<div class="dcard-foot">' + o.foot + '</div>' : '') +
        '</article>';
    }
  };

  /* ---------- helpers ---------- */
  function navFor(u) { return NAV[u.role] || []; }
  function isActive(item, current) { return item.id === current; }

  function sidebar(u, current) {
    const unread = Store.unreadCount(u.id);
    const link = it => '<a class="side-link ' + (isActive(it, current) ? 'active' : '') + '" href="' + it.href + '">' + icon(it.icon) + '<span>' + it.label + '</span>' +
      (it.id === 'notifications' && unread ? '<span class="nb">' + unread + '</span>' : '') + '</a>';
    return '<aside class="sidebar" id="sidebar" aria-label="Main navigation"><div class="side-in">' +
      '<div class="side-brand"><a class="brand" href="#/">' + logoMark(34) + '<span>Re<b>Plate</b></span></a></div>' +
      '<div class="side-role">' + UI.avatar(u, 'sm') + '<div><b>' + e(u.org || u.name) + '</b><small>' + Store.ROLE_LABEL[u.role] + ' account</small></div></div>' +
      '<div class="side-label">Menu</div>' + navFor(u).map(link).join('') +
      ((MORE[u.role] || []).length ? '<div class="side-label">More</div>' + MORE[u.role].map(link).join('') : '') +
      link({ id: 'components', label: 'UI Components', icon: 'layers', href: '#/app/components' }) +
      (u.role === 'donor' ? '<div class="side-help"><b>Have surplus food?</b><p>Don\'t waste it. RePlate it.</p><a class="btn btn-light btn-sm btn-block" href="#/app/donate">' + icon('plus') + 'Donate Food</a></div>' : '') +
      '<div class="side-foot"><button class="side-link" data-action="logout" style="border:0;background:none;width:100%">' + icon('logout') + '<span>Logout</span></button></div>' +
      '</div></aside><div class="drawer-backdrop" data-action="close-drawer"></div>';
  }

  function bottomNav(u, current) {
    const unread = Store.unreadCount(u.id);
    return '<nav class="bottom-nav" aria-label="Bottom navigation">' + navFor(u).filter(i => i.bottom).map(it =>
      '<a href="' + it.href + '" class="' + (isActive(it, current) ? 'active ' : '') + (it.primary ? 'primary-tab' : '') + '"' + (isActive(it, current) ? ' aria-current="page"' : '') + '>' +
      (it.primary ? '<span class="bn-ic">' + icon(it.icon) + '</span>' : icon(it.bIcon || it.icon)) + '<span>' + it.bottom + '</span>' +
      (it.id === 'notifications' && unread ? '<span class="nb">' + unread + '</span>' : '') + '</a>').join('') + '</nav>';
  }

  function topbar(u, title) {
    const unread = Store.unreadCount(u.id);
    return '<header class="topbar"><div class="topbar-in">' +
      '<button class="icon-btn menu-toggle" data-action="open-drawer" aria-label="Open menu">' + icon('menu') + '</button>' +
      '<a class="brand" href="#/app/dashboard">' + logoMark(30) + '<span>Re<b>Plate</b></span></a>' +
      '<form class="search" role="search" data-action="global-search"><label class="sr-only" for="gsearch">Search</label>' + icon('search') + '<input id="gsearch" class="input" placeholder="Search donations, food, NGO, location…" autocomplete="off"></form>' +
      '<div class="topbar-actions">' +
      '<a class="icon-btn" href="#/app/notifications" aria-label="Notifications' + (unread ? ', ' + unread + ' unread' : '') + '">' + icon('bell') + (unread ? '<span class="count">' + unread + '</span>' : '') + '</a>' +
      '<a class="user-chip" href="#/app/profile" aria-label="Profile">' + UI.avatar(u, 'sm') + '<span class="uc-text"><b>' + e(u.name) + '</b><small>' + Store.ROLE_LABEL[u.role] + '</small></span></a>' +
      '</div></div></header>';
  }

  /* ---------- router ---------- */
  function match(hash) {
    const path = hash.split('?')[0].replace(/^(#[^#]*)#.*$/, '$1');
    for (const r of ROUTES) {
      const m = path.match(r.p);
      if (m) {
        const params = {};
        (r.k || []).forEach((k, i) => params[k] = m[i + 1]);
        return { r, params };
      }
    }
    return null;
  }

  let cleanup = null;
  function render() {
    if (cleanup) { try { cleanup(); } catch (err) {} cleanup = null; }
    UI.closeModal();
    const hash = location.hash || '#/';
    const found = match(hash);
    const u = Store.currentUser();
    const root = document.getElementById('app');
    document.body.classList.remove('drawer-open');

    if (!found) { location.replace(u ? '#/app/dashboard' : '#/'); return; }
    const { r, params } = found;
    const view = Views[r.v];

    if (!r.pub) {
      if (!u) { App.afterLogin = hash; location.replace('#/login'); return; }
      if (r.roles && !r.roles.includes(u.role)) { UI.toast('That page is not available for your role.', 'warning'); location.replace('#/app/dashboard'); return; }
    }

    if (r.pub && (r.v === 'login' || r.v === 'register') && u) { location.replace('#/app/dashboard'); return; }

    if (r.pub) {
      root.innerHTML = view.render(params, u);
      document.title = (view.title ? (typeof view.title === 'function' ? view.title(params, u) : view.title) + ' · ' : '') + 'RePlate';
    } else {
      const title = typeof view.title === 'function' ? view.title(params, u) : view.title;
      document.title = title + ' · RePlate';
      root.innerHTML = '<div class="app">' + sidebar(u, r.nav || params.role && 'users-' + params.role) +
        '<div class="app-col">' + topbar(u, title) + '<main class="main" id="main">' + view.render(params, u) + '</main></div>' +
        bottomNav(u, r.nav) + '</div>';
    }
    window.scrollTo(0, 0);
    if (view.mount) cleanup = view.mount(root, params, u) || null;
  }

  /* ---------- global events ---------- */
  document.addEventListener('click', ev => {
    const a = ev.target.closest('[data-action]');
    if (!a) return;
    const act = a.dataset.action;
    if (act === 'open-drawer') document.body.classList.add('drawer-open');
    else if (act === 'close-drawer') document.body.classList.remove('drawer-open');
    else if (act === 'logout') {
      ev.preventDefault();
      UI.confirm({ title: 'Log out?', text: 'You will need to log in again to manage donations.', ok: 'Logout', icon: 'logout' }).then(ok => {
        if (!ok) return;
        Store.clearSession();
        location.hash = '#/login';
        UI.toast('You have been logged out.', 'info');
      });
    }
  });
  document.addEventListener('submit', ev => {
    if (ev.target.matches('[data-action="global-search"]')) {
      ev.preventDefault();
      const q = ev.target.querySelector('input').value.trim();
      const u = Store.currentUser();
      App.searchQuery = q;
      App.go(u.role === 'ngo' ? '#/app/available' : u.role === 'volunteer' ? '#/app/pickups' : u.role === 'admin' ? '#/app/all-donations' : '#/app/history');
    }
  });
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape') { UI.closeModal(); document.body.classList.remove('drawer-open'); }
  });

  window.App = {
    Views, NAV, afterLogin: null, searchQuery: '', prefill: null,
    start() {
      window.addEventListener('hashchange', render);
      render();
    },
    render,
    go(h) { if (location.hash === h) render(); else location.hash = h; },
    /* simple form validation: rules = {name: fn(value, form) -> error|''} */
    validate(form, rules) {
      let ok = true, first = null;
      Object.keys(rules).forEach(name => {
        const el = form.elements[name];
        if (!el) return;
        const f = el.closest ? el.closest('.field') : null;
        const msg = rules[name](el.value != null ? String(el.value).trim() : '', form);
        if (f) { f.classList.toggle('invalid', !!msg); const em = f.querySelector('.err-msg'); if (em) em.textContent = msg || ''; }
        if (msg) { ok = false; if (!first) first = el; }
      });
      if (first) first.focus();
      return ok;
    }
  };
})();
