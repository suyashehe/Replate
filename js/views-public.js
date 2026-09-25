/* RePlate – public pages: landing, login, register */
(function () {
  const V = App.Views;
  const e = s => Fmt.esc(s);

  window.PlatformStats = function () {
    const s = Store.state;
    const picked = s.donations.filter(d => d.status === 'Picked Up');
    return {
      donations: 1248 + s.donations.length,
      meals: 35600 + picked.reduce((a, d) => a + (+d.servings || 0), 0),
      kg: 12480 + picked.reduce((a, d) => a + (parseFloat(d.quantity) || 0), 0),
      ngos: 28 + s.users.filter(u => u.role === 'ngo').length,
      volunteers: 44 + s.users.filter(u => u.role === 'volunteer').length,
      donors: 180 + s.users.filter(u => u.role === 'donor' || u.role === 'supermarket').length
    };
  };

  function pubHeader() {
    return '<header class="pub-header" id="pubHeader"><nav class="pub-nav" aria-label="Main">' +
      '<a class="brand" href="#/">' + logoMark(36) + '<span>Re<b>Plate</b></span></a>' +
      '<div class="pub-links"><a href="#how">How it works</a><a href="#donors">Who can donate</a><a href="#receivers">Who receives</a><a href="#supermarkets">Supermarkets</a><a href="#/components">Design system</a></div>' +
      '<div class="pub-actions"><a class="btn btn-ghost" href="#/login">Login</a><a class="btn btn-primary btn-sm" href="#/register">Get Started</a>' +
      '<button class="icon-btn menu-toggle" aria-label="Open menu" aria-expanded="false" id="pubMenuBtn">' + icon('menu') + '</button></div></nav>' +
      '<div class="mobile-menu" id="pubMenu"><a href="#how">How it works</a><a href="#donors">Who can donate</a><a href="#receivers">Who receives</a><a href="#supermarkets">Supermarkets</a><a href="#/components">Design system</a><a href="#/login">Login</a></div></header>';
  }

  function heroArt() {
    return '<svg class="hero-art" viewBox="0 0 520 440" role="img" aria-label="A crate of surplus fresh food ready to be shared">' +
      '<circle cx="270" cy="215" r="195" fill="#E4F1E3"/>' +
      '<circle cx="420" cy="92" r="46" fill="#FDEEDC"/>' +
      '<path d="M60 360c-10-70 40-120 110-110-15 60-55 100-110 110Z" fill="#A7D3AE"/>' +
      '<path d="M62 358c25-38 55-70 100-98" stroke="#4C9A5B" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path d="M455 250c50-40 55-100 20-140-40 35-55 90-20 140Z" fill="#A7D3AE"/>' +
      '<path d="M457 248c5-45 10-85 16-130" stroke="#4C9A5B" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="262" cy="392" rx="178" ry="13" fill="#163A24" opacity=".08"/>' +
      /* greens */
      '<ellipse cx="338" cy="205" rx="26" ry="56" transform="rotate(-18 338 205)" fill="#3E8E52"/>' +
      '<ellipse cx="370" cy="215" rx="22" ry="50" transform="rotate(20 370 215)" fill="#5DAA67"/>' +
      '<ellipse cx="312" cy="222" rx="18" ry="42" transform="rotate(-40 312 222)" fill="#6BB874"/>' +
      '<path d="M338 160v100M370 172l-10 90" stroke="#2A6440" stroke-width="2.5" opacity=".6"/>' +
      /* carrots */
      '<path d="M372 268 398 150l16 4-22 116Z" fill="#E8903A"/><path d="M380 230l14 3M386 200l12 3" stroke="#C9731F" stroke-width="2.5" stroke-linecap="round"/>' +
      '<path d="M404 152c-6-18-2-30 6-36M408 152c4-16 14-24 24-24M404 152c-12-10-24-10-32-4" stroke="#3E8E52" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      /* bread */
      '<ellipse cx="185" cy="236" rx="74" ry="36" fill="#D9A45B"/><ellipse cx="180" cy="228" rx="64" ry="24" fill="#E6B775"/>' +
      '<path d="M140 222c8 8 8 16 2 22M170 216c8 8 8 18 2 24M200 216c8 8 8 18 2 24M228 222c6 6 6 14 1 20" stroke="#B9823B" stroke-width="3.5" fill="none" stroke-linecap="round"/>' +
      /* tomatoes & orange */
      '<circle cx="268" cy="238" r="32" fill="#D9483B"/><circle cx="258" cy="226" r="8" fill="#fff" opacity=".25"/>' +
      '<path d="M268 207l-8 6 8 1 8-1Z" fill="#2A6440"/>' +
      '<circle cx="312" cy="256" r="24" fill="#E35D48"/><circle cx="305" cy="247" r="6" fill="#fff" opacity=".25"/>' +
      '<circle cx="226" cy="262" r="22" fill="#F2A33A"/><circle cx="220" cy="254" r="5" fill="#fff" opacity=".3"/>' +
      /* crate */
      '<rect x="108" y="262" width="310" height="124" rx="16" fill="#C98B4F"/>' +
      '<rect x="108" y="262" width="310" height="16" rx="8" fill="#D9A06A"/>' +
      '<path d="M120 310h286M120 350h286" stroke="#A86F3C" stroke-width="3"/>' +
      '<rect x="228" y="286" width="70" height="14" rx="7" fill="#8E5B30" opacity=".55"/>' +
      '<rect x="138" y="324" width="96" height="36" rx="8" fill="#FAF8F1" opacity=".92"/>' +
      '<path d="M152 342h40M152 350h24" stroke="#2A6440" stroke-width="3" stroke-linecap="round"/><circle cx="214" cy="342" r="8" fill="#4C9A5B"/>' +
      '<path d="M210 342l3 3 5-6" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '</svg>';
  }

  const DONORS = [
    ['utensils', 'Restaurants', 'Unsold meals & prepared dishes', 'orange'],
    ['building', 'Hotels', 'Buffet and banquet surplus', 'blue'],
    ['sparkles', 'Wedding Halls', 'Leftover food from functions', 'violet'],
    ['coffee', 'Corporate Cafeterias', 'Daily canteen surplus', 'amber'],
    ['cap', 'College Canteens', 'Excess meals from campuses', 'green'],
    ['cake', 'Bakeries', 'Breads, buns and pastries', 'wheat'],
    ['basket', 'Grocery Stores', 'Staples and dry goods', 'sand'],
    ['store', 'Supermarkets', 'Packaged food near expiry', 'orange'],
    ['carrot', 'Fruit & Vegetable Vendors', 'Fresh produce surplus', 'green'],
    ['home', 'Households / Events', 'Parties, functions & celebrations', 'blue']
  ];
  const RECEIVERS = [
    ['handHeart', 'NGOs', 'Registered food-relief groups', 'green'],
    ['smile', 'Orphanages', 'Nutritious meals for children', 'orange'],
    ['elder', 'Old Age Homes', 'Care for senior citizens', 'blue'],
    ['tent', 'Homeless Shelters', 'Hot meals for those in need', 'violet'],
    ['chef', 'Community Kitchens', 'Cook & serve at scale', 'amber'],
    ['buoy', 'Disaster Relief', 'Emergency food support', 'red']
  ];
  const who = (arr) => arr.map(w => '<div class="who"><span class="who-ic tone-' + w[3] + '">' + icon(w[0]) + '</span><b>' + w[1] + '</b><small>' + w[2] + '</small></div>').join('');

  V.landing = {
    title: 'Turn Surplus Food Into Shared Meals',
    render() {
      const s = PlatformStats();
      return pubHeader() + '<main id="main">' +
        /* hero */
        '<section class="hero"><div class="container hero-grid">' +
        '<div><span class="eyebrow">' + icon('leaf') + 'Food donation & redistribution platform</span>' +
        '<h1>Turn Surplus Food Into <span>Shared Meals</span></h1>' +
        '<p class="hero-lead">RePlate connects surplus food donors with NGOs and volunteers to reduce food waste and help communities in need.</p>' +
        '<div class="hero-cta"><a class="btn btn-primary btn-lg" href="#/app/donate">' + icon('heart') + 'Donate Food</a><a class="btn btn-outline btn-lg" href="#/app/available">' + icon('search') + 'Find Donations</a></div>' +
        '<div class="hero-trust"><span>' + icon('shield') + 'QR-verified pickups</span><span>' + icon('hourglass') + 'Expiry checks</span><span>' + icon('userCheck') + 'Verified NGOs</span></div></div>' +
        '<div class="hero-visual">' + heroArt() +
        '<div class="float-card fc-1"><span class="fc-ic tone-blue">' + icon('handHeart') + '</span><div><b>Donation accepted</b><small>Hope Foundation · 50 meals</small></div></div>' +
        '<div class="float-card fc-2"><span class="fc-ic tone-green">' + icon('qr') + '</span><div><b>QR verified ✓</b><small>Pickup confirmed</small></div></div>' +
        '<div class="float-card fc-3"><span class="fc-ic tone-orange">' + icon('leaf') + '</span><div><b>' + Fmt.num(s.kg) + ' kg</b><small>food rescued so far</small></div></div>' +
        '</div></div></section>' +
        /* steps */
        '<section class="section section-alt" id="how"><div class="container">' +
        '<div class="section-head"><span class="kicker">How it works</span><h2>Three simple steps from surplus to shared</h2><p>Every donation follows a transparent, trackable lifecycle, with pickup confirmed by QR verification.</p></div>' +
        '<div class="steps">' +
        '<div class="step"><span class="step-n">01</span><span class="step-ic tone-orange">' + icon('plus') + '</span><h3>Donate</h3><p>Donors list their surplus food with quantity, safe consumption time and a pickup slot.</p></div>' +
        '<div class="step"><span class="step-n">02</span><span class="step-ic tone-blue">' + icon('handHeart') + '</span><h3>Connect</h3><p>NGOs accept suitable donations and a nearby volunteer is assigned for pickup.</p></div>' +
        '<div class="step"><span class="step-n">03</span><span class="step-ic tone-green">' + icon('qr') + '</span><h3>Redistribute</h3><p>Volunteers collect the food and complete pickup verification by scanning the donor QR.</p></div>' +
        '</div>' +
        '<div class="flow-strip" style="margin-top:28px">' + ['Pending', 'Accepted', 'Volunteer Assigned', 'Picked Up'].map((st, i) => (i ? '<span class="arrow">' + icon('arrowRight') + '</span>' : '') + UI.status(st)).join('') + '</div>' +
        '</div></section>' +
        /* impact */
        '<section class="section"><div class="container">' +
        '<div class="section-head"><span class="kicker">Our impact</span><h2>Together we are making a difference</h2></div>' +
        '<div class="impact">' +
        '<div class="impact-card">' + icon('package') + '<div class="num">' + Fmt.num(s.donations) + '</div><div class="lbl">Food donations</div></div>' +
        '<div class="impact-card">' + icon('soup') + '<div class="num">' + Fmt.num(s.meals) + '</div><div class="lbl">Meals redistributed</div></div>' +
        '<div class="impact-card">' + icon('handHeart') + '<div class="num">' + s.ngos + '</div><div class="lbl">Active NGOs</div></div>' +
        '<div class="impact-card">' + icon('userCheck') + '<div class="num">' + s.volunteers + '</div><div class="lbl">Active volunteers</div></div>' +
        '</div></div></section>' +
        /* who donates */
        '<section class="section section-alt" id="donors"><div class="container">' +
        '<div class="section-head"><span class="kicker">Who can donate?</span><h2>Anyone with good food to spare</h2><p>From commercial kitchens to family celebrations, surplus food finds its way to people who need it.</p></div>' +
        '<div class="who-grid">' + who(DONORS) + '</div></div></section>' +
        /* receivers */
        '<section class="section" id="receivers"><div class="container">' +
        '<div class="section-head"><span class="kicker">Who receives food?</span><h2>Verified organizations serving communities</h2></div>' +
        '<div class="who-grid six">' + who(RECEIVERS) + '</div></div></section>' +
        /* supermarket feature */
        '<section class="section section-alt" id="supermarkets"><div class="container feature">' +
        '<div><span class="kicker" style="color:var(--orange);font-weight:800;font-size:.76rem;letter-spacing:.1em;text-transform:uppercase">For supermarkets</span><h2>Donate packaged food before it expires</h2>' +
        '<p>Scan a product barcode, check its expiry instantly, and list it for NGOs in seconds. Expired items are blocked automatically.</p>' +
        '<ul><li>' + icon('barcode') + '<div><b>Barcode scanning</b><span>Identify products and pull expiry details.</span></div></li>' +
        '<li>' + icon('hourglass') + '<div><b>Expiry alerts</b><span>See what is safe, expiring soon or expired at a glance.</span></div></li>' +
        '<li>' + icon('qr') + '<div><b>QR pickup verification</b><span>The right volunteer collects the right donation.</span></div></li></ul>' +
        '<a class="btn btn-primary" href="#/register">' + icon('store') + 'Register your store</a></div>' +
        '<div class="card card-pad" style="max-width:460px;justify-self:center;width:100%">' +
        '<div class="row-between" style="margin-bottom:14px"><b>Expiry Alerts</b>' + UI.badge('12 expiring soon', 'warn', 'alert') + '</div>' +
        [['Toned Milk 500ml', 1, 'soon'], ['Whole Wheat Bread 400g', 2, 'soon'], ['Basmati Rice 1kg', 240, 'safe'], ['Salted Butter 100g', -3, 'expired']].map(p =>
          '<div class="info-row"><span class="ir-ic tone-' + (p[2] === 'safe' ? 'green' : p[2] === 'soon' ? 'amber' : 'red') + '">' + icon('package') + '</span><div><b>' + p[0] + '</b><small>' + (p[1] < 0 ? 'Expired ' + (-p[1]) + ' days ago' : p[1] + ' days remaining') + '</small></div><span class="ir-end">' + UI.expiryBadge({ key: p[2], label: p[2] === 'safe' ? 'Safe' : p[2] === 'soon' ? 'Expiring Soon' : 'Expired' }) + '</span></div>').join('') +
        '</div></div></section>' +
        /* CTA */
        '<section class="section"><div class="container"><div class="cta-band">' +
        '<span class="leaf-bg l1">' + icon('leaf') + '</span><span class="leaf-bg l2">' + icon('leaf') + '</span>' +
        '<h2>Have surplus food? Don\'t waste it. RePlate it.</h2><p>List your donation in under a minute. A verified NGO and volunteer will take it from there.</p>' +
        '<a class="btn btn-accent btn-lg" href="#/app/donate">' + icon('heart') + 'Donate Food</a></div></div></section>' +
        '</main>' +
        /* footer */
        '<footer class="pub-footer"><div class="container"><div class="foot-grid">' +
        '<div><a class="brand" href="#/">' + logoMark(32) + '<span>Re<b>Plate</b></span></a><p style="margin-top:12px;max-width:320px">A food donation, redistribution and volunteer coordination platform. Reducing food waste, feeding lives.</p></div>' +
        '<div><h4>Platform</h4><ul><li><a href="#how">How it works</a></li><li><a href="#donors">Donors</a></li><li><a href="#receivers">NGOs</a></li><li><a href="#supermarkets">Supermarkets</a></li></ul></div>' +
        '<div><h4>Get involved</h4><ul><li><a href="#/register">Become a donor</a></li><li><a href="#/register">Register your NGO</a></li><li><a href="#/register">Volunteer with us</a></li></ul></div>' +
        '<div><h4>Resources</h4><ul><li><a href="#/components">UI component library</a></li><li><a href="#/login">Login</a></li><li><a href="#" id="resetDemo">Reset demo data</a></li></ul></div>' +
        '</div><div class="foot-bottom"><span>© ' + new Date().getFullYear() + ' RePlate. Food redistribution for social impact.</span><span>Made with care for communities</span></div></div></footer>' +
        '<div class="mobile-cta"><a class="btn btn-outline" href="#/login">Login</a><a class="btn btn-primary" href="#/app/donate">' + icon('heart') + 'Donate Food</a></div>';
    },
    mount(root) {
      const hdr = root.querySelector('#pubHeader');
      const onScroll = () => hdr.classList.toggle('scrolled', window.scrollY > 8);
      window.addEventListener('scroll', onScroll);
      const btn = root.querySelector('#pubMenuBtn'), menu = root.querySelector('#pubMenu');
      btn.addEventListener('click', () => { const o = menu.classList.toggle('open'); btn.setAttribute('aria-expanded', o); });
      /* in-page anchors (hash router uses #/ for pages) */
      root.querySelectorAll('a[href^="#"]:not([href^="#/"])').forEach(a => a.addEventListener('click', ev => {
        ev.preventDefault(); menu.classList.remove('open');
        const t = root.querySelector(a.getAttribute('href'));
        if (t) t.scrollIntoView({ behavior: 'smooth' });
      }));
      root.querySelector('#resetDemo').addEventListener('click', ev => {
        ev.preventDefault();
        UI.confirm({ title: 'Reset demo data?', text: 'All donations, users and notifications return to the original sample data.', ok: 'Reset', danger: true }).then(ok => {
          if (ok) { Store.reset(); Store.clearSession(); App.render(); UI.toast('Demo data restored.'); }
        });
      });
      return () => window.removeEventListener('scroll', onScroll);
    }
  };

  /* ---------- auth layout ---------- */
  function authShell(inner) {
    const s = PlatformStats();
    return '<div class="auth">' +
      '<aside class="auth-side"><a class="brand" href="#/">' + logoMark(38) + '<span>Re<b style="color:#8FD19E">Plate</b></span></a>' +
      '<div><h2>Reducing food waste, feeding lives.</h2><p>Join donors, NGOs and volunteers who turn surplus food into shared meals every day.</p>' +
      '<div class="impact" style="grid-template-columns:1fr 1fr;margin-top:24px">' +
      '<div class="impact-card" style="background:rgba(255,255,255,.08)">' + icon('soup') + '<div class="num">' + Fmt.num(s.meals) + '</div><div class="lbl">Meals redistributed</div></div>' +
      '<div class="impact-card" style="background:rgba(255,255,255,.08)">' + icon('handHeart') + '<div class="num">' + s.ngos + '</div><div class="lbl">Partner NGOs</div></div></div></div>' +
      '<small style="color:#9FC7A6">© RePlate</small></aside>' +
      '<div class="auth-main"><a class="back-link" href="#/">' + icon('arrowLeft') + 'Back to home</a><div class="auth-card">' + inner + '</div></div></div>';
  }

  const pwInput = (id, name, ph, ac) => '<div class="input-wrap">' + icon('lock') + '<input class="input" id="' + id + '" name="' + name + '" type="password" placeholder="' + ph + '" autocomplete="' + ac + '" style="padding-right:50px"><span class="trail"><button type="button" class="pw-toggle" data-pw="' + id + '" aria-label="Show password">' + icon('eye') + '</button></span></div>';
  function bindPw(root) {
    root.querySelectorAll('[data-pw]').forEach(b => b.addEventListener('click', () => {
      const i = root.querySelector('#' + b.dataset.pw);
      const show = i.type === 'password';
      i.type = show ? 'text' : 'password';
      b.innerHTML = icon(show ? 'eyeOff' : 'eye');
      b.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    }));
  }
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  V.login = {
    title: 'Login',
    render() {
      const demo = [['u1', 'Donor'], ['u2', 'NGO'], ['u3', 'Volunteer'], ['u4', 'Supermarket'], ['u5', 'Admin']];
      return authShell(
        '<div class="brand">' + logoMark(40) + '<span>Re<b>Plate</b></span></div>' +
        '<h1>Welcome back</h1><p class="lead">Log in to manage donations, pickups and your impact.</p>' +
        '<div id="loginMsg"></div>' +
        '<form id="loginForm" novalidate>' +
        UI.field('Email', '<div class="input-wrap">' + icon('mail') + '<input class="input" id="lemail" name="email" type="email" placeholder="you@example.com" autocomplete="email"></div>', { for: 'lemail' }) +
        UI.field('Password', pwInput('lpw', 'password', 'Enter your password', 'current-password'), { for: 'lpw' }) +
        '<div class="row-between" style="margin:-4px 0 20px"><label class="check"><input type="checkbox" name="remember" checked> Remember me</label><button type="button" class="link-btn" id="forgotBtn">Forgot password?</button></div>' +
        '<button class="btn btn-primary btn-lg btn-block" type="submit">Login</button></form>' +
        '<p class="auth-foot">Don\'t have an account? <a href="#/register">Register</a></p>' +
        '<div class="divider">Try a demo account</div>' +
        '<div class="demo-grid">' + demo.map(([id, lbl]) => { const u = Store.user(id); return '<button class="demo-btn" data-demo="' + id + '">' + UI.avatar(u) + '<span>' + lbl + '</span></button>'; }).join('') + '</div>' +
        '<p class="help" style="text-align:center;margin-top:10px">Demo password for every account: <span class="code-pill">demo123</span></p>'
      );
    },
    mount(root) {
      bindPw(root);
      const f = root.querySelector('#loginForm'), msg = root.querySelector('#loginMsg');
      root.querySelectorAll('[data-demo]').forEach(b => b.addEventListener('click', () => {
        const u = Store.user(b.dataset.demo);
        f.email.value = u.email; f.password.value = 'demo123';
        f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event('submit'));
      }));
      f.addEventListener('submit', ev => {
        ev.preventDefault();
        msg.innerHTML = '';
        if (!App.validate(f, {
          email: v => !v ? 'Please enter your email.' : !EMAIL_RE.test(v) ? 'Please enter a valid email address.' : '',
          password: v => !v ? 'Please enter your password.' : ''
        })) return;
        const u = Store.userByEmail(f.email.value);
        if (!u || u.password !== f.password.value) { msg.innerHTML = UI.alert('error', 'Incorrect email or password.', 'Check your details and try again.') + '<div style="height:14px"></div>'; return; }
        if (u.status === 'Suspended') { msg.innerHTML = UI.alert('error', 'This account is suspended.', 'Please contact the RePlate administrator.') + '<div style="height:14px"></div>'; return; }
        Store.setSession(u.id, f.remember.checked);
        UI.toast('Welcome back, ' + u.name.split(' ')[0] + '!');
        const next = App.afterLogin; App.afterLogin = null;
        location.hash = next || '#/app/dashboard';
      });
      root.querySelector('#forgotBtn').addEventListener('click', () => {
        const m = UI.modal({
          title: 'Reset your password', size: 'sm',
          body: '<p>Enter the email linked to your account and we\'ll send you a reset link.</p><form id="fpForm" novalidate>' + UI.field('Email', '<input class="input" name="email" type="email" placeholder="you@example.com">') + '</form>',
          footer: '<button class="btn btn-outline" data-close>Cancel</button><button class="btn btn-primary" id="fpSend">Send reset link</button>'
        });
        m.querySelector('#fpSend').addEventListener('click', () => {
          const ff = m.querySelector('#fpForm');
          if (!App.validate(ff, { email: v => !EMAIL_RE.test(v) ? 'Please enter a valid email address.' : '' })) return;
          m.querySelector('.modal-body').innerHTML = UI.alert('success', 'Check your inbox', 'If an account exists for this email, a password reset link has been sent.');
          m.querySelector('.modal-foot').innerHTML = '<button class="btn btn-primary" data-close>Done</button>';
        });
      });
    }
  };

  V.register = {
    title: 'Create Account',
    render() {
      const roles = [['donor', 'Donor', 'Restaurant, hotel, store, household', 'store', 'orange'], ['ngo', 'NGO', 'Orphanage, shelter, kitchen', 'handHeart', 'blue'], ['volunteer', 'Volunteer', 'Help with food pickups', 'userCheck', 'violet']];
      return authShell(
        '<div class="brand">' + logoMark(40) + '<span>Re<b>Plate</b></span></div>' +
        '<h1>Create your account</h1><p class="lead">Join RePlate and be a part of the change.</p>' +
        '<div id="regMsg"></div>' +
        '<form id="regForm" novalidate>' +
        '<fieldset style="border:0;padding:0;margin:0 0 16px"><legend class="label" style="margin-bottom:8px">I am joining as <span class="req">*</span></legend><div class="role-grid">' +
        roles.map((r, i) => '<div class="role-opt"><input type="radio" name="role" id="role-' + r[0] + '" value="' + r[0] + '"' + (i === 0 ? ' checked' : '') + '><label for="role-' + r[0] + '"><span class="ric tone-' + r[4] + '">' + icon(r[3]) + '</span>' + r[1] + '<small>' + r[2] + '</small></label></div>').join('') +
        '</div></fieldset>' +
        UI.field('Full Name', '<div class="input-wrap">' + icon('user') + '<input class="input" id="rname" name="name" placeholder="e.g. Yashvi Patel" autocomplete="name"></div>', { for: 'rname', req: true }) +
        '<div class="form-grid">' +
        UI.field('Email', '<div class="input-wrap">' + icon('mail') + '<input class="input" id="remail" name="email" type="email" placeholder="you@example.com" autocomplete="email"></div>', { for: 'remail', req: true }) +
        UI.field('Phone Number', '<div class="input-wrap">' + icon('phone') + '<input class="input" id="rphone" name="phone" type="tel" placeholder="+91 98765 43210" autocomplete="tel"></div>', { for: 'rphone', req: true }) +
        '</div>' +
        '<div id="orgFields" class="form-grid">' +
        UI.field('<span id="orgLabel">Organization Name</span>', '<input class="input" id="rorg" name="org" placeholder="e.g. Spice Garden Restaurant">', { for: 'rorg', req: true }) +
        UI.field('<span id="typeLabel">Donor Type</span>', '<select class="input" id="rtype" name="orgType"></select>', { for: 'rtype', req: true }) +
        '</div>' +
        UI.field('Location', '<div class="input-wrap">' + icon('pin') + '<input class="input" id="rloc" name="location" placeholder="Area, City"></div>', { for: 'rloc', req: true }) +
        '<div class="form-grid">' +
        UI.field('Password', pwInput('rpw', 'password', 'At least 6 characters', 'new-password') + '<div class="strength" id="pwStrength" data-s="0"><i></i><i></i><i></i><i></i></div>', { for: 'rpw', req: true }) +
        UI.field('Confirm Password', pwInput('rpw2', 'confirm', 'Re-enter password', 'new-password'), { for: 'rpw2', req: true }) +
        '</div>' +
        '<label class="check" style="margin:4px 0 20px"><input type="checkbox" name="agree"> I agree to follow RePlate\'s food safety guidelines</label>' +
        '<button class="btn btn-primary btn-lg btn-block" type="submit">Create Account</button></form>' +
        '<p class="auth-foot">Already have an account? <a href="#/login">Login</a></p>'
      );
    },
    mount(root) {
      bindPw(root);
      const f = root.querySelector('#regForm'), msg = root.querySelector('#regMsg');
      const setRole = () => {
        const role = f.role.value;
        const orgF = root.querySelector('#orgFields');
        orgF.classList.toggle('hidden', role === 'volunteer');
        root.querySelector('#orgLabel').textContent = role === 'ngo' ? 'NGO / Organization Name' : 'Organization / Business Name';
        root.querySelector('#typeLabel').textContent = role === 'ngo' ? 'Organization Type' : 'Donor Type';
        const opts = role === 'ngo' ? Store.NGO_TYPES : Store.DONOR_TYPES;
        f.orgType.innerHTML = '<option value="">Select type</option>' + opts.map(o => '<option>' + o + '</option>').join('');
      };
      root.querySelectorAll('[name=role]').forEach(r => r.addEventListener('change', setRole));
      setRole();
      f.password.addEventListener('input', () => {
        const v = f.password.value; let s = 0;
        if (v.length >= 6) s++; if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++; if (/\d/.test(v)) s++; if (/[^A-Za-z0-9]/.test(v) || v.length >= 12) s++;
        root.querySelector('#pwStrength').dataset.s = v ? Math.max(1, s) : 0;
      });
      f.email.addEventListener('blur', () => {
        if (Store.userByEmail(f.email.value)) showExists();
      });
      function showExists() {
        msg.innerHTML = UI.alert('error', 'This email is already registered. Please login instead.', '<a href="#/login">Go to Login →</a>') + '<div style="height:14px"></div>';
        const fld = f.email.closest('.field'); fld.classList.add('invalid'); fld.querySelector('.err-msg').textContent = 'An account with this email already exists.';
      }
      f.addEventListener('submit', ev => {
        ev.preventDefault();
        msg.innerHTML = '';
        const role = f.role.value;
        const rules = {
          name: v => v.length < 2 ? 'Please enter your full name.' : '',
          email: v => !v ? 'Please enter your email.' : !EMAIL_RE.test(v) ? 'Please enter a valid email address.' : '',
          phone: v => v.replace(/\D/g, '').length < 10 ? 'Please enter a valid 10-digit phone number.' : '',
          location: v => !v ? 'Please enter your location.' : '',
          password: v => v.length < 6 ? 'Password must be at least 6 characters.' : '',
          confirm: (v, fm) => v !== fm.password.value ? 'Passwords do not match.' : ''
        };
        if (role !== 'volunteer') { rules.org = v => !v ? 'Please enter the organization name.' : ''; rules.orgType = v => !v ? 'Please select a type.' : ''; }
        if (!App.validate(f, rules)) return;
        if (!f.agree.checked) { msg.innerHTML = UI.alert('warning', 'Please accept the food safety guidelines to continue.') + '<div style="height:14px"></div>'; return; }
        const data = {
          role: role === 'donor' && f.orgType.value === 'Supermarket' ? 'supermarket' : role,
          name: f.name.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim(), password: f.password.value,
          org: role === 'volunteer' ? 'Independent Volunteer' : f.org.value.trim(), orgType: role === 'volunteer' ? 'Two-wheeler' : f.orgType.value, location: f.location.value.trim()
        };
        const res = Store.register(data);
        if (res.error === 'exists') { showExists(); window.scrollTo(0, 0); return; }
        Store.setSession(res.user.id, true);
        UI.toast('Account created successfully. Welcome to RePlate!');
        location.hash = '#/app/dashboard';
      });
    }
  };
})();
