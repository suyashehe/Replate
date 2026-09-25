/* RePlate – shared pages: dashboard router, history, notifications, profile, reports, component library */
(function () {
  const V = App.Views;
  const e = s => Fmt.esc(s);

  V.dashboard = {
    title: 'Dashboard',
    render(p, u) { return Dash[u.role].render(u); },
    mount(root, p, u) { const m = Dash[u.role].mount; return m ? m(root, u) : null; }
  };

  /* ---------- history ---------- */
  function scopeFor(u) {
    const all = Store.donations();
    if (u.role === 'admin') return all;
    if (u.role === 'ngo') return all.filter(d => d.ngoId === u.id);
    return all.filter(d => d.donorId === u.id);
  }
  V.history = {
    title: (p, u) => u.role === 'admin' ? 'Manage Donations' : 'Donation History',
    render(p, u) {
      const q = App.searchQuery || ''; App.searchQuery = '';
      const admin = u.role === 'admin';
      return '<div class="page-head"><div><h1>' + (admin ? 'Manage Donations' : 'Donation History') + '</h1><p>' + (admin ? 'Every donation on the platform, with its NGO and volunteer.' : 'A complete record of your donations.') + '</p></div>' +
        '<div class="actions"><button class="btn btn-outline" id="csvBtn">' + icon('download') + 'Export CSV</button></div></div>' +
        '<div class="card card-pad" style="margin-bottom:16px"><div class="search" style="margin-bottom:12px">' + icon('search') + '<input class="input" id="q" value="' + e(q) + '" placeholder="Search by ID, food, donor, NGO or volunteer" aria-label="Search"></div>' +
        '<div class="filters">' +
        '<label class="field" style="margin:0"><span class="label">From</span><input class="input" type="date" id="from"></label>' +
        '<label class="field" style="margin:0"><span class="label">To</span><input class="input" type="date" id="to"></label>' +
        '<label class="field" style="margin:0"><span class="label">Status</span><select class="input" id="status"><option value="">All statuses</option>' + Store.STATUSES.concat('Cancelled').map(s => '<option>' + s + '</option>').join('') + '</select></label>' +
        '<label class="field" style="margin:0"><span class="label">Food category</span><select class="input" id="cat"><option value="">All categories</option>' + Store.CATEGORIES.map(s => '<option>' + s + '</option>').join('') + '</select></label>' +
        '</div><div class="row-between" style="margin-top:12px"><small class="muted" id="count"></small><button class="link-btn" id="clear">Clear filters</button></div></div>' +
        '<div class="card"><div class="table-wrap"><table class="table stack"><thead><tr><th>Donation</th><th>Quantity</th><th>Date</th>' + (u.role !== 'ngo' ? '<th>NGO</th>' : '<th>Donor</th>') + '<th>Volunteer</th><th>Status</th><th></th></tr></thead><tbody id="rows"></tbody></table></div></div>';
    },
    mount(root, p, u) {
      const $ = id => root.querySelector('#' + id);
      let rows = [];
      const draw = () => {
        const q = $('q').value.toLowerCase(), from = $('from').value, to = $('to').value, st = $('status').value, cat = $('cat').value;
        rows = scopeFor(u).filter(d => {
          const day = ymd(new Date(d.created));
          return (!q || [d.id, d.food, d.donorName, d.ngoName, d.volunteerName].join(' ').toLowerCase().includes(q)) &&
            (!from || day >= from) && (!to || day <= to) && (!st || d.status === st) && (!cat || d.category === cat);
        });
        $('count').textContent = rows.length + ' donation' + (rows.length === 1 ? '' : 's');
        $('rows').innerHTML = rows.length ? rows.map(d => '<tr><td class="td-main"><div class="cell-food">' + UI.thumb(d) + '<div><b>' + e(d.food) + '</b><small>' + d.id + ' · ' + e(d.category) + (u.role === 'admin' ? ' · ' + e(d.donorName) : '') + '</small></div></div></td>' +
          '<td data-label="Quantity">' + e(d.quantity) + '<br><small class="muted">' + d.servings + ' servings</small></td>' +
          '<td data-label="Date">' + Fmt.date(d.created) + '</td>' +
          '<td data-label="' + (u.role !== 'ngo' ? 'NGO' : 'Donor') + '">' + e(u.role !== 'ngo' ? (d.ngoName || '—') : d.donorName) + '</td>' +
          '<td data-label="Volunteer">' + e(d.volunteerName || '—') + '</td>' +
          '<td data-label="Status">' + UI.status(d.status) + '</td>' +
          '<td data-label=""><a class="btn btn-outline btn-sm" href="#/app/donation/' + d.id + '">View</a></td></tr>').join('')
          : '<tr><td colspan="7">' + UI.empty('inbox', 'No donations available yet.', 'No donations match your filters.') + '</td></tr>';
      };
      ['q', 'from', 'to', 'status', 'cat'].forEach(id => $(id).addEventListener('input', draw));
      $('clear').addEventListener('click', () => { ['q', 'from', 'to', 'status', 'cat'].forEach(id => $(id).value = ''); draw(); });
      $('csvBtn').addEventListener('click', () => {
        const head = ['Donation ID', 'Food', 'Category', 'Quantity', 'Servings', 'Date', 'Donor', 'NGO', 'Volunteer', 'Status'];
        const lines = [head].concat(rows.map(d => [d.id, d.food, d.category, d.quantity, d.servings, Fmt.date(d.created), d.donorName, d.ngoName || '', d.volunteerName || '', d.status]));
        const csv = lines.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = 'replate-donations.csv'; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      });
      draw();
    }
  };

  /* ---------- notifications ---------- */
  const N_META = {
    donation: ['package', 'green'], accepted: ['handHeart', 'blue'], volunteer: ['userCheck', 'violet'], picked: ['checkCircle', 'green'],
    new: ['soup', 'orange'], request: ['inbox', 'orange'], reminder: ['clock', 'amber'], expiry: ['hourglass', 'amber'],
    users: ['users', 'blue'], alert: ['alert', 'red'], report: ['chart', 'green'], welcome: ['leaf', 'green']
  };
  function dayGroup(iso) {
    const d = new Date(iso), t = new Date(); t.setHours(0, 0, 0, 0);
    const diff = (t - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5;
    return diff <= 0 ? 'Today' : diff === 1 ? 'Yesterday' : 'Earlier';
  }
  V.notifications = {
    title: 'Notifications',
    render() {
      return '<div class="page-head"><div><h1>Notifications</h1><p>Updates about your donations, pickups and alerts.</p></div><div class="actions"><button class="btn btn-outline btn-sm" id="readAll">' + icon('check') + 'Mark all as read</button></div></div>' +
        '<div class="segmented" id="tabs" style="margin-bottom:16px;max-width:320px"><button class="active" data-t="all">All</button><button data-t="unread">Unread</button></div>' +
        '<div class="card" id="list" style="overflow:hidden;max-width:820px"></div>';
    },
    mount(root, p, u) {
      let t = 'all';
      const draw = () => {
        const list = Store.notificationsFor(u.id).filter(n => t === 'all' || !n.read);
        if (!list.length) { root.querySelector('#list').innerHTML = UI.empty('bell', 'You\'re all caught up!', 'New updates about donations and pickups will appear here.'); return; }
        let last = '', html = '';
        list.forEach(n => {
          const g = dayGroup(n.time);
          if (g !== last) { html += '<div class="day-label">' + g + '</div>'; last = g; }
          const m = N_META[n.type] || ['bell', 'green'];
          html += '<div class="notif ' + (n.read ? '' : 'unread') + '" data-id="' + n.id + '" role="link" tabindex="0"><span class="n-ic tone-' + m[1] + '">' + icon(m[0]) + '</span><div style="flex:1;min-width:0"><b>' + e(n.title) + '</b><p>' + e(n.text) + '</p><time>' + Fmt.rel(n.time) + '</time></div>' + (n.read ? '' : '<span class="unread-dot" aria-label="Unread"></span>') + '</div>';
        });
        root.querySelector('#list').innerHTML = html;
      };
      const open = el => {
        const n = Store.state.notifications.find(x => x.id === el.dataset.id);
        n.read = true; Store.save();
        if (n.link) location.hash = n.link; else App.render();
      };
      root.querySelector('#list').addEventListener('click', ev => { const el = ev.target.closest('.notif'); if (el) open(el); });
      root.querySelector('#list').addEventListener('keydown', ev => { const el = ev.target.closest('.notif'); if (el && ev.key === 'Enter') open(el); });
      root.querySelector('#tabs').addEventListener('click', ev => {
        const b = ev.target.closest('button'); if (!b) return;
        root.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('active', x === b)); t = b.dataset.t; draw();
      });
      root.querySelector('#readAll').addEventListener('click', () => {
        Store.state.notifications.forEach(n => { if (n.to === u.id) n.read = true; }); Store.save();
        UI.toast('All notifications marked as read.'); App.render();
      });
      draw();
    }
  };

  /* ---------- profile ---------- */
  V.profile = {
    title: 'Profile',
    render(p, u) {
      const row = (ic, k, v) => '<div class="info-row"><span class="ir-ic">' + icon(ic) + '</span><div><small>' + k + '</small><b>' + e(v) + '</b></div></div>';
      const links = {
        donor: [['list', 'My Donations', '#/app/donations'], ['history', 'Donation History', '#/app/history'], ['chart', 'My Impact', '#/app/reports']],
        ngo: [['handHeart', 'My Accepted Donations', '#/app/accepted'], ['history', 'Donation History', '#/app/history'], ['chart', 'Reports', '#/app/reports']],
        volunteer: [['package', 'My Pickups', '#/app/my-pickups'], ['chart', 'My Impact', '#/app/reports']],
        supermarket: [['list', 'Donations', '#/app/donations'], ['hourglass', 'Expiry Alerts', '#/app/expiry'], ['chart', 'Impact Report', '#/app/reports']],
        admin: [['users', 'Manage Users', '#/app/users'], ['chart', 'Reports', '#/app/reports']]
      }[u.role];
      return '<div class="page-head"><div><h1>Profile</h1><p>Manage your account details.</p></div></div>' +
        '<div class="grid-1-1"><div style="display:grid;gap:16px;align-content:start"><div class="card profile-head">' + UI.avatar(u, 'lg') +
        '<label class="cam" for="photo" title="Change photo">' + icon('camera') + '<span class="sr-only">Change profile photo</span></label><input type="file" id="photo" accept="image/*" class="sr-only">' +
        '<h2>' + e(u.name) + '</h2><div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">' + UI.badge(Store.ROLE_LABEL[u.role], 'success', 'shield') + (u.orgType && u.role !== 'admin' ? UI.badge(u.orgType, 'neutral') : '') + '</div>' +
        '<div class="btn-row" style="margin-top:18px;justify-content:center"><button class="btn btn-primary" id="editBtn">' + icon('edit') + 'Edit Profile</button><button class="btn btn-outline" id="pwBtn">' + icon('lock') + 'Change Password</button></div></div>' +
        '<div class="card"><ul class="menu-list">' + links.map(l => '<li><a href="' + l[2] + '">' + icon(l[0]) + l[1] + icon('chevronRight', 'chev') + '</a></li>').join('') +
        '<li><a href="#/app/notifications">' + icon('bell') + 'Notifications' + icon('chevronRight', 'chev') + '</a></li>' +
        '<li><a href="#/app/components">' + icon('layers') + 'UI Component Library' + icon('chevronRight', 'chev') + '</a></li>' +
        '<li><button id="resetBtn">' + icon('refresh') + 'Reset demo data' + icon('chevronRight', 'chev') + '</button></li>' +
        '<li><button class="danger" data-action="logout">' + icon('logout') + 'Logout</button></li></ul></div></div>' +
        '<div class="card"><div class="card-head"><h3>' + icon('user') + 'Account Information</h3></div><div class="card-body" style="padding-top:4px">' +
        row('user', 'Full name', u.name) + row('mail', 'Email', u.email) + row('phone', 'Phone', u.phone) + row('shield', 'Role', Store.ROLE_LABEL[u.role]) +
        row('building', 'Organization name', u.org || '—') + row('tag', u.role === 'volunteer' ? 'Vehicle' : 'Organization type', u.orgType || '—') + row('pin', 'Location', u.location) + row('calendar', 'Member since', Fmt.date(u.joined)) +
        '</div></div></div>';
    },
    mount(root, p, u) {
      root.querySelector('#photo').addEventListener('change', async ev => {
        const f = ev.target.files[0]; if (!f) return;
        try { u.photo = await UI.readImage(f, 240); Store.save(); UI.toast('Profile photo updated.'); App.render(); } catch (err) { UI.toast('Could not read that image.', 'error'); }
      });
      root.querySelector('#editBtn').addEventListener('click', () => {
        const m = UI.modal({
          title: 'Edit Profile',
          body: '<form id="pf" novalidate>' + UI.field('Full name', '<input class="input" name="name" value="' + e(u.name) + '">', { req: true }) +
            UI.field('Phone', '<input class="input" name="phone" value="' + e(u.phone) + '">', { req: true }) +
            (u.role !== 'volunteer' && u.role !== 'admin' ? UI.field('Organization name', '<input class="input" name="org" value="' + e(u.org) + '">', { req: true }) : '') +
            UI.field('Location', '<input class="input" name="location" value="' + e(u.location) + '">', { req: true }) + '</form>',
          footer: '<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="save">Save Changes</button>'
        });
        m.querySelector('#save').addEventListener('click', () => {
          const f = m.querySelector('#pf');
          const rules = { name: v => v.length < 2 ? 'Enter your name.' : '', phone: v => v.replace(/\D/g, '').length < 10 ? 'Enter a valid phone number.' : '', location: v => !v ? 'Enter your location.' : '' };
          if (f.org) rules.org = v => !v ? 'Enter the organization name.' : '';
          if (!App.validate(f, rules)) return;
          u.name = f.name.value.trim(); u.phone = f.phone.value.trim(); u.location = f.location.value.trim(); if (f.org) u.org = f.org.value.trim();
          Store.save(); UI.closeModal(); UI.toast('Profile updated successfully.'); App.render();
        });
      });
      root.querySelector('#pwBtn').addEventListener('click', () => {
        const m = UI.modal({
          title: 'Change Password', size: 'sm',
          body: '<form id="cp" novalidate>' + UI.field('Current password', '<input class="input" type="password" name="cur" autocomplete="current-password">') +
            UI.field('New password', '<input class="input" type="password" name="nw" autocomplete="new-password">', { help: 'At least 6 characters.' }) +
            UI.field('Confirm new password', '<input class="input" type="password" name="cf" autocomplete="new-password">') + '</form>',
          footer: '<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="save">Update Password</button>'
        });
        m.querySelector('#save').addEventListener('click', () => {
          const f = m.querySelector('#cp');
          if (!App.validate(f, { cur: v => v !== u.password ? 'Current password is incorrect.' : '', nw: v => v.length < 6 ? 'Use at least 6 characters.' : v === u.password ? 'Choose a different password.' : '', cf: (v, fm) => v !== fm.nw.value ? 'Passwords do not match.' : '' })) return;
          u.password = f.nw.value; Store.save(); UI.closeModal(); UI.toast('Password changed successfully.');
        });
      });
      root.querySelector('#resetBtn').addEventListener('click', () => {
        UI.confirm({ title: 'Reset demo data?', text: 'All donations, users and notifications return to the original sample data and you will be logged out.', ok: 'Reset', danger: true }).then(ok => {
          if (!ok) return; Store.reset(); Store.clearSession(); location.hash = '#/login'; UI.toast('Demo data restored.');
        });
      });
    }
  };

  /* ---------- reports ---------- */
  function catData(list) {
    return Store.CATEGORIES.map(c => ({ label: c, value: list.filter(d => d.category === c).length })).filter(x => x.value);
  }
  function statusData(list) {
    return Store.STATUSES.map(s => ({ label: s, value: list.filter(d => d.status === s).length, cls: Store.STATUS_META[s].cls }));
  }
  const kg = list => Math.round(list.reduce((a, d) => a + (/kg/.test(d.quantity) ? parseFloat(d.quantity) : (parseFloat(d.quantity) || 0) * 0.25), 0));

  V.reports = {
    title: (p, u) => u.role === 'admin' ? 'Reports' : u.role === 'ngo' ? 'Reports' : 'My Impact',
    render(p, u) {
      const all = Store.donations().filter(d => d.status !== 'Cancelled');
      let head, cards, list;
      if (u.role === 'donor' || u.role === 'supermarket') {
        list = all.filter(d => d.donorId === u.id);
        const done = list.filter(d => d.status === 'Picked Up');
        const serv = done.reduce((a, d) => a + d.servings, 0) + (u.id === 'u1' ? 318 : u.id === 'u4' ? 390 : 0);
        head = '<div class="welcome"><span class="welcome-art">' + icon('leaf') + '</span><span class="eyebrow" style="background:rgba(255,255,255,.14);color:#fff">' + icon('chart') + 'Donation Impact</span>' +
          '<h1>Your organization has donated ' + Fmt.num(serv) + ' servings through RePlate.</h1><p>That\'s about ' + Fmt.num(Math.round(serv * 0.4)) + ' kg of food kept out of landfill and ' + Fmt.num(Math.round(serv * 0.4 * 2.5)) + ' kg of CO₂e avoided.</p></div>';
        cards = [UI.stat('Servings donated', Fmt.num(serv), 'soup', 'orange'), UI.stat('Food donated', kg(list) + ' <small>kg</small>', 'scale', 'green'), UI.stat('Completed donations', done.length, 'checkCircle', 'green'), UI.stat('NGOs supported', new Set(list.filter(d => d.ngoId).map(d => d.ngoId)).size, 'handHeart', 'blue')];
      } else if (u.role === 'ngo') {
        list = all.filter(d => d.ngoId === u.id);
        const done = list.filter(d => d.status === 'Picked Up');
        head = '<div class="welcome"><span class="welcome-art">' + icon('handHeart') + '</span><h1>' + e(u.org) + ' received ' + Fmt.num(done.reduce((a, d) => a + d.servings, 0) + 420) + ' servings through RePlate.</h1><p>Thank you for serving your community.</p></div>';
        cards = [UI.stat('Donations accepted', list.length, 'handHeart', 'blue'), UI.stat('Completed pickups', done.length, 'checkCircle', 'green'), UI.stat('Servings received', Fmt.num(done.reduce((a, d) => a + d.servings, 0) + 420), 'soup', 'orange'), UI.stat('Donors partnered', new Set(list.map(d => d.donorId)).size, 'store', 'violet')];
      } else if (u.role === 'volunteer') {
        list = all.filter(d => d.volunteerId === u.id);
        const done = list.filter(d => d.status === 'Picked Up');
        head = '<div class="welcome"><span class="welcome-art">' + icon('userCheck') + '</span><h1>You\'ve rescued ' + Fmt.num(done.reduce((a, d) => a + d.servings, 0)) + ' servings of food.</h1><p>Every verified pickup helps a meal reach someone who needs it.</p></div>';
        cards = [UI.stat('Completed pickups', done.length, 'checkCircle', 'green'), UI.stat('Servings rescued', done.reduce((a, d) => a + d.servings, 0), 'soup', 'orange'), UI.stat('Distance covered', done.reduce((a, d) => a + d.distance, 0).toFixed(1) + ' <small>km</small>', 'nav', 'blue'), UI.stat('Active pickups', list.filter(d => d.status === 'Volunteer Assigned').length, 'package', 'violet')];
      } else {
        list = all;
        const s = PlatformStats();
        head = '';
        cards = [UI.stat('Total food donated', Fmt.num(s.kg) + ' <small>kg</small>', 'scale', 'green'), UI.stat('Servings redistributed', Fmt.num(s.meals), 'soup', 'orange'), UI.stat('Completed donations', Fmt.num(1180 + all.filter(d => d.status === 'Picked Up').length), 'checkCircle', 'green'),
          UI.stat('Active donors', s.donors, 'store', 'amber'), UI.stat('NGOs', s.ngos, 'handHeart', 'blue'), UI.stat('Volunteers', s.volunteers, 'userCheck', 'violet')];
      }
      return '<div class="page-head"><div><h1>' + (u.role === 'admin' ? 'Sustainability Reports' : 'Impact Report') + '</h1><p>' + (u.role === 'admin' ? 'Platform-wide food redistribution metrics.' : 'How your contribution is making a difference.') + '</p></div><div class="actions"><button class="btn btn-outline" onclick="window.print()">' + icon('download') + 'Print / Save PDF</button></div></div>' +
        head + '<div class="stat-grid ' + (cards.length === 6 ? 'six' : 'four') + '">' + cards.join('') + '</div>' +
        '<div class="grid-2" style="margin-top:16px"><div class="card"><div class="card-head"><h3>' + icon('chart') + (u.role === 'admin' ? 'Donations over time' : 'Servings per month') + '</h3></div><div class="card-body">' + (u.role === 'admin' ? UI.lineChart(adminSeries(), { label: 'Donations per month' }) : UI.barChart(monthlySeries(list), { label: 'Servings per month', highlightLast: true, values: true })) + '</div></div>' +
        '<div class="card"><div class="card-head"><h3>' + icon('layers') + 'Food categories</h3></div><div class="card-body">' + (list.length ? UI.donut(catData(list), { centerLabel: 'donations' }) : UI.empty('chart', 'No data yet')) + '</div></div></div>' +
        '<div class="card" style="margin-top:16px"><div class="card-head"><h3>' + icon('list') + 'Donation status</h3></div><div class="card-body">' + UI.hbars(statusData(list)) + '</div></div>';
    }
  };
  window.adminSeries = function () {
    const now = new Date(), base = [142, 168, 155, 190, 214, 236, 0];
    return base.map((v, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1);
      return { label: d.toLocaleString('en', { month: 'short' }), value: i === 6 ? 180 + Store.state.donations.length : v };
    });
  };

  /* ---------- component library ---------- */
  V.components = {
    title: 'UI Components',
    render(p, u) {
      const pub = !location.hash.startsWith('#/app');
      const sample = Store.donation('RP-1043') || Store.donations()[0];
      const sec = (t, body, col) => '<section class="card kit-section"><div class="card-head"><h3>' + t + '</h3></div><div class="card-body">' + (col ? '<div class="kit-col">' + body + '</div>' : body) + '</div></section>';
      const sw = [['Deep green', '--green-800', '#1F4D2E'], ['Fresh green', '--green-500', '#4C9A5B'], ['Mint', '--green-100', '#E4F1E3'], ['Cream', '--cream', '#FAF8F1'], ['Orange', '--orange', '#E8903A'], ['Amber', '--amber', '#B7791F'], ['Red', '--red', '#C8453B'], ['Charcoal', '--text', '#1F2623']];
      const body =
        '<div class="page-head"><div><h1>RePlate UI Component Library</h1><p>Reusable building blocks used across every screen.</p></div></div>' +
        sec('Colors', sw.map(s => '<div class="swatch"><i style="background:var(' + s[1] + ')"></i><b>' + s[0] + '</b><small>' + s[2] + '</small></div>').join('')) +
        sec('Typography', '<h1 style="margin:0">Heading 1 · Turn surplus into meals</h1><h2 style="margin:0">Heading 2 · Section title</h2><h3 style="margin:0">Heading 3 · Card title</h3><p style="margin:0">Body text: readable 15px Plus Jakarta Sans with a comfortable 1.55 line height.</p><small class="muted">Caption / helper text</small>', true) +
        sec('Buttons', '<button class="btn btn-primary">' + icon('plus') + 'Donate Food</button><button class="btn btn-accent">Accept Donation</button><button class="btn btn-secondary">Secondary</button><button class="btn btn-outline">Outline</button><button class="btn btn-ghost">Ghost</button><button class="btn btn-danger">Reject</button><button class="btn btn-danger-soft">Cancel Donation</button><button class="btn btn-primary btn-sm">Small</button><button class="btn btn-primary btn-lg">' + icon('qr') + 'Scan QR</button><button class="btn btn-primary" disabled>Disabled</button>') +
        sec('Inputs, dropdowns & search', '<div class="form-grid" style="width:100%">' + UI.field('Text input', '<input class="input" placeholder="e.g. Veg Biryani">') + UI.field('Dropdown', '<select class="input"><option>Cooked Food</option><option>Packaged Food</option></select>') +
          '<div class="field invalid"><label>Input with error</label><input class="input" value="not-an-email"><small class="err-msg">Please enter a valid email address.</small></div>' + UI.field('Search bar', '<div class="search">' + icon('search') + '<input class="input" placeholder="Search food, NGO, location…"></div>') + '</div>' +
          '<div class="segmented" style="width:100%;max-width:360px"><button class="active">Ongoing</button><button>Past</button></div><div class="chips"><span class="chip active">All</span><span class="chip">' + icon('soup') + 'Cooked Food</span><span class="chip">' + icon('package') + 'Packaged</span></div>') +
        sec('Status badges', Store.STATUSES.map(s => UI.status(s)).join('') + UI.badge('Safe', 'safe', 'checkCircle') + UI.badge('Expiring Soon', 'warn', 'alert') + UI.badge('Expired', 'danger', 'xCircle') + UI.badge('Cancelled', 'cancelled')) +
        sec('Success / error messages', UI.alert('success', 'Donation submitted successfully ✓') + UI.alert('success', 'Donation accepted successfully ✓') + UI.alert('success', 'QR verified successfully ✓') +
          UI.alert('error', 'Invalid QR code', 'Please scan the correct donation QR.') + UI.alert('error', 'This email is already registered. Please login instead.') + UI.alert('warning', 'Food is expiring soon', 'Schedule an early pickup.') + UI.alert('error', 'This food has expired and cannot be donated.'), true) +
        sec('Dashboard cards', '<div class="stat-grid four" style="width:100%">' + UI.stat('Food Donated', '1,248 <small>kg</small>', 'package', 'green') + UI.stat('People Fed', '3,560', 'users', 'orange') + UI.stat('Active NGOs', '32', 'handHeart', 'blue') + UI.stat('Volunteers', '48', 'userCheck', 'violet') + '</div>') +
        sec('Food card', '<div class="card-list two" style="width:100%">' + Cards.donation(sample, { showSafe: true, showDistance: true, foot: '<button class="btn btn-outline btn-sm">View Details</button><button class="btn btn-primary btn-sm">Accept Donation</button>' }) +
          '<div class="card card-pad"><div class="person">' + UI.avatar(Store.user('u1'), 'lg') + '<div><b>Yashvi Patel</b><small>Donor · Spice Garden Restaurant</small><div style="margin-top:6px">' + UI.badge('Donor', 'success', 'shield') + '</div></div></div><div style="margin-top:12px" class="muted">User profile card</div></div></div>') +
        sec('Progress tracker & timeline', '<div style="width:100%">' + UI.tracker(sample) + '</div><div style="width:100%;max-width:520px;margin-top:10px">' + UI.timeline(sample) + '</div>') +
        sec('QR scanner & barcode scanner areas', '<div class="grid-2" style="width:100%"><div><div class="scanner scanning" style="max-width:260px"><div class="scan-frame"><i></i><i></i><i></i><i></i><div class="scan-ghost">' + icon('qr') + '</div><div class="scan-line"></div></div><div class="scan-hint">Scan donor QR</div></div></div>' +
          '<div><div class="scanner wide scanning" style="max-width:340px"><div class="scan-frame"><i></i><i></i><i></i><i></i><div class="scan-ghost">' + icon('barcode') + '</div><div class="scan-line"></div></div><div class="scan-hint">Scan product barcode</div></div></div></div>' +
          '<div class="grid-2" style="width:100%"><div style="display:grid;gap:10px">' + ['before', 'ok', 'invalid', 'used'].map(k => { const s = { before: ['ss-before', 'qr', 'Before scan', 'Scan the donor\'s QR code to confirm pickup.'], ok: ['ss-ok', 'check', 'Successful', 'QR verified successfully. Pickup confirmed.'], invalid: ['ss-bad', 'x', 'Invalid QR', 'Invalid QR code. Please scan the correct donation QR.'], used: ['ss-used', 'alert', 'Already used', 'This QR code has already been used.'] }[k]; return '<div class="scan-state ' + s[0] + '"><span class="ss-ic">' + icon(s[1]) + '</span><div><b>' + s[2] + '</b><span>' + s[3] + '</span></div></div>'; }).join('') + '</div>' +
          '<div class="qr-box">' + UI.qr('RPQR-1043-DEMO', 150) + '<div class="code-pill">RPQR-1043-DEMO</div></div></div>') +
        sec('Charts', '<div class="grid-2" style="width:100%"><div>' + UI.barChart([{ label: 'Apr', value: 120 }, { label: 'May', value: 160 }, { label: 'Jun', value: 140 }, { label: 'Jul', value: 190 }, { label: 'Aug', value: 230 }], { highlightLast: true }) + '</div><div>' + UI.donut([{ label: 'Cooked Food', value: 48 }, { label: 'Packaged Food', value: 22 }, { label: 'Fruits & Vegetables', value: 18 }, { label: 'Bakery Items', value: 12 }]) + '</div></div>') +
        sec('Table', '<div class="table-wrap" style="width:100%;border:1px solid var(--border-2);border-radius:12px"><table class="table stack"><thead><tr><th>Donation</th><th>Quantity</th><th>NGO</th><th>Status</th></tr></thead><tbody>' + Store.donations().slice(0, 3).map(d => '<tr><td class="td-main"><div class="cell-food">' + UI.thumb(d) + '<div><b>' + e(d.food) + '</b><small>' + d.id + '</small></div></div></td><td data-label="Quantity">' + d.quantity + '</td><td data-label="NGO">' + e(d.ngoName || '—') + '</td><td data-label="Status">' + UI.status(d.status) + '</td></tr>').join('') + '</tbody></table></div>') +
        sec('Notification card', '<div class="card" style="width:100%;max-width:520px;overflow:hidden"><div class="notif unread"><span class="n-ic tone-blue">' + icon('handHeart') + '</span><div><b>NGO accepted your donation</b><p>Hope Foundation accepted RP-1048 (Veg Biryani).</p><time>5 min ago</time></div><span class="unread-dot"></span></div><div class="notif"><span class="n-ic tone-green">' + icon('checkCircle') + '</span><div><b>Food picked up</b><p>RP-1041 was picked up and verified via QR.</p><time>Yesterday</time></div></div></div>') +
        sec('Empty states', '<div class="grid-2" style="width:100%"><div class="card">' + UI.empty('inbox', 'No donations available yet.') + '</div><div class="card">' + UI.empty('package', 'You don\'t have any pickup assignments.') + '</div><div class="card">' + UI.empty('bell', 'You\'re all caught up!') + '</div><div class="card">' + UI.empty('handHeart', 'You haven\'t accepted any donations yet.') + '</div></div>') +
        sec('Modal & confirmation dialog', '<button class="btn btn-outline" id="demoModal">Open modal</button><button class="btn btn-danger-soft" id="demoConfirm">Open confirmation</button><button class="btn btn-secondary" id="demoToast">Show toast</button>') +
        sec('Navigation: bottom nav (mobile) & sidebar (desktop)', '<div class="phone-frame"><div style="padding:16px;height:120px" class="muted">Mobile screen</div><nav class="bottom-nav" style="position:static">' +
          [['home', 'Home', 1], ['plus', 'Donate', 0, 1], ['list', 'Donations'], ['bell', 'Alerts'], ['user', 'Profile']].map(i => '<a class="' + (i[2] ? 'active ' : '') + (i[3] ? 'primary-tab' : '') + '">' + (i[3] ? '<span class="bn-ic">' + icon(i[0]) + '</span>' : icon(i[0])) + '<span>' + i[1] + '</span></a>').join('') + '</nav></div>' +
          '<div class="card" style="width:250px;padding:12px">' + [['grid', 'Dashboard', 1], ['plus', 'Donate Food'], ['list', 'My Donations'], ['bell', 'Notifications'], ['user', 'Profile']].map(i => '<a class="side-link ' + (i[2] ? 'active' : '') + '">' + icon(i[0]) + i[1] + '</a>').join('') + '</div>');
      if (!pub) return body;
      return '<header class="pub-header scrolled"><nav class="pub-nav"><a class="brand" href="#/">' + logoMark(34) + '<span>Re<b>Plate</b></span></a><div class="pub-actions"><a class="btn btn-outline btn-sm" href="#/">' + icon('arrowLeft') + 'Home</a><a class="btn btn-primary btn-sm" href="#/login">Login</a></div></nav></header><main class="container" style="padding-top:24px;padding-bottom:60px">' + body + '</main>';
    },
    mount(root) {
      root.querySelector('#demoModal').addEventListener('click', () => UI.modal({ title: 'Donation details', body: '<p>Modals are used for forms like Edit Profile and Change Password.</p>' + UI.alert('info', 'Tip', 'Press Esc or click outside to close.'), footer: '<button class="btn btn-primary" data-close>Got it</button>' }));
      root.querySelector('#demoConfirm').addEventListener('click', () => UI.confirm({ title: 'Cancel this donation?', text: 'This cannot be undone.', ok: 'Cancel Donation', cancel: 'Keep it', danger: true }));
      root.querySelector('#demoToast').addEventListener('click', () => UI.toast('Donation submitted successfully ✓'));
    }
  };
})();
