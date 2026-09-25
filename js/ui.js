/* RePlate – reusable UI components (return HTML strings) */
(function () {
  const e = s => Fmt.esc(s);

  const UI = {
    badge(text, cls, ic) {
      return '<span class="badge b-' + (cls || 'neutral') + '">' + (ic ? icon(ic) : '<i class="dot"></i>') + e(text) + '</span>';
    },
    status(status, labelOverride) {
      const m = Store.STATUS_META[status] || { cls: 'neutral' };
      return UI.badge(labelOverride || status, m.cls);
    },
    expiryBadge(info) {
      if (!info) return '';
      const cls = { safe: 'safe', soon: 'warn', expired: 'danger' }[info.key];
      const ic = { safe: 'checkCircle', soon: 'alert', expired: 'xCircle' }[info.key];
      return UI.badge(info.label, cls, ic);
    },

    /* food thumbnail – uploaded image or tinted category tile */
    thumb(d, size) {
      const cat = Store.CAT_META[d.category] || Store.CAT_META.Other;
      if (d.image) return '<div class="thumb ' + (size || '') + '"><img src="' + d.image + '" alt="' + e(d.food) + '"></div>';
      return '<div class="thumb tone-' + cat.tone + ' ' + (size || '') + '" role="img" aria-label="' + e(d.category) + '">' + icon(cat.icon) + '</div>';
    },

    avatar(u, size) {
      if (u && u.photo) return '<span class="avatar ' + (size || '') + '"><img src="' + u.photo + '" alt=""></span>';
      return '<span class="avatar ' + (size || '') + ' av-' + (u ? u.role : 'x') + '">' + Fmt.initials(u ? u.name : '?') + '</span>';
    },

    stat(label, value, ic, tone, sub) {
      return '<div class="stat-card"><span class="stat-ic tone-' + (tone || 'green') + '">' + icon(ic) + '</span>' +
        '<div><div class="stat-val">' + value + '</div><div class="stat-label">' + e(label) + '</div>' + (sub ? '<div class="stat-sub">' + sub + '</div>' : '') + '</div></div>';
    },

    empty(ic, title, text, action) {
      return '<div class="empty"><div class="empty-art">' + icon(ic) + '</div><h3>' + e(title) + '</h3>' + (text ? '<p>' + e(text) + '</p>' : '') + (action || '') + '</div>';
    },

    alert(type, title, text) {
      const ic = { success: 'checkCircle', error: 'xCircle', warning: 'alert', info: 'info' }[type];
      return '<div class="alert alert-' + type + '" role="' + (type === 'error' ? 'alert' : 'status') + '">' + icon(ic) + '<div><strong>' + title + '</strong>' + (text ? '<span>' + text + '</span>' : '') + '</div></div>';
    },

    meta(ic, text) { return '<span class="meta">' + icon(ic) + '<span>' + text + '</span></span>'; },

    /* horizontal lifecycle stepper */
    tracker(d) {
      const idx = Store.STATUSES.indexOf(d.status);
      return '<ol class="tracker" aria-label="Donation progress">' + Store.STATUSES.map((s, i) => {
        const st = i < idx ? 'done' : i === idx ? 'current' : 'todo';
        const h = d.history.find(x => x.status === s);
        return '<li class="' + st + '"><span class="tk-dot">' + (i <= idx ? icon('check') : (i + 1)) + '</span><span class="tk-label">' + s + '</span>' +
          '<span class="tk-time">' + (h ? Fmt.time(h.at) : (i === idx + 1 ? 'Next' : '')) + '</span></li>';
      }).join('') + '</ol>';
    },

    /* vertical timeline used on the tracking page */
    timeline(d) {
      const H = s => d.history.find(x => x.status === s);
      const idx = Store.STATUSES.indexOf(d.status);
      const steps = [
        { t: 'Donation Created', s: 'Pending', ic: 'plus', txt: d.donorName + ' listed ' + d.servings + ' servings' },
        { t: 'NGO Accepted', s: 'Accepted', ic: 'handHeart', txt: d.ngoName ? d.ngoName + ' accepted the donation' : 'Waiting for an NGO to accept' },
        { t: 'Volunteer Assigned', s: 'Volunteer Assigned', ic: 'userCheck', txt: d.volunteerName ? d.volunteerName + ' accepted the pickup' : 'Looking for an available volunteer' },
        { t: 'Pickup Verified', s: 'QR', ic: 'qr', txt: d.qrUsed ? 'Donor QR scanned and verified' : 'Volunteer scans the donor QR at pickup' },
        { t: 'Picked Up', s: 'Picked Up', ic: 'checkCircle', txt: d.status === 'Picked Up' ? 'Food collected for ' + (d.ngoName || 'the NGO') : 'Pickup completion' }
      ];
      return '<ol class="timeline">' + steps.map((st, i) => {
        const done = i === 3 ? d.qrUsed : i === 4 ? idx >= 3 : idx >= i;
        const current = !done && (i === 3 ? idx === 2 : i === 4 ? false : idx === i - 1);
        const h = st.s === 'QR' ? (d.verifiedAt ? { at: d.verifiedAt } : null) : H(st.s);
        return '<li class="' + (done ? 'done' : current ? 'current' : 'todo') + '"><span class="tl-ic">' + icon(done ? 'check' : st.ic) + '</span>' +
          '<div class="tl-body"><div class="tl-title">' + st.t + (done && h ? '<time>' + Fmt.dateTime(h.at) + '</time>' : current ? '<em>In progress</em>' : '<em class="muted">Pending</em>') + '</div>' +
          '<p>' + e(st.txt) + '</p></div></li>';
      }).join('') + '</ol>';
    },

    /* deterministic QR-style matrix (visual pickup code) */
    qr(text, size) {
      const N = 25; let h = 2166136261;
      for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
      const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; };
      const finder = (x, y) => {
        const inBox = (ox, oy) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7;
        for (const [ox, oy] of [[0, 0], [N - 7, 0], [0, N - 7]]) {
          if (inBox(ox, oy)) { const dx = x - ox, dy = y - oy; return (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4)) ? 1 : 0; }
          if (x >= ox - 1 && x <= ox + 7 && y >= oy - 1 && y <= oy + 7) return 0;
        }
        return -1;
      };
      let r = '';
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        let v = finder(x, y);
        if (v === -1) v = (y === 6 || x === 6) ? ((x + y) % 2 === 0 ? 1 : 0) : (rnd() > 0.52 ? 1 : 0);
        if (v) r += '<rect x="' + x + '" y="' + y + '" width="1.02" height="1.02"/>';
      }
      return '<svg class="qr-svg" viewBox="-2 -2 ' + (N + 4) + ' ' + (N + 4) + '" width="' + (size || 180) + '" height="' + (size || 180) + '" role="img" aria-label="Pickup QR code ' + e(text) + '"><rect x="-2" y="-2" width="' + (N + 4) + '" height="' + (N + 4) + '" fill="#fff"/><g fill="#14261b">' + r + '</g></svg>';
    },

    barcode(code, w) {
      const digits = String(code || '0000000000000');
      let x = 0, bars = '';
      const pat = s => { for (const c of s) { if (c === '1') bars += '<rect x="' + x + '" y="0" width="1" height="50"/>'; x++; } };
      pat('101');
      for (let i = 0; i < digits.length; i++) {
        const d = +digits[i] || 0;
        const code7 = ((d * 37 + i * 11 + 13) % 128).toString(2).padStart(7, '0');
        pat(i < 6 ? code7 : code7.split('').map(b => b === '1' ? '0' : '1').join(''));
        if (i === 5) pat('01010');
      }
      pat('101');
      return '<svg class="barcode-svg" viewBox="0 0 ' + x + ' 50" width="' + (w || 200) + '" height="56" preserveAspectRatio="none" aria-hidden="true"><g fill="#14261b">' + bars + '</g></svg>';
    },

    /* ---------- charts (pure SVG) ---------- */
    barChart(data, opts) {
      opts = opts || {};
      const W = 520, H = 220, pl = 36, pb = 28, pt = 16;
      const max = Math.max(...data.map(d => d.value)) * 1.15 || 1;
      const bw = (W - pl - 10) / data.length;
      const ticks = 4;
      let g = '';
      for (let i = 0; i <= ticks; i++) {
        const y = pt + (H - pt - pb) * (1 - i / ticks);
        g += '<line x1="' + pl + '" x2="' + W + '" y1="' + y + '" y2="' + y + '" class="grid"/><text x="' + (pl - 6) + '" y="' + (y + 4) + '" text-anchor="end" class="axis">' + Math.round(max * i / ticks) + '</text>';
      }
      data.forEach((d, i) => {
        const h = (H - pt - pb) * d.value / max;
        const x = pl + i * bw + bw * 0.2;
        const last = i === data.length - 1;
        g += '<rect x="' + x + '" y="' + (H - pb - h) + '" width="' + bw * 0.6 + '" height="' + h + '" rx="5" class="bar' + (last && opts.highlightLast ? ' bar-hi' : '') + '"><title>' + e(d.label) + ': ' + d.value + '</title></rect>' +
          '<text x="' + (x + bw * 0.3) + '" y="' + (H - 9) + '" text-anchor="middle" class="axis">' + e(d.label) + '</text>' +
          (opts.values ? '<text x="' + (x + bw * 0.3) + '" y="' + (H - pb - h - 6) + '" text-anchor="middle" class="val">' + d.value + '</text>' : '');
      });
      return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + e(opts.label || 'Bar chart') + '">' + g + '</svg>';
    },

    lineChart(data, opts) {
      opts = opts || {};
      const W = 520, H = 220, pl = 36, pb = 28, pt = 16, pr = 12;
      const max = Math.max(...data.map(d => d.value)) * 1.15 || 1;
      const step = (W - pl - pr) / (data.length - 1);
      const pts = data.map((d, i) => [pl + i * step, pt + (H - pt - pb) * (1 - d.value / max)]);
      let g = '';
      for (let i = 0; i <= 4; i++) {
        const y = pt + (H - pt - pb) * (1 - i / 4);
        g += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y + '" y2="' + y + '" class="grid"/><text x="' + (pl - 6) + '" y="' + (y + 4) + '" text-anchor="end" class="axis">' + Math.round(max * i / 4) + '</text>';
      }
      const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
      g += '<path d="' + path + ' L' + pts[pts.length - 1][0] + ' ' + (H - pb) + ' L' + pl + ' ' + (H - pb) + ' Z" class="area"/>';
      g += '<path d="' + path + '" class="line"/>';
      pts.forEach((p, i) => { g += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" class="pt"><title>' + e(data[i].label) + ': ' + data[i].value + '</title></circle><text x="' + p[0] + '" y="' + (H - 9) + '" text-anchor="middle" class="axis">' + e(data[i].label) + '</text>'; });
      return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + e(opts.label || 'Line chart') + '">' + g + '</svg>';
    },

    donut(data, opts) {
      opts = opts || {};
      const total = data.reduce((s, d) => s + d.value, 0) || 1;
      const R = 60, C = 2 * Math.PI * R;
      let off = 0, segs = '';
      data.forEach((d, i) => {
        const len = C * d.value / total;
        segs += '<circle r="' + R + '" cx="80" cy="80" fill="none" stroke="var(--c' + (i + 1) + ')" stroke-width="22" stroke-dasharray="' + Math.max(len - 2, 0) + ' ' + C + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 80 80)"><title>' + e(d.label) + ': ' + d.value + '</title></circle>';
        off += len;
      });
      const legend = data.map((d, i) => '<li><i style="background:var(--c' + (i + 1) + ')"></i><span>' + e(d.label) + '</span><b>' + Math.round(d.value / total * 100) + '%</b></li>').join('');
      return '<div class="donut-wrap"><svg class="donut" viewBox="0 0 160 160" role="img" aria-label="' + e(opts.label || 'Donut chart') + '">' + segs +
        '<text x="80" y="78" text-anchor="middle" class="donut-num">' + Fmt.num(opts.center != null ? opts.center : total) + '</text><text x="80" y="96" text-anchor="middle" class="donut-sub">' + e(opts.centerLabel || 'Total') + '</text></svg><ul class="legend">' + legend + '</ul></div>';
    },

    hbars(data) {
      const max = Math.max(...data.map(d => d.value)) || 1;
      return '<ul class="hbars">' + data.map(d => '<li><div class="hb-top"><span>' + e(d.label) + '</span><b>' + Fmt.num(d.value) + '</b></div><div class="hb-track"><span class="hb-fill ' + (d.cls || '') + '" style="width:' + (d.value / max * 100) + '%"></span></div></li>').join('') + '</ul>';
    },

    /* ---------- overlays ---------- */
    toast(msg, type) {
      let host = document.getElementById('toasts');
      const t = document.createElement('div');
      t.className = 'toast toast-' + (type || 'success');
      t.setAttribute('role', 'status');
      t.innerHTML = icon(type === 'error' ? 'xCircle' : type === 'warning' ? 'alert' : type === 'info' ? 'info' : 'checkCircle') + '<span>' + msg + '</span>';
      host.appendChild(t);
      requestAnimationFrame(() => t.classList.add('show'));
      setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3200);
    },

    modal(opts) {
      UI.closeModal();
      const wrap = document.createElement('div');
      wrap.className = 'modal-backdrop';
      wrap.id = 'modal';
      wrap.innerHTML = '<div class="modal ' + (opts.size || '') + '" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
        '<div class="modal-head"><h3 id="modal-title">' + opts.title + '</h3><button class="icon-btn" data-close aria-label="Close">' + icon('x') + '</button></div>' +
        '<div class="modal-body">' + opts.body + '</div>' +
        (opts.footer ? '<div class="modal-foot">' + opts.footer + '</div>' : '') + '</div>';
      document.body.appendChild(wrap);
      document.body.classList.add('no-scroll');
      requestAnimationFrame(() => wrap.classList.add('show'));
      wrap.addEventListener('click', ev => { if (ev.target === wrap || ev.target.closest('[data-close]')) UI.closeModal(); });
      const f = wrap.querySelector('input,select,textarea,button:not([data-close])');
      if (f) setTimeout(() => f.focus(), 50);
      if (opts.onMount) opts.onMount(wrap);
      return wrap;
    },
    closeModal() {
      const m = document.getElementById('modal');
      if (m) m.remove();
      document.body.classList.remove('no-scroll');
    },
    confirm(opts) {
      return new Promise(resolve => {
        const m = UI.modal({
          title: opts.title, size: 'sm',
          body: '<div class="confirm-body"><span class="confirm-ic tone-' + (opts.danger ? 'red' : 'green') + '">' + icon(opts.icon || (opts.danger ? 'alert' : 'help')) + '</span><p>' + opts.text + '</p></div>',
          footer: '<button class="btn btn-outline" data-close>' + (opts.cancel || 'Cancel') + '</button><button class="btn ' + (opts.danger ? 'btn-danger' : 'btn-primary') + '" data-ok>' + (opts.ok || 'Confirm') + '</button>'
        });
        m.querySelector('[data-ok]').addEventListener('click', () => { UI.closeModal(); resolve(true); });
        m.addEventListener('click', ev => { if (ev.target === m || ev.target.closest('[data-close]')) resolve(false); });
      });
    },

    /* image input -> downscaled data URL */
    readImage(file, maxW) {
      return new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => {
          const img = new Image();
          img.onload = () => {
            const s = Math.min(1, (maxW || 520) / img.width);
            const c = document.createElement('canvas');
            c.width = img.width * s; c.height = img.height * s;
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            res(c.toDataURL('image/jpeg', 0.8));
          };
          img.onerror = rej;
          img.src = fr.result;
        };
        fr.onerror = rej;
        fr.readAsDataURL(file);
      });
    },

    field(label, input, opts) {
      opts = opts || {};
      return '<div class="field ' + (opts.cls || '') + '"><label' + (opts.for ? ' for="' + opts.for + '"' : '') + '>' + label + (opts.req ? ' <span class="req">*</span>' : opts.opt ? ' <span class="opt">(optional)</span>' : '') + '</label>' + input +
        (opts.help ? '<small class="help">' + opts.help + '</small>' : '') + '<small class="err-msg"></small></div>';
    }
  };

  window.UI = UI;
})();
