/* RePlate – administrator: dashboard, user management, pickup monitoring */
(function () {
  const V = App.Views;
  const e = s => Fmt.esc(s);

  Dash.admin = {
    render(u) {
      const s = Store.state, all = Store.donations().filter(d => d.status !== 'Cancelled');
      const users = s.users;
      const cnt = r => users.filter(x => x.role === r && x.status === 'Active').length;
      const tiles = [
        ['users', 'Manage Users', users.length + ' accounts', '#/app/users', 'green'], ['store', 'Manage Donors', users.filter(x => x.role === 'donor' || x.role === 'supermarket').length + ' donors', '#/app/users/donor', 'orange'],
        ['handHeart', 'Manage NGOs', cnt('ngo') + ' active', '#/app/users/ngo', 'blue'], ['userCheck', 'Manage Volunteers', cnt('volunteer') + ' active', '#/app/users/volunteer', 'violet'],
        ['list', 'Manage Donations', all.length + ' donations', '#/app/all-donations', 'green'], ['qr', 'Monitor Pickups', all.filter(d => d.status === 'Volunteer Assigned').length + ' in progress', '#/app/monitor', 'amber'],
        ['chart', 'Reports', 'Sustainability', '#/app/reports', 'green'], ['bell', 'Notifications', Store.unreadCount(u.id) + ' unread', '#/app/notifications', 'orange']
      ];
      const roleData = [['Donors', 'donor'], ['Supermarkets', 'supermarket'], ['NGOs', 'ngo'], ['Volunteers', 'volunteer']].map(([l, r]) => ({ label: l, value: users.filter(x => x.role === r).length * 9 + (r === 'donor' ? 96 : r === 'volunteer' ? 30 : 12) }));
      return '<div class="page-head"><div><h1>Admin Dashboard</h1><p>Platform overview for ' + Fmt.date(new Date().toISOString()) + '.</p></div><div class="actions"><a class="btn btn-outline" href="#/app/reports">' + icon('chart') + 'Reports</a><a class="btn btn-primary" href="#/app/users">' + icon('users') + 'Manage Users</a></div></div>' +
        '<div class="stat-grid six">' +
        UI.stat('Total Users', 480 + users.length, 'users', 'green') +
        UI.stat('Total Donations', Fmt.num(PlatformStats().donations), 'package', 'orange') +
        UI.stat('Active NGOs', PlatformStats().ngos, 'handHeart', 'blue') +
        UI.stat('Active Volunteers', PlatformStats().volunteers, 'userCheck', 'violet') +
        UI.stat('Completed Pickups', Fmt.num(1180 + all.filter(d => d.status === 'Picked Up').length), 'checkCircle', 'green') +
        UI.stat('Pending Donations', all.filter(d => d.status === 'Pending').length, 'hourglass', 'amber') + '</div>' +
        '<div class="section-title"><h3>Admin Sections</h3></div>' +
        '<div class="tiles">' + tiles.map(t => '<a class="tile" href="' + t[3] + '"><span class="t-ic tone-' + t[4] + '">' + icon(t[0]) + '</span><div><b>' + t[1] + '</b><small>' + t[2] + '</small></div></a>').join('') + '</div>' +
        '<div class="grid-2" style="margin-top:16px">' +
        '<div class="card"><div class="card-head"><h3>' + icon('chart') + 'Donations over time</h3><span class="muted" style="font-size:.8rem">Last 7 months</span></div><div class="card-body">' + UI.lineChart(adminSeries(), { label: 'Donations over time' }) + '</div></div>' +
        '<div class="card"><div class="card-head"><h3>' + icon('layers') + 'Food categories</h3></div><div class="card-body">' + UI.donut(Store.CATEGORIES.map(c => ({ label: c, value: all.filter(d => d.category === c).length })).filter(x => x.value), { centerLabel: 'donations' }) + '</div></div>' +
        '<div class="card"><div class="card-head"><h3>' + icon('list') + 'Donation status</h3></div><div class="card-body">' + UI.hbars(Store.STATUSES.map(st => ({ label: st, value: all.filter(d => d.status === st).length, cls: Store.STATUS_META[st].cls }))) + '</div></div>' +
        '<div class="card"><div class="card-head"><h3>' + icon('users') + 'Active users by role</h3></div><div class="card-body">' + UI.barChart(roleData, { label: 'Active users by role', values: true }) + '</div></div>' +
        '</div>' +
        '<div class="section-title"><h3>Recent Donations</h3><a href="#/app/all-donations">View all</a></div>' +
        '<div class="card"><div class="table-wrap"><table class="table stack"><thead><tr><th>Donation</th><th>Donor</th><th>NGO</th><th>Created</th><th>Status</th></tr></thead><tbody>' +
        all.slice(0, 6).map(d => '<tr><td class="td-main"><a class="cell-food" href="#/app/donation/' + d.id + '" style="color:inherit">' + UI.thumb(d) + '<div><b>' + e(d.food) + '</b><small>' + d.id + ' · ' + d.servings + ' servings</small></div></a></td><td data-label="Donor">' + e(d.donorName) + '</td><td data-label="NGO">' + e(d.ngoName || '—') + '</td><td data-label="Created">' + Fmt.rel(d.created) + '</td><td data-label="Status">' + UI.status(d.status) + '</td></tr>').join('') +
        '</tbody></table></div></div>';
    }
  };

  V.users = {
    title: p => p.role ? { donor: 'Manage Donors', ngo: 'Manage NGOs', volunteer: 'Manage Volunteers' }[p.role] || 'Users' : 'Manage Users',
    render(p) {
      const t = V.users.title(p);
      const roles = [['', 'All'], ['donor', 'Donors'], ['supermarket', 'Supermarkets'], ['ngo', 'NGOs'], ['volunteer', 'Volunteers'], ['admin', 'Admins']];
      return '<div class="page-head"><div><h1>' + t + '</h1><p>View, verify and manage platform accounts.</p></div></div>' +
        '<div class="toolbar"><div class="chips" id="roles">' + roles.map(r => '<button class="chip ' + ((p.role || '') === r[0] ? 'active' : '') + '" data-r="' + r[0] + '">' + r[1] + '</button>').join('') + '</div>' +
        '<div class="search">' + icon('search') + '<input class="input" id="q" placeholder="Search name, email or organization" aria-label="Search users"></div></div>' +
        '<div class="card"><div class="table-wrap"><table class="table stack"><thead><tr><th>User</th><th>Role</th><th>Organization</th><th>Location</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead><tbody id="rows"></tbody></table></div></div>';
    },
    mount(root, p) {
      let r = p.role || '';
      const draw = () => {
        const q = root.querySelector('#q').value.toLowerCase();
        const list = Store.state.users.filter(x => (!r || x.role === r || (r === 'donor' && x.role === 'supermarket' && p.role === 'donor')) && (!q || (x.name + x.email + x.org).toLowerCase().includes(q)));
        root.querySelector('#rows').innerHTML = list.length ? list.map(x => '<tr><td class="td-main"><div class="cell-user">' + UI.avatar(x, 'sm') + '<div><b>' + e(x.name) + '</b><small>' + e(x.email) + '</small></div></div></td>' +
          '<td data-label="Role">' + UI.badge(Store.ROLE_LABEL[x.role], x.role === 'ngo' ? 'accepted' : x.role === 'volunteer' ? 'assigned' : x.role === 'admin' ? 'neutral' : 'orange') + '</td>' +
          '<td data-label="Organization">' + e(x.org) + '<br><small class="muted">' + e(x.orgType) + '</small></td><td data-label="Location">' + e(x.location) + '</td><td data-label="Joined">' + Fmt.date(x.joined) + '</td>' +
          '<td data-label="Status">' + UI.badge(x.status, x.status === 'Active' ? 'success' : 'danger') + '</td>' +
          '<td data-label="Actions"><div style="display:flex;gap:6px;justify-content:flex-end"><button class="btn btn-outline btn-sm" data-view="' + x.id + '">View</button>' +
          (x.role !== 'admin' ? '<button class="btn btn-sm ' + (x.status === 'Active' ? 'btn-danger-soft' : 'btn-secondary') + '" data-toggle="' + x.id + '">' + (x.status === 'Active' ? 'Suspend' : 'Activate') + '</button>' : '') + '</div></td></tr>').join('')
          : '<tr><td colspan="7">' + UI.empty('users', 'No users found', 'Try a different search or role.') + '</td></tr>';
      };
      root.querySelector('#roles').addEventListener('click', ev => {
        const b = ev.target.closest('.chip'); if (!b) return;
        root.querySelectorAll('#roles .chip').forEach(x => x.classList.toggle('active', x === b)); r = b.dataset.r; p = {}; draw();
      });
      root.querySelector('#q').addEventListener('input', draw);
      root.querySelector('#rows').addEventListener('click', ev => {
        const v = ev.target.closest('[data-view]'), t = ev.target.closest('[data-toggle]');
        if (v) {
          const x = Store.user(v.dataset.view);
          const dn = Store.donations().filter(d => d.donorId === x.id || d.ngoId === x.id || d.volunteerId === x.id);
          UI.modal({
            title: 'User details',
            body: '<div class="person" style="margin-bottom:12px">' + UI.avatar(x, 'lg') + '<div><h3 style="margin:0">' + e(x.name) + '</h3><small>' + Store.ROLE_LABEL[x.role] + ' · ' + e(x.org) + '</small></div></div>' +
              [['mail', 'Email', x.email], ['phone', 'Phone', x.phone], ['pin', 'Location', x.location], ['tag', 'Type', x.orgType], ['calendar', 'Joined', Fmt.date(x.joined)], ['package', 'Donations involved', dn.length]].map(r => '<div class="info-row"><span class="ir-ic">' + icon(r[0]) + '</span><div><small>' + r[1] + '</small><b>' + e(r[2]) + '</b></div></div>').join(''),
            footer: '<button class="btn btn-primary" data-close>Close</button>'
          });
        }
        if (t) {
          const x = Store.user(t.dataset.toggle);
          const suspend = x.status === 'Active';
          UI.confirm({ title: (suspend ? 'Suspend ' : 'Activate ') + x.name + '?', text: suspend ? 'They will not be able to log in until reactivated.' : 'They will regain access to RePlate.', ok: suspend ? 'Suspend' : 'Activate', danger: suspend }).then(ok => {
            if (!ok) return; x.status = suspend ? 'Suspended' : 'Active'; Store.save(); UI.toast(x.name + (suspend ? ' suspended.' : ' activated.'), suspend ? 'info' : 'success'); draw();
          });
        }
      });
      draw();
    }
  };

  V.monitor = {
    title: 'Monitor Pickups',
    render() {
      const all = Store.donations();
      const waiting = all.filter(d => d.status === 'Accepted'), inprog = all.filter(d => d.status === 'Volunteer Assigned'), done = all.filter(d => d.status === 'Picked Up').slice(0, 5);
      const card = (d, extra) => Cards.donation(d, { metas: [UI.meta('store', e(d.donorName)), UI.meta('handHeart', e(d.ngoName || '—')), UI.meta('clock', Fmt.pickup(d)), extra || ''], foot: '<a class="btn btn-outline btn-sm" href="#/app/donation/' + d.id + '">View</a><a class="btn btn-outline btn-sm" href="#/app/track/' + d.id + '">Track</a>' });
      return '<div class="page-head"><div><h1>Monitor Pickups</h1><p>Live view of volunteer assignment and QR-verified pickups.</p></div></div>' +
        '<div class="stat-grid" style="margin-bottom:16px">' + UI.stat('Awaiting volunteer', waiting.length, 'refresh', 'amber') + UI.stat('Pickup in progress', inprog.length, 'userCheck', 'violet') + UI.stat('Verified today', all.filter(d => d.qrUsed && new Date(d.verifiedAt).toDateString() === new Date().toDateString()).length, 'qr', 'green') + '</div>' +
        '<div class="section-title"><h3>Awaiting volunteer</h3></div>' + (waiting.length ? '<div class="card-list two-lg">' + waiting.map(d => card(d, UI.meta('refresh', d.declinedBy.length + ' declined'))).join('') + '</div>' : '<div class="card">' + UI.empty('checkCircle', 'Every accepted donation has a volunteer.') + '</div>') +
        '<div class="section-title"><h3>Pickup in progress</h3></div>' + (inprog.length ? '<div class="card-list two-lg">' + inprog.map(d => card(d, UI.meta('userCheck', e(d.volunteerName)))).join('') + '</div>' : '<div class="card">' + UI.empty('package', 'No pickups in progress.') + '</div>') +
        '<div class="section-title"><h3>Recently verified</h3></div><div class="card-list two-lg">' + done.map(d => card(d, UI.meta('qr', 'Verified ' + Fmt.rel(d.verifiedAt)))).join('') + '</div>';
    }
  };
})();
