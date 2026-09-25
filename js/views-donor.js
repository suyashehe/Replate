/* RePlate – donor pages: dashboard, donate form, my donations, details, tracking */
(function () {
  const V = App.Views;
  const e = s => Fmt.esc(s);
  const Dash = window.Dash = {};

  const mine = u => Store.donations().filter(d => d.donorId === u.id);
  const active = d => ['Pending', 'Accepted', 'Volunteer Assigned'].includes(d.status);

  function donorFoot(d) {
    let f = '<a class="btn btn-secondary btn-sm" href="#/app/donation/' + d.id + '">' + icon('eye') + 'View Details</a>';
    if (d.status === 'Pending') f += '<a class="btn btn-outline btn-sm" href="#/app/donate/edit/' + d.id + '">' + icon('edit') + 'Edit</a><button class="btn btn-danger-soft btn-sm" data-cancel="' + d.id + '">' + icon('x') + 'Cancel</button>';
    else if (d.status === 'Volunteer Assigned') f += '<a class="btn btn-primary btn-sm" href="#/app/donation/' + d.id + '#qr">' + icon('qr') + 'Show QR</a>';
    else if (d.status !== 'Cancelled') f += '<a class="btn btn-outline btn-sm" href="#/app/track/' + d.id + '">' + icon('history') + 'Track</a>';
    return f;
  }
  window.donorFoot = donorFoot;

  /* cancel handler shared by donor lists */
  window.bindCancel = function (root) {
    root.addEventListener('click', ev => {
      const b = ev.target.closest('[data-cancel]');
      if (!b) return;
      const d = Store.donation(b.dataset.cancel);
      UI.confirm({ title: 'Cancel this donation?', text: '<b>' + e(d.food) + '</b> (' + d.id + ') will be removed from the NGO list. This cannot be undone.', ok: 'Cancel Donation', cancel: 'Keep it', danger: true }).then(ok => {
        if (!ok) return;
        Store.setStatus(d, 'Cancelled'); Store.save();
        UI.toast('Donation ' + d.id + ' cancelled.', 'info');
        App.render();
      });
    });
  };

  /* ---------- donor dashboard ---------- */
  Dash.donor = {
    render(u) {
      const list = mine(u).filter(d => d.status !== 'Cancelled');
      const c = s => list.filter(d => d.status === s).length;
      const servings = list.filter(d => d.status === 'Picked Up').reduce((a, d) => a + (+d.servings || 0), 0);
      const qrReady = list.filter(d => d.status === 'Volunteer Assigned');
      const recent = list.slice(0, 4);
      return '<section class="welcome"><span class="welcome-art">' + icon('leaf') + '</span>' +
        '<h1>Hello, ' + e(u.name.split(' ')[0]) + ' 👋</h1><p>Together we can reduce food waste and feed more lives. ' + e(u.org) + ' has shared <b style="color:#fff">' + Fmt.num(servings) + ' servings</b> so far.</p>' +
        '<div class="btn-row"><a class="btn btn-accent" href="#/app/donate">' + icon('plus') + 'Donate Food</a><a class="btn btn-light" href="#/app/donations">' + icon('list') + 'My Donations</a></div></section>' +
        '<div class="stat-grid five">' +
        UI.stat('Total Donations', list.length, 'package', 'green') +
        UI.stat('Pending', c('Pending'), 'hourglass', 'amber') +
        UI.stat('Accepted', c('Accepted'), 'handHeart', 'blue') +
        UI.stat('Volunteer Assigned', c('Volunteer Assigned'), 'userCheck', 'violet') +
        UI.stat('Completed', c('Picked Up'), 'checkCircle', 'green', 'Picked up & QR verified') +
        '</div>' +
        (qrReady.length ? '<div class="banner" style="margin-top:16px;background:linear-gradient(120deg,#EEF7EC,#E1F0DE);border-color:#CBE5CB"><span class="b-ic" style="background:var(--green-700)">' + icon('qr') + '</span><div><b>Pickup QR ready for ' + qrReady.length + ' donation' + (qrReady.length > 1 ? 's' : '') + '</b><p style="color:var(--green-800)">Show the QR to the volunteer when they arrive: ' + qrReady.map(d => d.id).join(', ') + '</p></div><a class="btn btn-primary btn-sm" href="#/app/donation/' + qrReady[0].id + '#qr">Show QR</a></div>' : '') +
        '<div class="section-title"><h3>Quick Actions</h3></div>' +
        '<div class="quick">' +
        '<a href="#/app/donate"><span class="q-ic tone-orange">' + icon('plus') + '</span>Donate Food</a>' +
        '<a href="#/app/donations"><span class="q-ic tone-blue">' + icon('list') + '</span>My Donations</a>' +
        '<a href="#/app/history"><span class="q-ic tone-violet">' + icon('history') + '</span>History</a>' +
        '<a href="#/app/reports"><span class="q-ic tone-green">' + icon('chart') + '</span>My Impact</a></div>' +
        '<div class="grid-2-1" style="margin-top:8px"><div>' +
        '<div class="section-title"><h3>Recent Donations</h3><a href="#/app/donations">View all</a></div>' +
        (recent.length ? '<div class="card-list">' + recent.map(d => Cards.donation(d, { foot: donorFoot(d), showSafe: true })).join('') + '</div>'
          : '<div class="card">' + UI.empty('inbox', 'No donations available yet.', 'List your first surplus food donation and a verified NGO will pick it up.', '<a class="btn btn-primary" href="#/app/donate">' + icon('plus') + 'Donate Food</a>') + '</div>') +
        '</div><div>' +
        '<div class="section-title"><h3>Your Impact</h3></div>' +
        '<div class="card card-pad"><div class="stat-grid" style="grid-template-columns:1fr 1fr">' +
        UI.stat('Servings shared', Fmt.num(servings), 'soup', 'orange') + UI.stat('NGOs served', new Set(list.filter(d => d.ngoId).map(d => d.ngoId)).size, 'handHeart', 'blue') + '</div>' +
        '<div style="margin-top:16px">' + UI.barChart(monthly(list), { label: 'Servings donated per month', highlightLast: true }) + '</div>' +
        '<a class="btn btn-outline btn-block" style="margin-top:12px" href="#/app/reports">' + icon('chart') + 'View impact report</a></div>' +
        '<div class="card card-pad" style="margin-top:16px"><h3 style="display:flex;gap:8px;align-items:center">' + icon('shield') + 'Food safety tips</h3>' +
        '<ul style="margin:0;padding-left:18px;color:var(--text-2);font-size:.88rem;display:grid;gap:6px"><li>Pack cooked food in clean, covered containers.</li><li>Mention a realistic safe consumption time.</li><li>Keep dairy and meat items refrigerated until pickup.</li></ul></div>' +
        '</div></div>';
    },
    mount(root) { bindCancel(root); }
  };

  function monthly(list) {
    const out = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en', { month: 'short' });
      const base = [110, 140, 125, 180, 210, 0][5 - i] || 0;
      const live = list.filter(x => { const c = new Date(x.created); return c.getMonth() === d.getMonth() && c.getFullYear() === d.getFullYear(); }).reduce((a, x) => a + (+x.servings || 0), 0);
      out.push({ label, value: i === 0 ? live : base + (live % 40) });
    }
    return out;
  }
  window.monthlySeries = monthly;

  /* ---------- donate form ---------- */
  V.donate = {
    title: p => p.editId ? 'Edit Donation' : 'Donate Surplus Food',
    render(p, u) {
      const d = p.editId ? Store.donation(p.editId) : null;
      if (p.editId && (!d || d.donorId !== u.id || d.status !== 'Pending')) {
        return '<div class="card">' + UI.empty('ban', 'This donation can no longer be edited.', 'Only pending donations that belong to you can be edited.', '<a class="btn btn-primary" href="#/app/donations">Back to My Donations</a>') + '</div>';
      }
      const v = (k, def) => e(d ? (d[k] != null ? d[k] : '') : (def || ''));
      const today = dateOnly(0);
      const now = new Date(); const pad = n => String(n).padStart(2, '0');
      const localNow = today + 'T' + pad(now.getHours()) + ':' + pad(now.getMinutes());
      const later = new Date(Date.now() + 8 * 3600e3);
      const localLater = ymd(later) + 'T' + pad(later.getHours()) + ':' + pad(later.getMinutes());
      const toLocal = iso => { if (!iso) return ''; const x = new Date(iso); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()) + 'T' + pad(x.getHours()) + ':' + pad(x.getMinutes()); };
      const qn = d ? parseFloat(d.quantity) : '';
      const qu = d ? (d.quantity.split(' ')[1] || 'kg') : 'kg';
      const cat = d ? d.category : 'Cooked Food';

      return '<a class="back-link" href="' + (d ? '#/app/donation/' + d.id : '#/app/dashboard') + '">' + icon('arrowLeft') + 'Back</a>' +
        '<div class="page-head"><div><h1>' + (d ? 'Edit Donation ' + d.id : 'Donate Surplus Food') + '</h1><p>Share details about your surplus food. NGOs nearby will be notified instantly.</p></div></div>' +
        '<div id="donateArea"><form id="donateForm" class="card" novalidate>' +
        /* donor info */
        '<div class="form-section"><div class="form-section-title"><span class="n">1</span>Donor Information</div><div class="form-grid">' +
        UI.field('Donor name', '<input class="input" name="donorName" value="' + v('donorName', u.org || u.name) + '">', { req: true }) +
        UI.field('Contact number', '<div class="input-wrap">' + icon('phone') + '<input class="input" name="contact" type="tel" value="' + v('contact', u.phone) + '"></div>', { req: true }) +
        UI.field('Location', '<div class="input-wrap">' + icon('pin') + '<input class="input" name="location" value="' + v('location', u.location) + '" placeholder="Area, City"></div>', { req: true }) +
        UI.field('Pickup address', '<input class="input" name="address" value="' + v('address') + '" placeholder="Building, street, landmark">', { opt: true }) +
        '</div></div>' +
        /* food info */
        '<div class="form-section"><div class="form-section-title"><span class="n">2</span>Food Information</div>' +
        UI.field('Food name', '<input class="input" name="food" value="' + v('food') + '" placeholder="e.g. Veg Biryani & Dal">', { req: true }) +
        '<fieldset class="field" style="border:0;padding:0;margin:0 0 16px"><legend class="label" style="margin-bottom:8px">Food category <span class="req">*</span></legend><div class="cat-grid">' +
        Store.CATEGORIES.map(c => '<div class="cat-opt"><input type="radio" name="category" id="cat-' + c.replace(/\W/g, '') + '" value="' + c + '"' + (c === cat ? ' checked' : '') + '><label for="cat-' + c.replace(/\W/g, '') + '">' + UI.thumb({ category: c }) + c + '</label></div>').join('') +
        '</div></fieldset>' +
        '<div class="form-grid">' +
        UI.field('Food type', '<select class="input" name="type">' + ['Veg', 'Non-Veg', 'Vegan', 'Mixed'].map(t => '<option' + (d && d.type === t ? ' selected' : '') + '>' + t + '</option>').join('') + '</select>', { req: true }) +
        UI.field('Quantity', '<div class="input-group"><input class="input" name="qty" type="number" min="0.1" step="0.1" value="' + qn + '" placeholder="e.g. 10"><select class="input" name="unit" style="max-width:120px">' + ['kg', 'pieces', 'units', 'litres', 'boxes', 'plates'].map(x => '<option' + (x === qu ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></div>', { req: true }) +
        UI.field('Number of servings', '<input class="input" name="servings" type="number" min="1" value="' + v('servings') + '" placeholder="Approx. people it can feed">', { req: true }) +
        UI.field('Preparation date & time', '<input class="input" name="prepared" type="datetime-local" max="' + localNow + '" value="' + (d ? toLocal(d.prepared) : localNow) + '">', { req: true, cls: 'cooked-only' }) +
        UI.field('Safe consumption / expiry time', '<input class="input" name="safeUntil" type="datetime-local" value="' + (d ? toLocal(d.safeUntil) : localLater) + '">', { req: true, cls: 'cooked-only', help: 'The latest time the food is safe to eat.' }) +
        '</div>' +
        /* packaged */
        '<div id="packagedBlock" class="hidden" style="background:var(--cream);border-radius:14px;padding:16px;margin-bottom:16px">' +
        '<div class="row-between" style="margin-bottom:12px"><b style="display:flex;gap:8px;align-items:center">' + icon('barcode') + 'Packaged food details</b><span id="expBadge"></span></div>' +
        '<div class="form-grid">' +
        UI.field('Barcode number', '<div class="input-group"><input class="input mono" name="barcode" inputmode="numeric" value="' + v('barcode') + '" placeholder="13-digit barcode"><button type="button" class="btn btn-outline" id="lookupBtn">' + icon('search') + 'Lookup</button></div>', { req: true, help: 'Try 8901063010328 or 8902080011117' }) +
        UI.field('Expiry date', '<input class="input" name="expiry" type="date" value="' + v('expiry') + '">', { req: true }) +
        UI.field('Product details', '<input class="input" name="productDetails" value="' + v('productDetails') + '" placeholder="Brand, pack size, batch">', { cls: 'full', opt: true }) +
        '</div><div id="expAlert"></div></div>' +
        '</div>' +
        /* pickup */
        '<div class="form-section"><div class="form-section-title"><span class="n">3</span>Pickup Schedule</div><div class="form-grid">' +
        UI.field('Pickup date', '<input class="input" name="pickupDate" type="date" min="' + today + '" value="' + (d ? d.pickupDate : today) + '">', { req: true }) +
        UI.field('Pickup time', '<input class="input" name="pickupTime" type="time" value="' + (d ? d.pickupTime : pad(Math.min(now.getHours() + 2, 23)) + ':00') + '">', { req: true }) +
        '</div></div>' +
        /* image & notes */
        '<div class="form-section"><div class="form-section-title"><span class="n">4</span>Photo & Notes</div>' +
        '<div class="field"><span class="label">Upload food image <span class="opt">(optional)</span></span><label class="upload" for="foodImg"><span id="imgPrev">' + (d && d.image ? '<img class="up-prev" src="' + d.image + '" alt="">' : '<span class="up-ic">' + icon('camera') + '</span>') + '</span><div><b>Add a clear photo of the food</b><small>JPG or PNG · helps NGOs decide faster</small></div><input type="file" id="foodImg" accept="image/*"></label></div>' +
        UI.field('Additional notes', '<textarea class="input" name="notes" placeholder="Any special instructions, packaging or allergen info…">' + v('notes') + '</textarea>', { opt: true }) +
        '<div id="formMsg"></div>' +
        '<div class="btn-row" style="margin-top:8px"><a class="btn btn-outline btn-lg" href="#/app/dashboard" style="flex:0 1 auto">Cancel</a><button class="btn btn-primary btn-lg" type="submit">' + icon('check') + (d ? 'Save Changes' : 'Submit Donation') + '</button></div>' +
        '</div></form></div>';
    },
    mount(root, p, u) {
      const f = root.querySelector('#donateForm');
      if (!f) return;
      const editing = p.editId ? Store.donation(p.editId) : null;
      let image = editing ? editing.image : null;
      const pk = root.querySelector('#packagedBlock');
      const isPk = () => f.category.value === 'Packaged Food';
      const upd = () => {
        pk.classList.toggle('hidden', !isPk());
        root.querySelectorAll('.cooked-only').forEach(x => x.classList.toggle('hidden', isPk()));
        expUpdate();
      };
      function expUpdate() {
        const info = expiryInfo(f.expiry.value);
        root.querySelector('#expBadge').innerHTML = info ? UI.expiryBadge(info) : '';
        root.querySelector('#expAlert').innerHTML = !info ? '' : info.key === 'expired' ? UI.alert('error', 'This food has expired and cannot be donated.', 'Please choose a product that has not passed its expiry date.')
          : info.key === 'soon' ? UI.alert('warning', 'Food is expiring soon.', info.days === 0 ? 'Expires today, schedule pickup as early as possible.' : 'Expires in ' + info.days + ' day' + (info.days > 1 ? 's' : '') + '. Schedule an early pickup.') : UI.alert('success', 'Valid', 'Expiry date is safe for donation.');
      }
      root.querySelectorAll('[name=category]').forEach(r => r.addEventListener('change', upd));
      f.expiry.addEventListener('input', expUpdate);
      root.querySelector('#lookupBtn').addEventListener('click', () => {
        const prod = Store.lookupBarcode(f.barcode.value);
        if (!prod) { UI.toast('No product found for this barcode. Enter details manually.', 'warning'); return; }
        f.expiry.value = prod.expiry; f.productDetails.value = prod.brand + ' · ' + prod.name;
        if (!f.food.value) f.food.value = prod.name;
        expUpdate(); UI.toast('Product found: ' + prod.name, 'info');
      });
      upd();
      root.querySelector('#foodImg').addEventListener('change', async ev => {
        const file = ev.target.files[0]; if (!file) return;
        try { image = await UI.readImage(file); root.querySelector('#imgPrev').innerHTML = '<img class="up-prev" src="' + image + '" alt="Selected food photo">'; }
        catch (err) { UI.toast('Could not read that image.', 'error'); }
      });
      f.addEventListener('submit', ev => {
        ev.preventDefault();
        const msg = root.querySelector('#formMsg'); msg.innerHTML = '';
        const pkg = isPk();
        const rules = {
          donorName: v => !v ? 'Please enter the donor name.' : '',
          contact: v => v.replace(/\D/g, '').length < 10 ? 'Enter a valid contact number.' : '',
          location: v => !v ? 'Please enter the pickup location.' : '',
          food: v => !v ? 'Please enter the food name.' : '',
          qty: v => !(+v > 0) ? 'Enter a quantity greater than 0.' : '',
          servings: v => !(+v >= 1) ? 'Enter the number of servings.' : '',
          pickupDate: v => !v ? 'Select a pickup date.' : '',
          pickupTime: (v, fm) => {
            if (!v) return 'Select a pickup time.';
            const pt = new Date(fm.pickupDate.value + 'T' + v);
            if (!editing && pt < new Date(Date.now() - 10 * 60e3)) return 'Pickup time cannot be in the past.';
            if (!pkg && fm.safeUntil.value && pt > new Date(fm.safeUntil.value)) return 'Pickup must be before the safe consumption time.';
            return '';
          }
        };
        if (pkg) {
          rules.barcode = v => !/^\d{8,14}$/.test(v) ? 'Enter a valid 8–14 digit barcode.' : '';
          rules.expiry = v => !v ? 'Select the expiry date.' : expiryInfo(v).key === 'expired' ? 'This food has expired and cannot be donated.' : '';
        } else {
          rules.prepared = v => !v ? 'Enter when the food was prepared.' : '';
          rules.safeUntil = (v, fm) => !v ? 'Enter the safe consumption time.' : new Date(v) <= new Date() ? 'Safe consumption time must be in the future.' : new Date(v) <= new Date(fm.prepared.value) ? 'Must be after the preparation time.' : '';
        }
        if (!App.validate(f, rules)) {
          if (pkg && f.expiry.value && expiryInfo(f.expiry.value).key === 'expired') msg.innerHTML = UI.alert('error', 'Error: This food has expired and cannot be donated.');
          return;
        }
        const data = {
          donorName: f.donorName.value.trim(), contact: f.contact.value.trim(), location: f.location.value.trim(), address: f.address.value.trim(),
          food: f.food.value.trim(), category: f.category.value, type: f.type.value, quantity: (+f.qty.value) + ' ' + f.unit.value, servings: +f.servings.value,
          pickupDate: f.pickupDate.value, pickupTime: f.pickupTime.value, notes: f.notes.value.trim(), image
        };
        if (pkg) Object.assign(data, { barcode: f.barcode.value.trim(), expiry: f.expiry.value, productDetails: f.productDetails.value.trim(), prepared: null, safeUntil: new Date(f.expiry.value + 'T23:59').toISOString() });
        else Object.assign(data, { prepared: new Date(f.prepared.value).toISOString(), safeUntil: new Date(f.safeUntil.value).toISOString(), barcode: null, expiry: null });

        if (editing) {
          Store.updateDonation(editing.id, data);
          UI.toast('Donation ' + editing.id + ' updated.');
          location.hash = '#/app/donation/' + editing.id;
          return;
        }
        const d = Store.createDonation(data, u);
        root.querySelector('#donateArea').innerHTML = submitted(d);
        window.scrollTo(0, 0);
      });
    }
  };

  function submitted(d) {
    return '<div class="card" style="max-width:640px;margin:0 auto"><div class="result">' +
      '<div class="result-ic ok">' + icon('check') + '</div>' +
      '<h2>Donation submitted successfully ✓</h2><p>Nearby NGOs have been notified. You\'ll get an alert when one accepts your donation.</p>' +
      '<div class="state-flow"><span class="code-pill">' + d.id + '</span>' + '<span>Donation status:</span>' + UI.status('Pending') + '</div>' +
      '<div class="card card-pad" style="text-align:left;margin:18px 0;box-shadow:none"><div class="dcard-main" style="padding:0">' + UI.thumb(d) + '<div><b>' + e(d.food) + '</b><div class="sub muted" style="font-size:.84rem">' + d.quantity + ' · ' + d.servings + ' servings · Pickup ' + Fmt.pickup(d) + '</div></div></div>' +
      '<div style="margin-top:18px">' + UI.tracker(d) + '</div></div>' +
      '<div class="btn-row"><a class="btn btn-primary" href="#/app/donation/' + d.id + '">' + icon('eye') + 'View Donation</a><a class="btn btn-outline" href="#/app/donate" onclick="setTimeout(App.render)">' + icon('plus') + 'Donate More</a></div>' +
      '</div></div>';
  }
  window.donationSubmitted = submitted;

  /* ---------- my donations ---------- */
  V.myDonations = {
    title: (p, u) => u.role === 'supermarket' ? 'Donations' : 'My Donations',
    render(p, u) {
      return '<div class="page-head"><div><h1>' + (u.role === 'supermarket' ? 'Packaged Food Donations' : 'My Donations') + '</h1><p>Track the status of everything you have shared.</p></div>' +
        '<div class="actions"><a class="btn btn-primary" href="' + (u.role === 'supermarket' ? '#/app/sm-add' : '#/app/donate') + '">' + icon('plus') + 'New Donation</a></div></div>' +
        '<div class="toolbar"><div class="segmented" role="tablist" id="tabs"><button class="active" data-t="active" role="tab">Ongoing</button><button data-t="done" role="tab">Completed</button><button data-t="cancelled" role="tab">Cancelled</button><button data-t="all" role="tab">All</button></div>' +
        '<div class="search">' + icon('search') + '<input class="input" id="q" placeholder="Search by food or ID" aria-label="Search donations"></div></div>' +
        '<div id="list" class="card-list two-lg"></div>';
    },
    mount(root, p, u) {
      let tab = 'active';
      const draw = () => {
        const q = root.querySelector('#q').value.toLowerCase();
        const list = mine(u).filter(d => tab === 'all' ? true : tab === 'active' ? active(d) : tab === 'done' ? d.status === 'Picked Up' : d.status === 'Cancelled')
          .filter(d => !q || (d.food + d.id).toLowerCase().includes(q));
        root.querySelector('#list').innerHTML = list.length ? list.map(d => Cards.donation(d, { foot: donorFoot(d), showSafe: d.status !== 'Picked Up' })).join('')
          : '<div class="card" style="grid-column:1/-1">' + UI.empty('inbox', 'No donations available yet.', tab === 'active' ? 'You have no ongoing donations right now.' : 'Nothing to show in this tab.', '<a class="btn btn-primary" href="#/app/donate">' + icon('plus') + 'Donate Food</a>') + '</div>';
      };
      root.querySelector('#tabs').addEventListener('click', ev => {
        const b = ev.target.closest('button'); if (!b) return;
        root.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('active', x === b)); tab = b.dataset.t; draw();
      });
      root.querySelector('#q').addEventListener('input', draw);
      bindCancel(root);
      draw();
    }
  };

  /* ---------- donation details ---------- */
  function personCard(title, u, fallbackIcon, fallbackTitle, fallbackText) {
    if (!u) return '<div class="card card-pad"><div class="label muted" style="margin-bottom:10px">' + title + '</div><div class="person"><span class="avatar tone-amber">' + icon(fallbackIcon) + '</span><div><b>' + fallbackTitle + '</b><small>' + fallbackText + '</small></div></div></div>';
    return '<div class="card card-pad"><div class="label muted" style="margin-bottom:10px">' + title + '</div><div class="person">' + UI.avatar(u) + '<div><b>' + e(u.role === 'volunteer' ? u.name : u.org) + '</b><small>' + e(u.role === 'volunteer' ? 'Volunteer · ' + u.orgType : u.orgType + ' · ' + u.location) + '</small></div>' +
      '<a class="btn btn-outline btn-sm" href="tel:' + u.phone.replace(/\s/g, '') + '" aria-label="Call ' + e(u.name) + '">' + icon('phone') + '</a></div></div>';
  }

  V.donationDetails = {
    title: p => 'Donation ' + p.id,
    render(p, u) {
      const d = Store.donation(p.id);
      if (!d) return '<div class="card">' + UI.empty('xCircle', 'Donation not found', 'It may have been removed.', '<a class="btn btn-primary" href="#/app/dashboard">Go to Dashboard</a>') + '</div>';
      const ngo = d.ngoId && Store.user(d.ngoId), vol = d.volunteerId && Store.user(d.volunteerId);
      const exp = d.expiry ? expiryInfo(d.expiry) : null;
      const isDonor = u.id === d.donorId;
      const dt = (ic, k, val) => '<div><dt>' + icon(ic) + k + '</dt><dd>' + val + '</dd></div>';

      /* role actions */
      let actions = '';
      if (isDonor && d.status === 'Pending') actions = '<a class="btn btn-outline" href="#/app/donate/edit/' + d.id + '">' + icon('edit') + 'Edit Donation</a><button class="btn btn-danger-soft" data-cancel="' + d.id + '">' + icon('x') + 'Cancel Donation</button>';
      if (u.role === 'ngo' && d.status === 'Pending') actions = '<a class="btn btn-primary btn-lg" href="#/app/accept/' + d.id + '">' + icon('handHeart') + 'Accept Donation</a>';
      if (u.role === 'volunteer' && d.status === 'Accepted' && !d.declinedBy.includes(u.id)) actions = '<a class="btn btn-primary btn-lg" href="#/app/request/' + d.id + '">' + icon('userCheck') + 'View Pickup Request</a>';
      if (u.role === 'volunteer' && d.status === 'Volunteer Assigned' && d.volunteerId === u.id) actions = '<a class="btn btn-primary btn-lg" href="#/app/verify/' + d.id + '">' + icon('qr') + 'Scan QR at Pickup</a>';

      /* QR section */
      let qr;
      if (d.status === 'Picked Up') qr = '<div class="scan-state ss-ok"><span class="ss-ic">' + icon('check') + '</span><div><b>QR verified ✓</b><span>Pickup confirmed on ' + Fmt.dateTime(d.verifiedAt) + '</span></div></div>';
      else if (d.status === 'Volunteer Assigned' && (isDonor || u.role === 'admin')) qr = '<div class="qr-box">' + UI.qr(d.qrCode, 190) + '<div class="code-pill">' + d.qrCode + '</div><p style="margin:10px 0 0;font-size:.86rem">Show this QR to <b>' + e(d.volunteerName) + '</b> at pickup to confirm the handover.</p></div>';
      else if (d.status === 'Volunteer Assigned') qr = '<div class="scan-state ss-before"><span class="ss-ic">' + icon('qr') + '</span><div><b>Awaiting QR scan</b><span>The volunteer scans the donor\'s QR at pickup.</span></div></div>';
      else if (d.status === 'Cancelled') qr = '<div class="scan-state ss-bad"><span class="ss-ic">' + icon('ban') + '</span><div><b>Donation cancelled</b><span>No pickup will take place.</span></div></div>';
      else qr = '<div class="scan-state ss-before"><span class="ss-ic">' + icon('lock') + '</span><div><b>Not yet available</b><span>The pickup QR activates once a volunteer is assigned.</span></div></div>';

      const volText = d.status === 'Accepted' ? (d.declinedBy.length ? 'Searching… ' + d.declinedBy.length + ' volunteer' + (d.declinedBy.length > 1 ? 's' : '') + ' declined, request sent to the next one' : 'Volunteer assignment pending') : 'Assigned after an NGO accepts';

      return '<a class="back-link" href="javascript:history.back()">' + icon('arrowLeft') + 'Back</a>' +
        '<div class="page-head"><div><span class="id-tag">DONATION ID · ' + d.id + '</span><h1>' + e(d.food) + '</h1><p>' + e(d.donorName) + ' · Listed ' + Fmt.rel(d.created) + '</p></div>' +
        '<div class="actions"><a class="btn btn-outline" href="#/app/track/' + d.id + '">' + icon('history') + 'Track Donation</a></div></div>' +
        '<div class="detail-grid"><div class="dcol">' +
        '<div class="card hero-detail o1" style="overflow:hidden">' + UI.thumb(d, 'lg') + UI.status(d.status) + '</div>' +
        '<div class="o2">' + (d.status !== 'Cancelled' ? '<div class="card card-pad"><h3 style="margin-bottom:18px">Donation Progress</h3>' + UI.tracker(d) + '</div>' : UI.alert('error', 'This donation was cancelled by the donor.')) + '</div>' +
        '<div class="card o5"><div class="card-head"><h3>' + icon('info') + 'Donation Details</h3></div><div class="card-body"><dl class="kv">' +
        dt('tag', 'Donation ID', d.id) + dt('soup', 'Food name', e(d.food)) + dt('layers', 'Category', e(d.category)) +
        dt('leaf', 'Food type', e(d.type || '—')) + dt('scale', 'Quantity', e(d.quantity)) + dt('users', 'Servings', d.servings) +
        dt('store', 'Donor', e(d.donorName)) + dt('pin', 'Location', e(d.location)) + dt('clock', 'Pickup time', Fmt.pickup(d)) +
        dt('hourglass', d.expiry ? 'Expiry date' : 'Safe until', d.expiry ? Fmt.date(d.expiry) + ' ' + UI.expiryBadge(exp) : Fmt.dateTime(d.safeUntil)) +
        (d.prepared ? dt('soup', 'Prepared', Fmt.dateTime(d.prepared)) : '') + dt('calendar', 'Donation date', Fmt.dateTime(d.created)) +
        '</dl>' +
        (d.barcode ? '<div class="barcode-box" style="margin-top:18px">' + UI.barcode(d.barcode) + '<div class="mono">' + d.barcode + '</div>' + (d.productDetails ? '<small class="muted">' + e(d.productDetails) + '</small>' : '') + '</div>' : '') +
        (d.notes ? '<div class="alert alert-info" style="margin-top:18px">' + icon('info') + '<div><strong>Notes from donor</strong><span>' + e(d.notes) + '</span></div></div>' : '') +
        '</div></div></div>' +
        /* right column */
        '<div class="dcol">' +
        (actions ? '<div class="card card-pad o3"><div class="btn-row" style="flex-direction:column">' + actions + '</div></div>' : '') +
        '<div class="card o4" id="qr"><div class="card-head"><h3>' + icon('qr') + 'QR Verification</h3>' + (d.qrUsed ? UI.badge('Verified', 'success', 'check') : UI.badge('Not scanned', 'neutral')) + '</div><div class="card-body">' + qr + '</div></div>' +
        personCard('Assigned NGO', ngo, 'handHeart', 'Waiting for an NGO', 'Nearby NGOs have been notified') +
        personCard('Assigned Volunteer', vol, 'userCheck', d.status === 'Accepted' ? 'Volunteer Assignment Pending' : 'Not assigned yet', volText) +
        '<div class="card o6"><div class="card-head"><h3>' + icon('pin') + 'Pickup Details</h3></div><div class="card-body" style="padding-top:4px;padding-bottom:4px">' +
        '<div class="info-row"><span class="ir-ic">' + icon('pin') + '</span><div><small>Pickup location</small><b>' + e(d.address ? d.address + ', ' : '') + e(d.location) + '</b></div></div>' +
        '<div class="info-row"><span class="ir-ic">' + icon('calendar') + '</span><div><small>Pickup date & time</small><b>' + Fmt.pickup(d) + '</b></div></div>' +
        '<div class="info-row"><span class="ir-ic">' + icon('phone') + '</span><div><small>Donor contact</small><b>' + e(d.contact) + '</b></div></div>' +
        '<div class="info-row"><span class="ir-ic">' + icon('nav') + '</span><div><small>Distance</small><b>' + d.distance + ' km</b></div></div>' +
        '</div></div></div></div>';
    },
    mount(root) {
      bindCancel(root);
      if (location.hash.includes('#qr')) { const q = root.querySelector('#qr'); if (q) setTimeout(() => q.scrollIntoView({ behavior: 'smooth' }), 100); }
    }
  };

  /* ---------- tracking ---------- */
  V.track = {
    title: p => 'Track ' + p.id,
    render(p) {
      const d = Store.donation(p.id);
      if (!d) return '<div class="card">' + UI.empty('xCircle', 'Donation not found') + '</div>';
      return '<a class="back-link" href="#/app/donation/' + d.id + '">' + icon('arrowLeft') + 'Donation details</a>' +
        '<div class="page-head"><div><h1>Track Donation</h1><p>Follow each step from listing to verified pickup.</p></div></div>' +
        '<div class="grid-2-1"><div class="card card-pad">' +
        '<div class="dcard-main" style="padding:0 0 18px;border-bottom:1px solid var(--border-2);margin-bottom:22px">' + UI.thumb(d) + '<div class="dcard-info"><span class="id-tag">' + d.id + '</span><h4 style="margin:0">' + e(d.food) + '</h4><div class="sub muted" style="font-size:.84rem">' + d.quantity + ' · ' + d.servings + ' servings</div></div>' + UI.status(d.status) + '</div>' +
        UI.timeline(d) + '</div>' +
        '<div style="display:grid;gap:16px"><div class="card card-pad"><h3>Pickup location</h3>' +
        '<div style="border-radius:12px;overflow:hidden;background:linear-gradient(135deg,#E9F2E4,#F4F1E6);height:150px;position:relative;margin:10px 0">' +
        '<svg viewBox="0 0 300 150" width="100%" height="150" aria-hidden="true"><path d="M0 110 C60 90 90 120 150 95 S250 60 300 70" stroke="#fff" stroke-width="10" fill="none"/><path d="M40 0 L90 150" stroke="#fff" stroke-width="7"/><path d="M210 0 C200 50 230 100 220 150" stroke="#fff" stroke-width="6" fill="none"/><circle cx="150" cy="80" r="26" fill="#4C9A5B" opacity=".18"/></svg>' +
        '<span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-80%);color:var(--red)">' + icon('pin', '') + '</span></div>' +
        '<b>' + e(d.address || d.donorName) + '</b><p class="muted" style="margin:0">' + e(d.location) + ' · ' + d.distance + ' km</p></div>' +
        UI.alert('info', 'Pickup-focused tracking', 'RePlate confirms the handover at pickup with QR verification. The NGO receives the food directly from the assigned volunteer.') +
        '</div></div>';
    }
  };
})();
