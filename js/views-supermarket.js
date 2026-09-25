/* RePlate – supermarket module: dashboard, packaged food form, barcode scanner, expiry alerts */
(function () {
  const V = App.Views;
  const e = s => Fmt.esc(s);
  const Dash = window.Dash;
  const PK_CATS = ['Dairy', 'Snacks', 'Beverages', 'Staples', 'Ready-to-eat', 'Bakery', 'Breakfast', 'Condiments', 'Frozen', 'Other'];

  const inv = () => Store.state.inventory.map(p => Object.assign({}, p, { exp: expiryInfo(p.expiry) })).sort((a, b) => a.exp.days - b.exp.days);
  const smDonations = u => Store.donations().filter(d => d.donorId === u.id);
  const daysText = x => x.days < 0 ? 'Expired ' + (-x.days) + ' day' + (x.days < -1 ? 's' : '') + ' ago' : x.days === 0 ? 'Expires today' : x.days + ' day' + (x.days > 1 ? 's' : '') + ' left';
  const tone = k => ({ safe: 'green', soon: 'amber', expired: 'red' }[k]);
  const pThumb = p => '<div class="thumb tone-' + tone(p.exp.key) + '">' + icon(p.category === 'Dairy' ? 'package' : p.category === 'Bakery' ? 'cake' : p.category === 'Beverages' ? 'coffee' : p.category === 'Staples' ? 'wheat' : 'package') + '</div>';

  function expiringBanner(n) {
    if (!n) return '';
    return '<div class="banner" role="status"><span class="b-ic">' + icon('bell') + '</span><div><b>' + n + ' products are expiring soon.</b><p>Consider donating them through RePlate before they go to waste.</p></div><a class="btn btn-accent btn-sm" href="#/app/expiry">Review</a></div>';
  }

  Dash.supermarket = {
    render(u) {
      const list = smDonations(u).filter(d => d.status !== 'Cancelled');
      const items = inv(), soon = items.filter(p => p.exp.key === 'soon');
      return '<section class="welcome"><span class="welcome-art">' + icon('store') + '</span>' +
        '<h1>' + e(u.org) + '</h1><p>Share close-to-expiry packaged food and prevent waste. Scan, check expiry and donate in seconds.</p>' +
        '<div class="btn-row"><a class="btn btn-accent" href="#/app/scanner">' + icon('barcode') + 'Scan Barcode</a><a class="btn btn-light" href="#/app/sm-add">' + icon('plus') + 'Add Manually</a></div></section>' +
        expiringBanner(soon.length) +
        '<div class="stat-grid four">' +
        UI.stat('Total Packaged Donations', list.length, 'package', 'green') +
        UI.stat('Expiring Soon', soon.length, 'hourglass', 'amber', 'in inventory, ≤ 7 days') +
        UI.stat('Donated', list.filter(d => d.status !== 'Picked Up').length, 'handHeart', 'blue', 'awaiting pickup') +
        UI.stat('Picked Up', list.filter(d => d.status === 'Picked Up').length, 'checkCircle', 'green') + '</div>' +
        '<div class="section-title"><h3>Quick Actions</h3></div><div class="quick">' +
        '<a href="#/app/scanner"><span class="q-ic tone-green">' + icon('barcode') + '</span>Scan Barcode</a>' +
        '<a href="#/app/sm-add"><span class="q-ic tone-orange">' + icon('plus') + '</span>Add Packaged Food</a>' +
        '<a href="#/app/expiry"><span class="q-ic tone-amber">' + icon('hourglass') + '</span>Expiry Alerts</a>' +
        '<a href="#/app/donations"><span class="q-ic tone-blue">' + icon('list') + '</span>Donations</a></div>' +
        '<div class="grid-1-1" style="margin-top:8px"><div><div class="section-title"><h3>Expiring Soon</h3><a href="#/app/expiry">View all</a></div><div class="card">' +
        (soon.length ? soon.slice(0, 5).map(p => '<div class="info-row" style="padding:12px 16px">' + pThumb(p) + '<div style="min-width:0"><b style="display:block">' + e(p.name) + '</b><small>' + p.qty + ' units · ' + daysText(p.exp) + '</small></div><a class="btn btn-secondary btn-sm ir-end" href="#/app/sm-add" data-prefill="' + p.barcode + '">Donate</a></div>').join('')
          : UI.empty('checkCircle', 'Nothing expiring soon', 'Your inventory looks healthy.')) + '</div></div>' +
        '<div><div class="section-title"><h3>Recent Donations</h3><a href="#/app/donations">View all</a></div><div class="card-list">' +
        (list.length ? list.slice(0, 3).map(d => Cards.donation(d, { foot: donorFoot(d) })).join('') : '<div class="card">' + UI.empty('inbox', 'No donations available yet.') + '</div>') + '</div></div></div>';
    },
    mount(root) { bindPrefill(root); bindCancel(root); }
  };

  function bindPrefill(root) {
    root.addEventListener('click', ev => {
      const a = ev.target.closest('[data-prefill]');
      if (a) App.prefill = Store.lookupBarcode(a.dataset.prefill);
    });
  }

  /* ---------- packaged food form ---------- */
  V.smAdd = {
    title: 'Add Packaged Food',
    render(p, u) {
      const pf = App.prefill || {};
      const today = dateOnly(0);
      const tmr = dateOnly(1);
      return '<div class="page-head"><div><h1>Add Packaged Food</h1><p>Donate packaged products approaching their expiry date.</p></div><div class="actions"><a class="btn btn-outline" href="#/app/scanner">' + icon('barcode') + 'Scan Barcode</a></div></div>' +
        '<div id="smArea"><div class="grid-2-1"><form id="smForm" class="card" novalidate>' +
        '<div class="form-section"><div class="form-section-title"><span class="n">1</span>Product</div>' +
        UI.field('Barcode', '<div class="input-group"><input class="input mono" name="barcode" inputmode="numeric" value="' + e(pf.barcode || '') + '" placeholder="Scan or type barcode"><a class="btn btn-outline" href="#/app/scanner" aria-label="Open scanner">' + icon('barcode') + '</a><button type="button" class="btn btn-secondary" id="lookup">Lookup</button></div>', { req: true, help: 'Scan with the camera, or type the number and press Lookup.' }) +
        '<div class="form-grid">' +
        UI.field('Product Name', '<input class="input" name="name" value="' + e(pf.name || '') + '" placeholder="e.g. Toned Milk 500ml">', { req: true }) +
        UI.field('Category', '<select class="input" name="category"><option value="">Select category</option>' + PK_CATS.map(c => '<option' + (pf.category === c ? ' selected' : '') + '>' + c + '</option>').join('') + '</select>', { req: true }) +
        UI.field('Quantity (units)', '<input class="input" name="qty" type="number" min="1" value="' + e(pf.qty || '') + '" placeholder="e.g. 24">', { req: true }) +
        UI.field('Storage Information', '<select class="input" name="storage">' + ['Room temperature', 'Cool, dry place', 'Refrigerated (2–4°C)', 'Frozen (−18°C)'].map(s => '<option' + (pf.storage === s ? ' selected' : '') + '>' + s + '</option>').join('') + '</select>', { req: true }) +
        UI.field('Manufacturing Date', '<input class="input" name="mfg" type="date" max="' + today + '" value="' + e(pf.mfg || '') + '">', { req: true }) +
        UI.field('Expiry Date', '<input class="input" name="expiry" type="date" value="' + e(pf.expiry || '') + '">', { req: true }) +
        '</div><div id="expAlert"></div></div>' +
        '<div class="form-section"><div class="form-section-title"><span class="n">2</span>Pickup</div><div class="form-grid">' +
        UI.field('Pickup Date', '<input class="input" name="pickupDate" type="date" min="' + today + '" value="' + tmr + '">', { req: true }) +
        UI.field('Pickup Time', '<input class="input" name="pickupTime" type="time" value="11:00">', { req: true }) +
        '</div></div>' +
        '<div class="form-section"><div class="form-section-title"><span class="n">3</span>Photo & Notes</div>' +
        '<div class="field"><span class="label">Food Image <span class="opt">(optional)</span></span><label class="upload" for="smImg"><span id="imgPrev"><span class="up-ic">' + icon('camera') + '</span></span><div><b>Photo of the products</b><small>Show packaging and labels clearly</small></div><input type="file" id="smImg" accept="image/*"></label></div>' +
        UI.field('Notes', '<textarea class="input" name="notes" placeholder="Batch number, packaging, handling instructions…"></textarea>', { opt: true }) +
        '<div id="formMsg"></div><button class="btn btn-primary btn-lg btn-block" type="submit" id="submitBtn">' + icon('check') + 'Submit Donation</button></div>' +
        '</form>' +
        '<aside style="display:grid;gap:16px;align-content:start"><div class="card card-pad"><h3>Expiry status</h3><div id="expCard">' + expCard(null) + '</div></div>' +
        '<div class="card card-pad"><h3>Donation rules</h3><div class="info-row"><span class="ir-ic tone-green">' + icon('checkCircle') + '</span><div><b>Safe</b><small>More than 7 days to expiry: Valid</small></div></div>' +
        '<div class="info-row"><span class="ir-ic tone-amber">' + icon('alert') + '</span><div><b>Expiring Soon</b><small>0–7 days: Expires soon, early pickup</small></div></div>' +
        '<div class="info-row"><span class="ir-ic tone-red">' + icon('xCircle') + '</span><div><b>Expired</b><small>Expired – Cannot be donated</small></div></div></div></aside>' +
        '</div></div>';
    },
    mount(root, p, u) {
      const f = root.querySelector('#smForm');
      App.prefill = null;
      let image = null;
      const upd = () => {
        const info = expiryInfo(f.expiry.value);
        root.querySelector('#expCard').innerHTML = expCard(info);
        root.querySelector('#expAlert').innerHTML = info && info.key === 'expired' ? UI.alert('error', 'Expired – Cannot be donated', 'This food has expired and cannot be donated.') : info && info.key === 'soon' ? UI.alert('warning', 'Warning: Food is expiring soon', 'Schedule the pickup as early as possible.') : '';
        const btn = root.querySelector('#submitBtn');
        btn.disabled = !!(info && info.key === 'expired');
      };
      f.expiry.addEventListener('input', upd);
      upd();
      root.querySelector('#lookup').addEventListener('click', () => {
        const prod = Store.lookupBarcode(f.barcode.value);
        if (!prod) { UI.toast('Product not found. Please fill details manually.', 'warning'); return; }
        f.name.value = prod.name; f.category.value = prod.category; f.qty.value = prod.qty; f.mfg.value = prod.mfg; f.expiry.value = prod.expiry; f.storage.value = prod.storage;
        upd(); UI.toast('Product details filled from barcode.', 'info');
      });
      root.querySelector('#smImg').addEventListener('change', async ev => {
        const file = ev.target.files[0]; if (!file) return;
        try { image = await UI.readImage(file); root.querySelector('#imgPrev').innerHTML = '<img class="up-prev" src="' + image + '" alt="Selected product photo">'; } catch (err) { UI.toast('Could not read that image.', 'error'); }
      });
      f.addEventListener('submit', ev => {
        ev.preventDefault();
        const ok = App.validate(f, {
          barcode: v => !/^\d{8,14}$/.test(v) ? 'Enter a valid 8–14 digit barcode.' : '',
          name: v => !v ? 'Enter the product name.' : '',
          category: v => !v ? 'Select a category.' : '',
          qty: v => !(+v >= 1) ? 'Enter a quantity of at least 1.' : '',
          mfg: v => !v ? 'Enter the manufacturing date.' : '',
          expiry: (v, fm) => !v ? 'Enter the expiry date.' : expiryInfo(v).key === 'expired' ? 'Expired – Cannot be donated.' : fm.mfg.value && v < fm.mfg.value ? 'Expiry must be after manufacturing date.' : '',
          pickupDate: (v, fm) => !v ? 'Select a pickup date.' : v > fm.expiry.value ? 'Pickup must be on or before the expiry date.' : '',
          pickupTime: v => !v ? 'Select a pickup time.' : ''
        });
        if (!ok) { if (f.expiry.value && expiryInfo(f.expiry.value).key === 'expired') root.querySelector('#formMsg').innerHTML = UI.alert('error', 'This food has expired and cannot be donated.') + '<div style="height:12px"></div>'; return; }
        const d = Store.createDonation({
          food: f.name.value.trim(), category: 'Packaged Food', type: 'Veg', quantity: f.qty.value + ' units', servings: +f.qty.value,
          barcode: f.barcode.value.trim(), expiry: f.expiry.value, mfg: f.mfg.value, storage: f.storage.value,
          productDetails: f.category.value + ' · ' + f.storage.value + ' · Mfg ' + Fmt.date(f.mfg.value), safeUntil: new Date(f.expiry.value + 'T23:59').toISOString(), prepared: null,
          pickupDate: f.pickupDate.value, pickupTime: f.pickupTime.value, notes: f.notes.value.trim(), image,
          contact: u.phone, location: u.location, address: 'Station Road', donorName: u.org
        }, u);
        root.querySelector('#smArea').innerHTML = donationSubmitted(d);
        window.scrollTo(0, 0);
      });
    }
  };

  function expCard(info) {
    if (!info) return '<p class="muted" style="margin:6px 0 0">Enter or scan an expiry date to check whether this product can be donated.</p>';
    const pct = info.days < 0 ? 100 : Math.max(6, 100 - Math.min(info.days, 30) / 30 * 100);
    const col = { safe: 'var(--green-600)', soon: 'var(--amber)', expired: 'var(--red)' }[info.key];
    return '<div class="row-between" style="margin-top:8px">' + UI.expiryBadge(info) + '<b>' + daysText(info) + '</b></div>' +
      '<div class="expiry-meter"><span style="width:' + pct + '%;background:' + col + '"></span></div><p style="margin:10px 0 0;font-weight:700;color:' + col + '">' + info.text + '</p>';
  }

  /* ---------- barcode scanner ---------- */
  V.scanner = {
    title: 'Barcode Scanner',
    render() {
      return '<div class="page-head"><div><h1>Barcode Scanner</h1><p>Scan a product to identify it and check its expiry.</p></div></div>' +
        '<div class="grid-1-1"><div class="card card-pad">' +
        '<div class="scanner wide" id="scanner"><div class="scan-top"><span>' + icon('camera') + '<span id="camLabel">Camera preview</span></span><span>EAN-13</span></div>' +
        '<div class="scan-frame"><i></i><i></i><i></i><i></i><div class="scan-ghost">' + icon('barcode') + '</div><div class="scan-line"></div></div>' +
        '<div class="scan-hint" id="hint">Place the barcode inside the frame</div></div>' +
        '<div class="btn-row" style="margin-top:16px"><button class="btn btn-primary btn-lg" id="scanBtn">' + icon('scan') + 'Scan Barcode</button><button class="btn btn-outline btn-lg" id="camBtn" style="flex:0 1 auto">' + icon('camera') + 'Use Camera</button></div>' +
        '<form id="manual" class="input-group" style="margin-top:12px"><input class="input mono" name="code" inputmode="numeric" placeholder="Or enter barcode manually" aria-label="Barcode number"><button class="btn btn-secondary">Find</button></form>' +
        '</div><div id="result">' + resultEmpty() + '</div></div>';
    },
    mount(root) {
      const sc = root.querySelector('#scanner');
      let stream = null, timer = null, raf = null;
      const show = code => {
        const prod = Store.lookupBarcode(code);
        root.querySelector('#result').innerHTML = prod ? resultCard(prod) : '<div class="card card-pad">' + UI.alert('warning', 'Product not found', 'Barcode <span class="mono">' + e(code) + '</span> isn\'t in the product catalog. You can still add it manually.') +
          '<div class="btn-row" style="margin-top:14px"><button class="btn btn-outline" data-again>' + icon('refresh') + 'Scan Again</button><a class="btn btn-primary" href="#/app/sm-add">' + icon('plus') + 'Add Manually</a></div></div>';
        root.querySelector('#hint').textContent = prod ? 'Detected: ' + code : 'Unknown barcode';
      };
      const scan = () => {
        sc.classList.add('scanning');
        root.querySelector('#scanBtn').disabled = true;
        root.querySelector('#hint').textContent = 'Scanning…';
        timer = setTimeout(() => {
          sc.classList.remove('scanning');
          root.querySelector('#scanBtn').disabled = false;
          const items = Store.state.inventory;
          const p = items[Store.state.scanCursor % items.length];
          Store.state.scanCursor++; Store.save();
          show(p.barcode);
        }, 1500);
      };
      root.querySelector('#scanBtn').addEventListener('click', scan);
      root.querySelector('#manual').addEventListener('submit', ev => { ev.preventDefault(); const c = ev.target.code.value.trim(); if (c) show(c); });
      root.querySelector('#result').addEventListener('click', ev => {
        if (ev.target.closest('[data-again]')) { root.querySelector('#result').innerHTML = resultEmpty(); scan(); }
        const add = ev.target.closest('[data-add]');
        if (add) App.prefill = Store.lookupBarcode(add.dataset.add);
      });
      /* optional real camera with native BarcodeDetector where supported */
      root.querySelector('#camBtn').addEventListener('click', async () => {
        if (stream) { stop(); return; }
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { UI.toast('Camera is not available in this browser. Use Scan Barcode or manual entry.', 'warning'); return; }
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          const v = document.createElement('video'); v.setAttribute('playsinline', ''); v.muted = true; v.srcObject = stream; sc.prepend(v); await v.play();
          root.querySelector('#camLabel').textContent = 'Live camera';
          root.querySelector('#camBtn').innerHTML = icon('x') + 'Stop Camera';
          sc.classList.add('scanning');
          if ('BarcodeDetector' in window) {
            const det = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a'] });
            const loop = async () => {
              if (!stream) return;
              try { const r = await det.detect(v); if (r.length) { const code = r[0].rawValue; stop(); show(code); return; } } catch (err) {}
              raf = requestAnimationFrame(loop);
            };
            loop();
          } else UI.toast('Live detection isn\'t supported here. Use Scan Barcode or type the number.', 'info');
        } catch (err) { UI.toast('Camera permission was denied or unavailable.', 'warning'); stream = null; }
      });
      function stop() {
        if (stream) stream.getTracks().forEach(t => t.stop());
        stream = null; cancelAnimationFrame(raf);
        const v = sc.querySelector('video'); if (v) v.remove();
        sc.classList.remove('scanning');
        root.querySelector('#camLabel').textContent = 'Camera preview';
        root.querySelector('#camBtn').innerHTML = icon('camera') + 'Use Camera';
      }
      return () => { clearTimeout(timer); stop(); };
    }
  };

  function resultEmpty() {
    return '<div class="card">' + UI.empty('barcode', 'No product scanned yet', 'Press Scan Barcode to read a product label. Product info and expiry will appear here.') + '</div>';
  }
  function resultCard(p) {
    const x = expiryInfo(p.expiry); const pp = Object.assign({}, p, { exp: x });
    const row = (k, v) => '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>';
    return '<div class="card"><div class="card-head"><h3>' + icon('checkCircle') + 'Product Information</h3>' + UI.expiryBadge(x) + '</div><div class="card-body">' +
      '<div class="product">' + pThumb(pp) + '<div><h3 style="margin:0">' + e(p.name) + '</h3><div class="muted" style="font-size:.86rem">' + e(p.brand) + ' · ' + e(p.category) + '</div></div></div>' +
      '<div class="barcode-box" style="margin:16px 0">' + UI.barcode(p.barcode) + '<div class="mono">' + p.barcode + '</div></div>' +
      '<dl class="kv">' + row('Expiry date', Fmt.date(p.expiry)) + row('Days remaining', daysText(x)) + row('Quantity', p.qty + ' units') + row('Mfg. date', Fmt.date(p.mfg)) + row('Storage', e(p.storage)) + row('Status', x.text) + '</dl>' +
      '<div style="margin-top:16px">' + (x.key === 'expired' ? UI.alert('error', 'Expired – Cannot be donated', 'This food has expired and cannot be donated.') : x.key === 'soon' ? UI.alert('warning', 'Expires soon', 'Good candidate for donation. Schedule an early pickup.') : UI.alert('success', 'Valid', 'This product is safe to donate.')) + '</div>' +
      '<div class="btn-row" style="margin-top:16px"><button class="btn btn-outline" data-again>' + icon('refresh') + 'Scan Again</button>' +
      (x.key === 'expired' ? '<button class="btn btn-primary" disabled>' + icon('ban') + 'Add Product</button>' : '<a class="btn btn-primary" href="#/app/sm-add" data-add="' + p.barcode + '">' + icon('plus') + 'Add Product</a>') + '</div></div></div>';
  }

  /* ---------- expiry alerts ---------- */
  V.expiry = {
    title: 'Expiry Alerts',
    render() {
      const items = inv();
      const n = k => items.filter(p => p.exp.key === k).length;
      return '<div class="page-head"><div><h1>Expiry Alerts</h1><p>Track packaged stock and donate items before they expire.</p></div><div class="actions"><a class="btn btn-primary" href="#/app/scanner">' + icon('barcode') + 'Scan Product</a></div></div>' +
        expiringBanner(n('soon')) +
        '<div class="stat-grid" style="margin-bottom:16px">' + UI.stat('Safe', n('safe'), 'checkCircle', 'green', 'more than 7 days') + UI.stat('Expiring Soon', n('soon'), 'alert', 'amber', 'within 7 days') + UI.stat('Expired', n('expired'), 'xCircle', 'red', 'cannot be donated') + '</div>' +
        '<div class="toolbar"><div class="chips" id="flt"><button class="chip active" data-k="">All <span class="n">' + items.length + '</span></button><button class="chip" data-k="soon">Expiring Soon <span class="n">' + n('soon') + '</span></button><button class="chip" data-k="safe">Safe <span class="n">' + n('safe') + '</span></button><button class="chip" data-k="expired">Expired <span class="n">' + n('expired') + '</span></button></div>' +
        '<div class="search">' + icon('search') + '<input class="input" id="q" placeholder="Search product or barcode" aria-label="Search products"></div></div>' +
        '<div class="card"><div class="table-wrap"><table class="table stack"><thead><tr><th>Product</th><th>Barcode</th><th>Quantity</th><th>Expiry date</th><th>Days remaining</th><th>Status</th><th></th></tr></thead><tbody id="rows"></tbody></table></div></div>';
    },
    mount(root) {
      let k = '';
      const draw = () => {
        const q = root.querySelector('#q').value.toLowerCase();
        const items = inv().filter(p => (!k || p.exp.key === k) && (!q || (p.name + p.barcode + p.brand).toLowerCase().includes(q)));
        root.querySelector('#rows').innerHTML = items.length ? items.map(p => '<tr><td class="td-main"><div class="cell-food">' + pThumb(p) + '<div><b>' + e(p.name) + '</b><small>' + e(p.brand) + ' · ' + e(p.category) + '</small></div></div></td>' +
          '<td data-label="Barcode"><span class="mono">' + p.barcode + '</span></td><td data-label="Quantity">' + p.qty + ' units</td><td data-label="Expiry date">' + Fmt.date(p.expiry) + '</td>' +
          '<td data-label="Days remaining"><b style="color:' + ({ safe: 'var(--green-700)', soon: 'var(--amber)', expired: 'var(--red)' }[p.exp.key]) + '">' + daysText(p.exp) + '</b></td>' +
          '<td data-label="Status">' + UI.expiryBadge(p.exp) + '</td>' +
          '<td data-label="">' + (p.exp.key === 'expired' ? '<span class="muted" style="font-size:.8rem;font-weight:600">Cannot be donated</span>' : '<a class="btn ' + (p.exp.key === 'soon' ? 'btn-primary' : 'btn-outline') + ' btn-sm" href="#/app/sm-add" data-prefill="' + p.barcode + '">Donate</a>') + '</td></tr>').join('')
          : '<tr><td colspan="7">' + UI.empty('checkCircle', 'No products match', 'Try another filter.') + '</td></tr>';
      };
      root.querySelector('#flt').addEventListener('click', ev => {
        const b = ev.target.closest('.chip'); if (!b) return;
        root.querySelectorAll('#flt .chip').forEach(x => x.classList.toggle('active', x === b)); k = b.dataset.k; draw();
      });
      root.querySelector('#q').addEventListener('input', draw);
      bindPrefill(root);
      draw();
    }
  };
})();
