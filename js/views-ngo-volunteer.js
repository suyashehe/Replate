/* RePlate – NGO and volunteer pages */
(function () {
  const V = App.Views;
  const e = s => Fmt.esc(s);
  const Dash = window.Dash;

  /* ======================= NGO ======================= */
  const availableFor = u => Store.donations().filter(d => d.status === 'Pending' && !(d.ngoDeclined || []).includes(u.id));
  const acceptedBy = u => Store.donations().filter(d => d.ngoId === u.id);

  function ngoCard(d) {
    return Cards.donation(d, {
      showSafe: true, showDistance: true,
      foot: '<a class="btn btn-outline btn-sm" href="#/app/donation/' + d.id + '">' + icon('eye') + 'View Details</a><a class="btn btn-primary btn-sm" href="#/app/accept/' + d.id + '">' + icon('handHeart') + 'Accept Donation</a>'
    });
  }

  function volStatus(d) {
    if (d.status === 'Accepted') return '<span class="meta" style="color:var(--amber)">' + icon('refresh') + '<span>' + (d.declinedBy.length ? 'Finding another volunteer (' + d.declinedBy.length + ' declined)' : 'Volunteer assignment pending') + '</span></span>';
    if (d.status === 'Volunteer Assigned') return '<span class="meta" style="color:var(--violet)">' + icon('userCheck') + '<span>' + e(d.volunteerName) + ' · pickup ' + Fmt.pickup(d) + '</span></span>';
    if (d.status === 'Picked Up') return '<span class="meta" style="color:var(--green-700)">' + icon('checkCircle') + '<span>Picked up by ' + e(d.volunteerName) + ' · QR verified</span></span>';
    return '';
  }

  Dash.ngo = {
    render(u) {
      const avail = availableFor(u), mine = acceptedBy(u);
      const pendingPk = mine.filter(d => d.status === 'Accepted' || d.status === 'Volunteer Assigned');
      return '<section class="welcome"><span class="welcome-art">' + icon('handHeart') + '</span>' +
        '<h1>Hello, ' + e(u.org) + '</h1><p>' + avail.length + ' donations are available near ' + e(u.location) + ' right now. Accept what your community needs.</p>' +
        '<div class="btn-row"><a class="btn btn-accent" href="#/app/available">' + icon('soup') + 'Browse Donations</a><a class="btn btn-light" href="#/app/pickup-requests">' + icon('userCheck') + 'Pickup Requests</a></div></section>' +
        '<div class="stat-grid four">' +
        UI.stat('Available Donations', avail.length, 'soup', 'orange') +
        UI.stat('Accepted Donations', mine.length, 'handHeart', 'blue') +
        UI.stat('Pending Pickups', pendingPk.length, 'clock', 'amber') +
        UI.stat('Completed', mine.filter(d => d.status === 'Picked Up').length, 'checkCircle', 'green') + '</div>' +
        '<div class="grid-2-1" style="margin-top:8px"><div>' +
        '<div class="section-title"><h3>Available Food Donations</h3><a href="#/app/available">View all</a></div>' +
        (avail.length ? '<div class="card-list">' + avail.slice(0, 3).map(ngoCard).join('') + '</div>' : '<div class="card">' + UI.empty('inbox', 'No donations available yet.', 'We\'ll notify you as soon as a donor nearby lists surplus food.') + '</div>') +
        '</div><div><div class="section-title"><h3>Pickup Status</h3><a href="#/app/pickup-requests">Details</a></div>' +
        '<div class="card">' + (pendingPk.length ? pendingPk.map(d => '<a class="info-row" style="padding:12px 16px;color:inherit;text-decoration:none" href="#/app/donation/' + d.id + '">' + UI.thumb(d) + '<div style="min-width:0"><b style="display:block">' + e(d.food) + '</b>' + volStatus(d) + '</div></a>').join('')
          : UI.empty('userCheck', 'No pending pickups', 'Accepted donations waiting for pickup will show here.')) + '</div>' +
        '<div class="card card-pad" style="margin-top:16px">' + UI.hbars([
          { label: 'Meals received this month', value: 420 + mine.filter(d => d.status === 'Picked Up').reduce((a, d) => a + d.servings, 0), cls: 'picked' },
          { label: 'Meals awaiting pickup', value: pendingPk.reduce((a, d) => a + d.servings, 0), cls: 'orange' }]) + '</div>' +
        '</div></div>';
    }
  };

  V.available = {
    title: 'Available Donations',
    render(p, u) {
      const q = App.searchQuery || ''; App.searchQuery = '';
      return '<div class="page-head"><div><h1>Available Donations</h1><p>Fresh surplus food listed by donors near ' + e(u.location) + '.</p></div></div>' +
        '<div class="toolbar"><div class="search">' + icon('search') + '<input class="input" id="q" value="' + e(q) + '" placeholder="Search food, donor or location" aria-label="Search donations"></div>' +
        '<select class="input" id="sort" aria-label="Sort by"><option value="dist">Nearest first</option><option value="safe">Expiring first</option><option value="new">Newest first</option><option value="serv">Most servings</option></select></div>' +
        '<div class="chips" id="cats" style="margin-bottom:16px"><button class="chip active" data-c="">All</button>' + Store.CATEGORIES.map(c => '<button class="chip" data-c="' + c + '">' + icon(Store.CAT_META[c].icon) + c + '</button>').join('') + '</div>' +
        '<div id="list" class="card-list two-lg"></div>';
    },
    mount(root, p, u) {
      let cat = '';
      const draw = () => {
        const q = root.querySelector('#q').value.toLowerCase(), s = root.querySelector('#sort').value;
        let list = availableFor(u).filter(d => (!cat || d.category === cat) && (!q || (d.food + d.donorName + d.location + d.id).toLowerCase().includes(q)));
        list.sort((a, b) => s === 'dist' ? a.distance - b.distance : s === 'safe' ? new Date(a.safeUntil) - new Date(b.safeUntil) : s === 'serv' ? b.servings - a.servings : new Date(b.created) - new Date(a.created));
        root.querySelector('#list').innerHTML = list.length ? list.map(ngoCard).join('') : '<div class="card" style="grid-column:1/-1">' + UI.empty('inbox', 'No donations available yet.', 'Try a different filter, or check back soon.') + '</div>';
      };
      root.querySelector('#cats').addEventListener('click', ev => {
        const b = ev.target.closest('.chip'); if (!b) return;
        root.querySelectorAll('#cats .chip').forEach(x => x.classList.toggle('active', x === b)); cat = b.dataset.c; draw();
      });
      root.querySelector('#q').addEventListener('input', draw);
      root.querySelector('#sort').addEventListener('change', draw);
      draw();
    }
  };

  function summaryRows(d, extra) {
    const row = (ic, k, v) => '<div class="info-row"><span class="ir-ic">' + icon(ic) + '</span><div><small>' + k + '</small><b>' + v + '</b></div></div>';
    return row('soup', 'Food', e(d.food) + ' <span class="muted" style="font-weight:500">(' + e(d.category) + ', ' + e(d.type || '') + ')</span>') +
      row('scale', 'Quantity', e(d.quantity) + ' · ' + d.servings + ' servings') +
      row('store', 'Donor', e(d.donorName) + ' <span class="muted" style="font-weight:500">· ' + e(d.donorType || '') + '</span>') +
      row('pin', 'Location', e((d.address ? d.address + ', ' : '') + d.location) + ' · ' + d.distance + ' km') +
      row('clock', 'Pickup time', Fmt.pickup(d)) +
      row('hourglass', d.expiry ? 'Expiry date' : 'Safe consumption until', d.expiry ? Fmt.date(d.expiry) + ' ' + UI.expiryBadge(expiryInfo(d.expiry)) : Fmt.dateTime(d.safeUntil)) +
      (extra || '');
  }

  V.accept = {
    title: 'Accept Donation',
    render(p, u) {
      const d = Store.donation(p.id);
      if (!d) return '<div class="card">' + UI.empty('xCircle', 'Donation not found') + '</div>';
      const taken = d.status !== 'Pending';
      return '<a class="back-link" href="#/app/available">' + icon('arrowLeft') + 'Available donations</a>' +
        '<div id="acceptArea"><div class="page-head"><div><span class="id-tag">' + d.id + '</span><h1>' + e(d.food) + '</h1><p>Review the details before accepting this donation for ' + e(u.org) + '.</p></div>' + UI.status(d.status) + '</div>' +
        '<div class="grid-1-1"><div class="card" style="overflow:hidden">' + UI.thumb(d, 'lg') +
        (d.notes ? '<div class="card-body">' + UI.alert('info', 'Donor notes', e(d.notes)) + '</div>' : '') + '</div>' +
        '<div class="card"><div class="card-head"><h3>' + icon('info') + 'Food Details</h3></div><div class="card-body" style="padding-top:4px">' + summaryRows(d) +
        (taken ? '<div style="margin-top:14px">' + UI.alert('warning', 'This donation is no longer available.', d.ngoId === u.id ? 'You have already accepted it.' : 'Another NGO accepted it first.') + '</div>'
          : '<div class="btn-row" style="margin-top:18px"><button class="btn btn-outline btn-lg" id="rejectBtn" style="flex:0 1 auto">' + icon('x') + 'Reject</button><button class="btn btn-primary btn-lg" id="acceptBtn">' + icon('handHeart') + 'Accept Donation</button></div>') +
        '</div></div></div></div>';
    },
    mount(root, p, u) {
      const a = root.querySelector('#acceptBtn');
      if (!a) return;
      a.addEventListener('click', () => {
        const d = Store.ngoAccept(p.id, u);
        if (!d) { UI.toast('Sorry, this donation was just accepted by another NGO.', 'error'); App.render(); return; }
        const area = root.querySelector('#acceptArea');
        area.innerHTML = '<div class="card" style="max-width:640px;margin:0 auto"><div class="result">' +
          '<div class="result-ic ok">' + icon('check') + '</div><h2>Donation accepted successfully ✓</h2>' +
          '<p><b>' + e(d.food) + '</b> (' + d.id + ') is now reserved for ' + e(u.org) + '.</p>' +
          '<div class="state-flow">' + UI.status('Pending') + icon('arrowRight', 'arrow') + UI.status('Accepted') + '</div>' +
          '<div class="alert alert-warning" style="text-align:left">' + icon('refresh') + '<div><strong>Volunteer Assignment Pending</strong><span>We\'ve sent the pickup request to nearby volunteers. You\'ll be notified when one accepts.</span></div></div>' +
          '<div class="btn-row" style="margin-top:20px"><a class="btn btn-outline" href="#/app/available">Back to Donations</a><a class="btn btn-primary" href="#/app/donation/' + d.id + '">' + icon('eye') + 'View Donation</a></div>' +
          '</div></div>';
        UI.toast('Donation accepted successfully.');
        window.scrollTo(0, 0);
      });
      root.querySelector('#rejectBtn').addEventListener('click', () => {
        UI.confirm({ title: 'Reject this donation?', text: 'It will be hidden from your list and remain available to other NGOs.', ok: 'Reject', danger: true }).then(ok => {
          if (!ok) return;
          Store.ngoDecline(p.id, u);
          UI.toast('Donation rejected. It stays available for other NGOs.', 'info');
          location.hash = '#/app/available';
        });
      });
    }
  };

  V.accepted = {
    title: 'My Accepted Donations',
    render() {
      return '<div class="page-head"><div><h1>My Accepted Donations</h1><p>Donations your organization has reserved.</p></div></div>' +
        '<div class="segmented" id="tabs" role="tablist" style="margin-bottom:16px"><button class="active" data-t="all">All</button><button data-t="Accepted">Awaiting Volunteer</button><button data-t="Volunteer Assigned">Volunteer Assigned</button><button data-t="Picked Up">Picked Up</button></div>' +
        '<div id="list" class="card-list two-lg"></div>';
    },
    mount(root, p, u) {
      let t = 'all';
      const draw = () => {
        const list = acceptedBy(u).filter(d => t === 'all' || d.status === t);
        root.querySelector('#list').innerHTML = list.length ? list.map(d => Cards.donation(d, {
          metas: [UI.meta('store', e(d.donorName)), UI.meta('clock', 'Pickup ' + Fmt.pickup(d)), volStatus(d)],
          foot: '<a class="btn btn-secondary btn-sm" href="#/app/donation/' + d.id + '">' + icon('eye') + 'View Details</a><a class="btn btn-outline btn-sm" href="#/app/track/' + d.id + '">' + icon('history') + 'Track</a>'
        })).join('') : '<div class="card" style="grid-column:1/-1">' + UI.empty('handHeart', 'You haven\'t accepted any donations yet.', 'Browse available donations and accept what your community needs.', '<a class="btn btn-primary" href="#/app/available">Browse Donations</a>') + '</div>';
      };
      root.querySelector('#tabs').addEventListener('click', ev => {
        const b = ev.target.closest('button'); if (!b) return;
        root.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('active', x === b)); t = b.dataset.t; draw();
      });
      draw();
    }
  };

  V.pickupRequests = {
    title: 'Pickup Requests',
    render(p, u) {
      const list = acceptedBy(u).filter(d => d.status !== 'Picked Up');
      const rows = list.map(d => {
        const vol = d.volunteerId && Store.user(d.volunteerId);
        return '<tr><td class="td-main"><div class="cell-food">' + UI.thumb(d) + '<div><b>' + e(d.food) + '</b><small>' + d.id + ' · ' + d.servings + ' servings</small></div></div></td>' +
          '<td data-label="Donor">' + e(d.donorName) + '</td><td data-label="Pickup">' + Fmt.pickup(d) + '</td>' +
          '<td data-label="Volunteer">' + (vol ? '<div class="cell-user">' + UI.avatar(vol, 'sm') + '<div><b>' + e(vol.name) + '</b><small>' + e(vol.phone) + '</small></div></div>' : '<span class="muted">' + (d.declinedBy.length ? 'Searching (' + d.declinedBy.length + ' declined)' : 'Searching…') + '</span>') + '</td>' +
          '<td data-label="Status">' + (d.status === 'Accepted' ? UI.badge('Volunteer Pending', 'pending') : UI.status(d.status)) + '</td>' +
          '<td data-label=""><a class="btn btn-outline btn-sm" href="#/app/donation/' + d.id + '">View</a></td></tr>';
      }).join('');
      return '<div class="page-head"><div><h1>Pickup Requests</h1><p>Volunteer assignment status for your accepted donations.</p></div></div>' +
        '<div class="stat-grid" style="margin-bottom:16px">' + UI.stat('Awaiting volunteer', list.filter(d => d.status === 'Accepted').length, 'refresh', 'amber') + UI.stat('Volunteer assigned', list.filter(d => d.status === 'Volunteer Assigned').length, 'userCheck', 'violet') + UI.stat('Picked up (all time)', acceptedBy(u).filter(d => d.status === 'Picked Up').length, 'checkCircle', 'green') + '</div>' +
        '<div class="card">' + (list.length ? '<div class="table-wrap"><table class="table stack"><thead><tr><th>Donation</th><th>Donor</th><th>Pickup</th><th>Volunteer</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>'
          : UI.empty('userCheck', 'No open pickup requests', 'When you accept a donation, its volunteer assignment appears here.')) + '</div>';
    }
  };

  /* ======================= VOLUNTEER ======================= */
  const openRequests = u => Store.donations().filter(d => d.status === 'Accepted' && !d.declinedBy.includes(u.id));
  const myPickups = u => Store.donations().filter(d => d.volunteerId === u.id);

  function requestCard(d) {
    return Cards.donation(d, {
      sub: d.quantity + ' · ' + d.servings + ' servings',
      badge: UI.badge(d.distance + ' km', 'orange', 'nav'),
      metas: [UI.meta('store', e(d.donorName) + ', ' + e(d.location)), UI.meta('handHeart', e(d.ngoName)), UI.meta('clock', 'Pickup ' + Fmt.pickup(d))],
      foot: '<a class="btn btn-primary btn-sm" href="#/app/request/' + d.id + '">' + icon('eye') + 'View Request</a>'
    });
  }
  function pickupLabel(d) {
    if (d.status === 'Picked Up') {
      const today = new Date().toDateString() === new Date(d.verifiedAt || d.created).toDateString();
      return today ? UI.status('Picked Up') : UI.badge('Completed', 'success', 'checkCircle');
    }
    const t = new Date(d.pickupDate + 'T' + d.pickupTime);
    return t - Date.now() < 2 * 3600e3 ? UI.badge('Pickup Pending', 'pending') : UI.badge('Assigned', 'assigned');
  }
  function pickupCard(d) {
    return Cards.donation(d, {
      badge: pickupLabel(d),
      metas: [UI.meta('store', e(d.donorName)), UI.meta('pin', e(d.location)), UI.meta('clock', Fmt.pickup(d)), UI.meta('handHeart', e(d.ngoName || '—'))],
      foot: d.status === 'Volunteer Assigned' ? '<a class="btn btn-outline btn-sm" href="#/app/donation/' + d.id + '">View Pickup</a><a class="btn btn-primary btn-sm" href="#/app/verify/' + d.id + '">' + icon('qr') + 'Scan QR</a>'
        : '<a class="btn btn-outline btn-sm" href="#/app/donation/' + d.id + '">' + icon('eye') + 'View Pickup</a>'
    });
  }

  Dash.volunteer = {
    render(u) {
      const reqs = openRequests(u), mine = myPickups(u);
      const assigned = mine.filter(d => d.status === 'Volunteer Assigned').sort((a, b) => (a.pickupDate + a.pickupTime).localeCompare(b.pickupDate + b.pickupTime));
      const next = assigned[0];
      const avail = u.available !== false;
      return '<section class="welcome"><span class="welcome-art">' + icon('userCheck') + '</span>' +
        '<h1>Hi, ' + e(u.name.split(' ')[0]) + '</h1><p>Thank you for volunteering. Every pickup puts a meal on someone\'s plate.</p>' +
        '<div class="btn-row"><label class="btn btn-light" style="gap:10px"><input type="checkbox" id="availToggle" ' + (avail ? 'checked' : '') + ' style="width:18px;height:18px;accent-color:var(--green-700)"> Available for pickups</label></div></section>' +
        '<div class="stat-grid">' +
        UI.stat('Available Requests', reqs.length, 'inbox', 'orange') +
        UI.stat('Assigned Pickups', assigned.length, 'package', 'violet') +
        UI.stat('Completed Pickups', mine.filter(d => d.status === 'Picked Up').length, 'checkCircle', 'green') + '</div>' +
        (next ? '<div class="section-title"><h3>Next Pickup</h3></div><div class="card card-pad" style="border-color:var(--green-300)">' +
          '<div class="row-between"><div class="dcard-main" style="padding:0">' + UI.thumb(next) + '<div><span class="id-tag">' + next.id + '</span><h4 style="margin:0">' + e(next.food) + '</h4><div class="metas">' + UI.meta('pin', e(next.donorName) + ', ' + e(next.location)) + UI.meta('clock', Fmt.pickup(next)) + UI.meta('handHeart', e(next.ngoName)) + '</div></div></div>' +
          '<a class="btn btn-primary btn-lg" href="#/app/verify/' + next.id + '">' + icon('qr') + 'Scan QR at Pickup</a></div></div>' : '') +
        '<div class="section-title"><h3>Available Pickup Requests</h3><a href="#/app/pickups">View all</a></div>' +
        (reqs.length ? '<div class="card-list two-lg">' + reqs.slice(0, 4).map(requestCard).join('') + '</div>' : '<div class="card">' + UI.empty('inbox', 'No pickup requests right now', 'New requests appear here as soon as an NGO accepts a donation.') + '</div>');
    },
    mount(root, u) {
      const t = root.querySelector('#availToggle');
      if (t) t.addEventListener('change', () => {
        const usr = Store.currentUser(); usr.available = t.checked; Store.save();
        UI.toast(t.checked ? 'You are now available for pickups.' : 'You won\'t receive new pickup requests.', 'info');
      });
    }
  };

  V.availablePickups = {
    title: 'Available Pickups',
    render(p, u) {
      const list = openRequests(u).sort((a, b) => a.distance - b.distance);
      return '<div class="page-head"><div><h1>Available Pickups</h1><p>Accepted donations waiting for a volunteer, nearest first.</p></div></div>' +
        (list.length ? '<div class="card-list two-lg">' + list.map(requestCard).join('') + '</div>' : '<div class="card">' + UI.empty('inbox', 'No pickup requests right now', 'You\'re all caught up. We\'ll notify you when a new request comes in.') + '</div>');
    }
  };

  V.request = {
    title: 'Pickup Request',
    render(p, u) {
      const d = Store.donation(p.id);
      if (!d) return '<div class="card">' + UI.empty('xCircle', 'Request not found') + '</div>';
      const ngo = d.ngoId && Store.user(d.ngoId);
      let actions;
      if (d.status === 'Accepted' && !d.declinedBy.includes(u.id)) actions = '<div class="btn-row" style="margin-top:18px"><button class="btn btn-danger-soft btn-lg" id="rejectBtn" style="flex:0 1 auto">' + icon('x') + 'Reject</button><button class="btn btn-primary btn-lg" id="acceptBtn">' + icon('check') + 'Accept Pickup</button></div>';
      else if (d.volunteerId === u.id) actions = UI.alert('success', 'You accepted this pickup.', '<a href="#/app/verify/' + d.id + '">Go to QR verification →</a>');
      else if (d.declinedBy.includes(u.id)) actions = UI.alert('info', 'You rejected this request.', 'It has been offered to another volunteer.');
      else actions = UI.alert('warning', 'This request is no longer available.', 'Another volunteer has accepted it.');
      return '<a class="back-link" href="#/app/pickups">' + icon('arrowLeft') + 'Available pickups</a>' +
        '<div id="reqArea"><div class="page-head"><div><span class="id-tag">PICKUP REQUEST · ' + d.id + '</span><h1>Volunteer Assignment</h1><p>Collect the food from the donor and hand it over to the NGO.</p></div>' + UI.badge(d.distance + ' km away', 'orange', 'nav') + '</div>' +
        '<div class="grid-1-1"><div class="card"><div class="card-head"><h3>' + icon('package') + 'Donation Details</h3></div><div class="card-body" style="padding-top:4px">' + summaryRows(d) + actions + '</div></div>' +
        '<div style="display:grid;gap:16px"><div class="card card-pad"><div class="label muted" style="margin-bottom:10px">Pickup from (Donor)</div><div class="person"><span class="avatar av-supermarket">' + icon('store') + '</span><div><b>' + e(d.donorName) + '</b><small>' + e((d.address ? d.address + ', ' : '') + d.location) + '</small></div><a class="btn btn-outline btn-sm" href="tel:' + String(d.contact).replace(/\s/g, '') + '" aria-label="Call donor">' + icon('phone') + '</a></div></div>' +
        '<div class="card card-pad"><div class="label muted" style="margin-bottom:10px">Hand over to (NGO)</div>' + (ngo ? '<div class="person">' + UI.avatar(ngo) + '<div><b>' + e(ngo.org) + '</b><small>' + e(ngo.orgType + ' · ' + ngo.location) + '</small></div><a class="btn btn-outline btn-sm" href="tel:' + ngo.phone.replace(/\s/g, '') + '" aria-label="Call NGO">' + icon('phone') + '</a></div>' : '—') + '</div>' +
        UI.alert('info', 'How pickup works', 'Reach the donor at the pickup time, scan the donor\'s QR code to verify, then hand the food to the NGO.') +
        '</div></div></div>';
    },
    mount(root, p, u) {
      const acc = root.querySelector('#acceptBtn');
      if (!acc) return;
      acc.addEventListener('click', () => {
        const d = Store.volunteerAccept(p.id, u);
        if (!d) { UI.toast('This request was just taken by another volunteer.', 'error'); App.render(); return; }
        root.querySelector('#reqArea').innerHTML = '<div class="card" style="max-width:640px;margin:0 auto"><div class="result">' +
          '<div class="result-ic ok">' + icon('userCheck') + '</div><h2>Pickup accepted</h2><p>You are assigned to collect <b>' + e(d.food) + '</b> from ' + e(d.donorName) + '.</p>' +
          '<div class="state-flow">' + UI.badge('Volunteer Assigned', 'assigned') + icon('arrowRight', 'arrow') + UI.badge('Accepted', 'success', 'check') + '</div>' +
          '<div class="info-row" style="text-align:left;justify-content:center;border:0"><span class="ir-ic">' + icon('clock') + '</span><div><small>Pickup time</small><b>' + Fmt.pickup(d) + ' · ' + e(d.location) + '</b></div></div>' +
          '<div class="btn-row" style="margin-top:14px"><a class="btn btn-outline" href="#/app/my-pickups">My Pickups</a><a class="btn btn-primary" href="#/app/verify/' + d.id + '">' + icon('qr') + 'Go to QR Verification</a></div></div></div>';
        UI.toast('Pickup accepted. Status: Volunteer Assigned.');
      });
      root.querySelector('#rejectBtn').addEventListener('click', () => {
        UI.confirm({ title: 'Reject this pickup?', text: 'The request will be passed to another available volunteer.', ok: 'Reject Pickup', danger: true }).then(ok => {
          if (!ok) return;
          const next = Store.volunteerReject(p.id, u);
          const area = root.querySelector('#reqArea');
          area.innerHTML = '<div class="card" style="max-width:640px;margin:0 auto"><div class="result">' +
            '<div class="result-ic warn">' + icon('x') + '</div><h2>Pickup request rejected.</h2><p>No worries. We\'re finding another volunteer for this donation.</p>' +
            '<div class="state-flow">' + UI.badge('Volunteer Rejected', 'danger', 'x') + icon('arrowRight', 'arrow') + UI.badge('Find Another Volunteer', 'pending', 'refresh') + '</div>' +
            '<ul class="search-steps" id="steps"><li class="done">' + icon('checkCircle') + 'Request released</li><li class="active">' + '<span class="spinner" style="color:var(--green-700)"></span>' + 'Searching nearby volunteers…</li><li>' + icon('circle') + 'Request sent to next volunteer</li></ul>' +
            '<a class="btn btn-primary" href="#/app/pickups">Back to Available Pickups</a></div></div>';
          UI.toast('Pickup request rejected.', 'info');
          setTimeout(() => {
            const s = root.querySelector('#steps'); if (!s) return;
            s.innerHTML = '<li class="done">' + icon('checkCircle') + 'Request released</li><li class="done">' + icon('checkCircle') + 'Searched nearby volunteers</li><li class="done">' + icon('checkCircle') + (next ? 'Request sent to ' + e(next.name) : 'NGO notified: no volunteer free right now') + '</li>';
          }, 1800);
        });
      });
    }
  };

  V.myPickups = {
    title: 'My Pickups',
    render() {
      return '<div class="page-head"><div><h1>My Pickups</h1><p>Pickups you have accepted.</p></div></div>' +
        '<div class="segmented" id="tabs" style="margin-bottom:16px"><button class="active" data-t="active">Upcoming</button><button data-t="done">Completed</button></div>' +
        '<div id="list" class="card-list two-lg"></div>';
    },
    mount(root, p, u) {
      let t = 'active';
      const draw = () => {
        const list = myPickups(u).filter(d => t === 'active' ? d.status === 'Volunteer Assigned' : d.status === 'Picked Up');
        root.querySelector('#list').innerHTML = list.length ? list.map(pickupCard).join('') : '<div class="card" style="grid-column:1/-1">' +
          UI.empty('package', t === 'active' ? 'You don\'t have any pickup assignments.' : 'No completed pickups yet.', t === 'active' ? 'Accept a pickup request to see it here.' : 'Verified pickups will appear here.', t === 'active' ? '<a class="btn btn-primary" href="#/app/pickups">Find Pickup Requests</a>' : '') + '</div>';
      };
      root.querySelector('#tabs').addEventListener('click', ev => {
        const b = ev.target.closest('button'); if (!b) return;
        root.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('active', x === b)); t = b.dataset.t; draw();
      });
      draw();
    }
  };

  /* ---------- QR verification ---------- */
  const STATES = {
    before: ['ss-before', 'qr', 'Ready to scan', 'Scan the donor\'s QR code to confirm pickup.'],
    scanning: ['ss-before', 'scan', 'Scanning…', 'Hold the camera steady over the donor\'s QR code.'],
    ok: ['ss-ok', 'check', 'QR verified successfully. Pickup confirmed.', 'Status updated to Picked Up.'],
    invalid: ['ss-bad', 'x', 'Invalid QR code.', 'Please scan the correct donation QR.'],
    used: ['ss-used', 'alert', 'This QR code has already been used.', 'This pickup was verified earlier. No further action needed.']
  };
  const stateBox = k => { const s = STATES[k]; return '<div class="scan-state ' + s[0] + '" role="status"><span class="ss-ic">' + (k === 'scanning' ? '<span class="spinner"></span>' : icon(s[1])) + '</span><div><b>' + s[2] + '</b><span>' + s[3] + '</span></div></div>'; };

  V.verify = {
    title: 'QR Verification',
    render(p, u) {
      if (!p.id) {
        const list = myPickups(u).filter(d => d.status === 'Volunteer Assigned');
        return '<div class="page-head"><div><h1>QR Verification</h1><p>Select the pickup you are at to scan the donor\'s QR.</p></div></div>' +
          (list.length ? '<div class="card-list two-lg">' + list.map(pickupCard).join('') + '</div>' : '<div class="card">' + UI.empty('qr', 'You don\'t have any pickup assignments.', 'Accept a pickup request first, then scan the donor QR here.', '<a class="btn btn-primary" href="#/app/pickups">Find Pickup Requests</a>') + '</div>');
      }
      const d = Store.donation(p.id);
      if (!d || d.volunteerId !== u.id) return '<div class="card">' + UI.empty('ban', 'This pickup isn\'t assigned to you.', 'Only the assigned volunteer can verify this pickup.', '<a class="btn btn-primary" href="#/app/my-pickups">My Pickups</a>') + '</div>';
      const row = (ic, k, v) => '<div class="info-row"><span class="ir-ic">' + icon(ic) + '</span><div><small>' + k + '</small><b>' + v + '</b></div></div>';
      return '<a class="back-link" href="#/app/my-pickups">' + icon('arrowLeft') + 'My Pickups</a>' +
        '<div class="page-head"><div><h1>Pickup & QR Verification</h1><p>Confirm that you are collecting the correct donation from the donor.</p></div><span id="statusBadge">' + UI.status(d.status) + '</span></div>' +
        '<div class="grid-1-1"><div class="card"><div class="card-head"><h3>' + icon('package') + 'Pickup Details</h3></div><div class="card-body" style="padding-top:4px">' +
        row('tag', 'Donation ID', d.id) + row('store', 'Donor', e(d.donorName)) + row('soup', 'Food', e(d.food)) + row('scale', 'Quantity', e(d.quantity) + ' · ' + d.servings + ' servings') +
        row('pin', 'Pickup location', e((d.address ? d.address + ', ' : '') + d.location)) + row('clock', 'Pickup time', Fmt.pickup(d)) + row('handHeart', 'Hand over to', e(d.ngoName)) +
        '</div></div>' +
        '<div class="card card-pad"><h3 style="text-align:center">Scan QR Code</h3>' +
        '<div class="scanner" id="scanner"><div class="scan-top"><span>' + icon('camera') + 'Camera</span><span>' + d.id + '</span></div>' +
        '<div class="scan-frame"><i></i><i></i><i></i><i></i><div class="scan-ghost">' + icon('qr') + '</div><div class="scan-line"></div></div>' +
        '<div class="scan-hint" id="hint">Align the donor\'s QR code inside the frame</div></div>' +
        '<div id="state" style="margin-top:16px">' + stateBox(d.qrUsed ? 'used' : 'before') + '</div>' +
        '<div id="scanActions" style="margin-top:14px;display:grid;gap:10px">' +
        '<button class="btn btn-primary btn-lg btn-block" id="scanBtn">' + icon('scan') + 'Scan QR</button>' +
        '<details><summary class="link-btn" style="cursor:pointer;text-align:center;list-style:none">Having trouble? Enter code manually</summary>' +
        '<form id="manual" class="input-group" style="margin-top:10px"><input class="input mono" name="code" placeholder="RPQR-XXXX-XXXX" aria-label="QR code"><button class="btn btn-outline">Verify</button></form>' +
        '<p class="help" style="margin-top:8px">Demo: <button type="button" class="link-btn" id="wrongBtn">simulate scanning a wrong QR</button></p></details>' +
        '</div><p class="help" style="text-align:center;margin-top:12px">QR verification confirms pickup only. Hand over the food to the NGO after verifying.</p></div></div>';
    },
    mount(root, p, u) {
      const sc = root.querySelector('#scanner');
      if (!sc) return;
      const d = Store.donation(p.id);
      const st = root.querySelector('#state');
      let timer;
      function run(code) {
        sc.classList.remove('success', 'fail'); sc.classList.add('scanning');
        st.innerHTML = stateBox('scanning');
        root.querySelector('#scanBtn').disabled = true;
        timer = setTimeout(() => {
          sc.classList.remove('scanning');
          root.querySelector('#scanBtn').disabled = false;
          const r = Store.verifyQR(d.id, code, u);
          if (r === 'ok') {
            sc.classList.add('success');
            root.querySelector('#statusBadge').innerHTML = UI.status('Picked Up');
            root.querySelector('#hint').textContent = 'QR code matched ' + d.id;
            st.innerHTML = '<div class="result" style="padding:10px 0 0"><div class="result-ic ok" style="width:72px;height:72px">' + icon('check') + '</div>' +
              '<h2 style="font-size:1.15rem;margin-bottom:6px">QR Code Verified Successfully ✓</h2><p style="margin-bottom:10px">QR verified successfully. Pickup confirmed.</p>' +
              '<div class="state-flow" style="margin:8px 0">' + UI.status('Volunteer Assigned') + icon('arrowRight', 'arrow') + UI.status('Picked Up') + '</div>' +
              UI.alert('success', 'Pickup Confirmed', 'Please hand over the food to ' + e(d.ngoName) + '.') + '</div>';
            root.querySelector('#scanBtn').innerHTML = icon('refresh') + 'Scan Again';
            root.querySelector('#scanBtn').className = 'btn btn-outline btn-lg btn-block';
            if (!root.querySelector('#doneLinks')) root.querySelector('#scanActions').insertAdjacentHTML('afterbegin', '<div class="btn-row" id="doneLinks"><a class="btn btn-primary" href="#/app/my-pickups">My Pickups</a><a class="btn btn-secondary" href="#/app/donation/' + d.id + '">View Donation</a></div>');
            UI.toast('QR verified successfully ✓');
          } else {
            sc.classList.add('fail');
            st.innerHTML = stateBox(r === 'used' ? 'used' : 'invalid');
            UI.toast(r === 'used' ? 'This QR code has already been used.' : 'Invalid QR code.', r === 'used' ? 'warning' : 'error');
          }
        }, 1600);
      }
      root.querySelector('#scanBtn').addEventListener('click', () => run(d.qrCode));
      root.querySelector('#wrongBtn').addEventListener('click', () => run('RPQR-9999-FAKE'));
      root.querySelector('#manual').addEventListener('submit', ev => { ev.preventDefault(); const c = ev.target.code.value.trim().toUpperCase(); if (c) run(c); });
      return () => clearTimeout(timer);
    }
  };
})();
