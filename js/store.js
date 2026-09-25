/* RePlate – data layer: seed data, persistence (localStorage) and helpers */
(function () {
  const KEY = 'replate_state_v1';
  const SESSION_KEY = 'replate_session';

  /* ---------- date helpers ---------- */
  function at(dayOffset, h, m) {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    d.setHours(h || 0, m || 0, 0, 0);
    return d.toISOString();
  }
  /* YYYY-MM-DD in the user's local time zone */
  function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function dateOnly(dayOffset) {
    const d = new Date();
    d.setDate(d.getDate() + (dayOffset || 0));
    return ymd(d);
  }
  window.ymd = ymd;
  window.dateOnly = dateOnly;

  /* ---------- lookup tables ---------- */
  const STATUSES = ['Pending', 'Accepted', 'Volunteer Assigned', 'Picked Up'];
  const STATUS_META = {
    'Pending': { cls: 'pending', icon: 'hourglass' },
    'Accepted': { cls: 'accepted', icon: 'handHeart' },
    'Volunteer Assigned': { cls: 'assigned', icon: 'userCheck' },
    'Picked Up': { cls: 'picked', icon: 'checkCircle' },
    'Cancelled': { cls: 'cancelled', icon: 'ban' }
  };
  const CATEGORIES = ['Cooked Food', 'Packaged Food', 'Fruits & Vegetables', 'Bakery Items', 'Grocery Items', 'Other'];
  const CAT_META = {
    'Cooked Food': { icon: 'soup', tone: 'orange' },
    'Packaged Food': { icon: 'package', tone: 'blue' },
    'Fruits & Vegetables': { icon: 'carrot', tone: 'green' },
    'Bakery Items': { icon: 'cake', tone: 'wheat' },
    'Grocery Items': { icon: 'wheat', tone: 'sand' },
    'Other': { icon: 'utensils', tone: 'gray' }
  };
  const DONOR_TYPES = ['Restaurant', 'Hotel', 'Wedding Hall', 'Corporate Cafeteria', 'College Canteen', 'Bakery', 'Grocery Store', 'Supermarket', 'Fruit & Vegetable Vendor', 'Household / Event'];
  const NGO_TYPES = ['NGO', 'Orphanage', 'Old Age Home', 'Homeless Shelter', 'Community Kitchen', 'Disaster Relief Organization'];
  const ROLE_LABEL = { donor: 'Donor', ngo: 'NGO', volunteer: 'Volunteer', supermarket: 'Supermarket', admin: 'Administrator' };

  /* ---------- seed ---------- */
  function seed() {
    const users = [
      { id: 'u1', role: 'donor', name: 'Yashvi Patel', email: 'donor@replate.in', phone: '+91 98220 11234', password: 'demo123', org: 'Spice Garden Restaurant', orgType: 'Restaurant', location: 'Panaji, Goa', status: 'Active', joined: at(-210) },
      { id: 'u2', role: 'ngo', name: "Anita D'Souza", email: 'ngo@replate.in', phone: '+91 98500 22871', password: 'demo123', org: 'Hope Foundation', orgType: 'Orphanage', location: 'Mapusa, Goa', status: 'Active', joined: at(-300) },
      { id: 'u3', role: 'volunteer', name: 'Rahul Naik', email: 'volunteer@replate.in', phone: '+91 97640 55120', password: 'demo123', org: 'Independent Volunteer', orgType: 'Two-wheeler', location: 'Panaji, Goa', status: 'Active', joined: at(-150) },
      { id: 'u4', role: 'supermarket', name: 'Karan Mehta', email: 'supermarket@replate.in', phone: '+91 98811 40077', password: 'demo123', org: 'FreshMart Supermarket', orgType: 'Supermarket', location: 'Margao, Goa', status: 'Active', joined: at(-120) },
      { id: 'u5', role: 'admin', name: 'Platform Admin', email: 'admin@replate.in', phone: '+91 83200 00001', password: 'demo123', org: 'RePlate Operations', orgType: 'Administrator', location: 'Panaji, Goa', status: 'Active', joined: at(-400) },
      { id: 'u6', role: 'donor', name: 'Rohan Kamat', email: 'rohan@grandmandovi.in', phone: '+91 98230 71452', password: 'demo123', org: 'Hotel Grand Mandovi', orgType: 'Hotel', location: 'Panaji, Goa', status: 'Active', joined: at(-180) },
      { id: 'u7', role: 'donor', name: 'Sara Fernandes', email: 'events@royalorchid.in', phone: '+91 98221 60023', password: 'demo123', org: 'Royal Orchid Wedding Hall', orgType: 'Wedding Hall', location: 'Porvorim, Goa', status: 'Active', joined: at(-95) },
      { id: 'u8', role: 'donor', name: 'Nikhil Shet', email: 'orders@goldencrust.in', phone: '+91 97300 45521', password: 'demo123', org: 'Golden Crust Bakery', orgType: 'Bakery', location: 'Mapusa, Goa', status: 'Active', joined: at(-60) },
      { id: 'u9', role: 'donor', name: 'Farida Khan', email: 'farida@farmfresh.in', phone: '+91 90110 88342', password: 'demo123', org: 'Farm Fresh Vendors', orgType: 'Fruit & Vegetable Vendor', location: 'Margao, Goa', status: 'Active', joined: at(-40) },
      { id: 'u10', role: 'donor', name: 'Deepa Rao', email: 'canteen@sunrisecollege.in', phone: '+91 98602 11980', password: 'demo123', org: 'Sunrise College Canteen', orgType: 'College Canteen', location: 'Ponda, Goa', status: 'Active', joined: at(-75) },
      { id: 'u11', role: 'donor', name: 'Priya Sharma', email: 'priya.sharma@mail.com', phone: '+91 99220 30219', password: 'demo123', org: 'Household / Event', orgType: 'Household / Event', location: 'Calangute, Goa', status: 'Active', joined: at(-20) },
      { id: 'u12', role: 'ngo', name: 'Joseph Pereira', email: 'contact@greenlife.org', phone: '+91 98500 77310', password: 'demo123', org: 'Green Life Trust', orgType: 'Old Age Home', location: 'Panaji, Goa', status: 'Active', joined: at(-260) },
      { id: 'u13', role: 'ngo', name: 'Leena Gaonkar', email: 'hello@communitykitchen.org', phone: '+91 97655 10882', password: 'demo123', org: 'Community Kitchen Goa', orgType: 'Community Kitchen', location: 'Margao, Goa', status: 'Active', joined: at(-230) },
      { id: 'u14', role: 'ngo', name: 'Ajay Verma', email: 'care@safehaven.org', phone: '+91 98909 44120', password: 'demo123', org: 'Safe Haven Shelter', orgType: 'Homeless Shelter', location: 'Vasco, Goa', status: 'Active', joined: at(-140) },
      { id: 'u15', role: 'volunteer', name: 'Sneha Kamat', email: 'sneha.k@mail.com', phone: '+91 91580 22119', password: 'demo123', org: 'Independent Volunteer', orgType: 'Scooter', location: 'Mapusa, Goa', status: 'Active', joined: at(-110) },
      { id: 'u16', role: 'volunteer', name: 'Arjun Desai', email: 'arjun.d@mail.com', phone: '+91 97301 66420', password: 'demo123', org: 'NSS Volunteer Unit', orgType: 'Car', location: 'Margao, Goa', status: 'Active', joined: at(-90) },
      { id: 'u17', role: 'volunteer', name: 'Meera Pai', email: 'meera.p@mail.com', phone: '+91 98231 99012', password: 'demo123', org: 'Independent Volunteer', orgType: 'Scooter', location: 'Panaji, Goa', status: 'Suspended', joined: at(-30) }
    ];

    const U = id => users.find(u => u.id === id);
    let n = 1048;
    function don(o) {
      const donor = U(o.donorId);
      const ngo = o.ngoId ? U(o.ngoId) : null;
      const vol = o.volunteerId ? U(o.volunteerId) : null;
      const created = o.created;
      const hist = [{ status: 'Pending', at: created }];
      const idx = STATUSES.indexOf(o.status);
      const steps = [2, 3.5, 5.5];
      for (let i = 1; i <= idx; i++) hist.push({ status: STATUSES[i], at: new Date(new Date(created).getTime() + steps[i - 1] * 3600e3).toISOString() });
      const id = 'RP-' + (n--);
      return Object.assign({
        id, donorId: donor.id, donorName: donor.org, donorType: donor.orgType, contact: donor.phone,
        location: donor.location, address: o.address || '', type: 'Veg', notes: '',
        ngoId: ngo ? ngo.id : null, ngoName: ngo ? ngo.org : null,
        volunteerId: vol ? vol.id : null, volunteerName: vol ? vol.name : null,
        qrCode: 'RPQR-' + id.slice(3) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
        qrUsed: o.status === 'Picked Up', declinedBy: [], ngoDeclined: [], image: null,
        history: hist, verifiedAt: o.status === 'Picked Up' ? hist[hist.length - 1].at : null
      }, o, { id, history: hist });
    }

    const donations = [
      don({ food: 'Veg Biryani & Dal Tadka', category: 'Cooked Food', quantity: '12 kg', servings: 50, donorId: 'u1', address: '18th June Road', created: at(0, 9, 40), prepared: at(0, 8, 0), safeUntil: at(0, 20, 0), pickupDate: dateOnly(0), pickupTime: '14:00', status: 'Pending', distance: 2.4, notes: 'Packed in 5 steel containers. Please bring carry bags.' }),
      don({ food: 'Assorted Bread & Buns', category: 'Bakery Items', quantity: '60 pieces', servings: 40, donorId: 'u8', address: 'Market Road', created: at(0, 8, 15), prepared: at(-1, 22, 0), safeUntil: at(1, 18, 0), pickupDate: dateOnly(0), pickupTime: '16:30', status: 'Pending', distance: 1.2 }),
      don({ food: 'Hotel Breakfast Buffet (Idli, Poha, Upma)', category: 'Cooked Food', quantity: '8 kg', servings: 35, donorId: 'u6', address: 'D.B. Marg', created: at(0, 11, 5), prepared: at(0, 7, 0), safeUntil: at(0, 19, 0), pickupDate: dateOnly(0), pickupTime: '13:30', status: 'Pending', distance: 3.1 }),
      don({ food: 'Paneer Curry, Jeera Rice & Rotis', category: 'Cooked Food', quantity: '30 kg', servings: 120, donorId: 'u7', address: 'NH-66 Highway', created: at(0, 7, 30), prepared: at(-1, 23, 0), safeUntil: at(0, 21, 0), pickupDate: dateOnly(0), pickupTime: '15:00', status: 'Accepted', ngoId: 'u2', distance: 4.6, notes: 'Wedding reception surplus. Kept refrigerated overnight.' }),
      don({ food: 'Fresh Vegetables (Tomato, Spinach, Carrot)', category: 'Fruits & Vegetables', quantity: '25 kg', servings: 80, donorId: 'u9', address: 'New Market', created: at(0, 6, 50), prepared: at(0, 6, 0), safeUntil: at(2, 18, 0), pickupDate: dateOnly(0), pickupTime: '17:00', status: 'Accepted', ngoId: 'u13', distance: 5.8 }),
      don({ food: 'Chapati & Mixed Veg Sabzi', category: 'Cooked Food', quantity: '10 kg', servings: 45, donorId: 'u1', address: '18th June Road', created: at(0, 8, 20), prepared: at(0, 7, 30), safeUntil: at(0, 18, 30), pickupDate: dateOnly(0), pickupTime: '12:30', status: 'Volunteer Assigned', ngoId: 'u2', volunteerId: 'u3', distance: 2.4 }),
      don({ food: 'Biscuits & Fruit Juice Packs', category: 'Packaged Food', quantity: '48 units', servings: 48, donorId: 'u4', address: 'Station Road', created: at(-1, 17, 10), prepared: at(-30), safeUntil: at(4, 23, 0), pickupDate: dateOnly(0), pickupTime: '11:00', status: 'Volunteer Assigned', ngoId: 'u2', volunteerId: 'u3', distance: 6.2, barcode: '8901063010328', expiry: dateOnly(4), productDetails: 'Parle-G 200g & Real Mixed Fruit 200ml' }),
      don({ food: 'Seasonal Fruit Platter', category: 'Fruits & Vegetables', quantity: '6 kg', servings: 30, donorId: 'u1', address: '18th June Road', created: at(-1, 10, 0), prepared: at(-1, 9, 0), safeUntil: at(-1, 20, 0), pickupDate: dateOnly(-1), pickupTime: '13:00', status: 'Picked Up', ngoId: 'u13', volunteerId: 'u3', distance: 2.4 }),
      don({ food: 'Wedding Buffet (Pulao, Dal, Sweets)', category: 'Cooked Food', quantity: '40 kg', servings: 160, donorId: 'u7', address: 'NH-66 Highway', created: at(-2, 23, 0), prepared: at(-2, 19, 0), safeUntil: at(-1, 10, 0), pickupDate: dateOnly(-1), pickupTime: '00:30', status: 'Picked Up', ngoId: 'u14', volunteerId: 'u16', distance: 4.6 }),
      don({ food: 'Canteen Lunch Meals', category: 'Cooked Food', quantity: '14 kg', servings: 60, donorId: 'u10', address: 'College Road', created: at(-3, 14, 30), prepared: at(-3, 11, 0), safeUntil: at(-3, 21, 0), pickupDate: dateOnly(-3), pickupTime: '16:00', status: 'Picked Up', ngoId: 'u12', volunteerId: 'u15', distance: 7.4 }),
      don({ food: 'Milk & Curd Packs', category: 'Packaged Food', quantity: '36 units', servings: 36, donorId: 'u4', address: 'Station Road', created: at(-4, 9, 0), prepared: at(-5), safeUntil: at(-2), pickupDate: dateOnly(-4), pickupTime: '12:00', status: 'Picked Up', ngoId: 'u13', volunteerId: 'u16', distance: 6.2, barcode: '8901262150118', expiry: dateOnly(-2) }),
      don({ food: 'Instant Noodles & Pasta', category: 'Packaged Food', quantity: '72 units', servings: 72, donorId: 'u4', address: 'Station Road', created: at(0, 10, 10), prepared: at(-90), safeUntil: at(6, 23, 0), pickupDate: dateOnly(1), pickupTime: '10:30', status: 'Pending', distance: 6.2, barcode: '8901058851298', expiry: dateOnly(6) }),
      don({ food: 'Dal Makhani & Jeera Rice', category: 'Cooked Food', quantity: '9 kg', servings: 38, donorId: 'u1', address: '18th June Road', created: at(-5, 13, 0), prepared: at(-5, 11, 0), safeUntil: at(-5, 21, 0), pickupDate: dateOnly(-5), pickupTime: '15:30', status: 'Picked Up', ngoId: 'u2', volunteerId: 'u15', distance: 2.4 }),
      don({ food: 'Party Snacks (Samosa, Sandwiches)', category: 'Other', quantity: '5 kg', servings: 25, donorId: 'u11', address: 'Beach Road', created: at(0, 12, 0), prepared: at(0, 10, 0), safeUntil: at(0, 22, 0), pickupDate: dateOnly(0), pickupTime: '18:00', status: 'Pending', distance: 8.1 }),
      don({ food: 'Rice, Wheat Flour & Pulses', category: 'Grocery Items', quantity: '50 kg', servings: 200, donorId: 'u1', address: '18th June Road', created: at(-8, 10, 0), prepared: at(-8), safeUntil: at(60), pickupDate: dateOnly(-7), pickupTime: '11:00', status: 'Picked Up', ngoId: 'u12', volunteerId: 'u3', distance: 2.4 }),
      don({ food: 'Veg Pulao & Raita', category: 'Cooked Food', quantity: '7 kg', servings: 30, donorId: 'u1', address: '18th June Road', created: at(-1, 19, 0), prepared: at(-1, 17, 0), safeUntil: at(0, 23, 0), pickupDate: dateOnly(0), pickupTime: '19:30', status: 'Accepted', ngoId: 'u2', distance: 2.4 })
    ];

    const inventory = [
      { barcode: '8901063010328', name: 'Parle-G Biscuits 200g', brand: 'Parle', category: 'Snacks', qty: 24, mfg: dateOnly(-150), expiry: dateOnly(4), storage: 'Room temperature' },
      { barcode: '8901262150118', name: 'Toned Milk 500ml', brand: 'Amul', category: 'Dairy', qty: 18, mfg: dateOnly(-3), expiry: dateOnly(1), storage: 'Refrigerated (2–4°C)' },
      { barcode: '8901058851298', name: 'Masala Instant Noodles 70g', brand: 'Maggi', category: 'Ready-to-eat', qty: 40, mfg: dateOnly(-240), expiry: dateOnly(6), storage: 'Room temperature' },
      { barcode: '8906002450012', name: 'Whole Wheat Bread 400g', brand: 'Harvest Gold', category: 'Bakery', qty: 15, mfg: dateOnly(-2), expiry: dateOnly(2), storage: 'Cool, dry place' },
      { barcode: '8901725121129', name: 'Mixed Fruit Juice 1L', brand: 'Real', category: 'Beverages', qty: 20, mfg: dateOnly(-170), expiry: dateOnly(5), storage: 'Room temperature' },
      { barcode: '8901030703419', name: 'Fresh Paneer 200g', brand: 'Gowardhan', category: 'Dairy', qty: 12, mfg: dateOnly(-5), expiry: dateOnly(-1), storage: 'Refrigerated (2–4°C)' },
      { barcode: '8904004400311', name: 'Plain Curd 400g', brand: 'Mother Dairy', category: 'Dairy', qty: 16, mfg: dateOnly(-6), expiry: dateOnly(3), storage: 'Refrigerated (2–4°C)' },
      { barcode: '8901491101837', name: 'Tomato Ketchup 500g', brand: 'Kissan', category: 'Condiments', qty: 10, mfg: dateOnly(-300), expiry: dateOnly(45), storage: 'Room temperature' },
      { barcode: '8901207004537', name: 'Basmati Rice 1kg', brand: 'India Gate', category: 'Staples', qty: 30, mfg: dateOnly(-60), expiry: dateOnly(240), storage: 'Cool, dry place' },
      { barcode: '8901725181840', name: 'Cheese Slices 200g', brand: 'Britannia', category: 'Dairy', qty: 14, mfg: dateOnly(-80), expiry: dateOnly(7), storage: 'Refrigerated (2–4°C)' },
      { barcode: '8906010341129', name: 'Ready-to-eat Dal Makhani', brand: 'MTR', category: 'Ready-to-eat', qty: 22, mfg: dateOnly(-340), expiry: dateOnly(2), storage: 'Room temperature' },
      { barcode: '8901396390114', name: 'Corn Flakes 475g', brand: "Kellogg's", category: 'Breakfast', qty: 9, mfg: dateOnly(-200), expiry: dateOnly(25), storage: 'Cool, dry place' },
      { barcode: '8902080011117', name: 'Salted Butter 100g', brand: 'Amul', category: 'Dairy', qty: 20, mfg: dateOnly(-100), expiry: dateOnly(-3), storage: 'Refrigerated (2–4°C)' },
      { barcode: '8901138511555', name: 'Oats 1kg', brand: 'Saffola', category: 'Breakfast', qty: 12, mfg: dateOnly(-120), expiry: dateOnly(6), storage: 'Cool, dry place' },
      { barcode: '8901233020051', name: 'Fruit Yoghurt 100g', brand: 'Epigamia', category: 'Dairy', qty: 28, mfg: dateOnly(-10), expiry: dateOnly(1), storage: 'Refrigerated (2–4°C)' },
      { barcode: '8901719110115', name: 'Chocolate Cake Slices', brand: 'Britannia', category: 'Bakery', qty: 18, mfg: dateOnly(-25), expiry: dateOnly(3), storage: 'Room temperature' },
      { barcode: '8901764012310', name: 'Soft Drink Cans 300ml', brand: 'Local Brew', category: 'Beverages', qty: 24, mfg: dateOnly(-120), expiry: dateOnly(90), storage: 'Room temperature' },
      { barcode: '8906001234567', name: 'Frozen Green Peas 500g', brand: 'Safal', category: 'Frozen', qty: 11, mfg: dateOnly(-60), expiry: dateOnly(5), storage: 'Frozen (−18°C)' }
    ];

    const notifications = [
      // donor u1
      nf('u1', 'donation', 'Donation submitted', 'Your donation RP-1048 (Veg Biryani & Dal Tadka) is now live for NGOs.', at(0, 9, 41), '#/app/donation/RP-1048'),
      nf('u1', 'volunteer', 'Volunteer assigned', 'Rahul Naik will pick up RP-1043 at 12:30 PM today. Keep the pickup QR ready.', at(0, 10, 5), '#/app/donation/RP-1043'),
      nf('u1', 'accepted', 'NGO accepted your donation', 'Hope Foundation accepted RP-1033 (Veg Pulao & Raita).', at(-1, 21, 0), '#/app/donation/RP-1033', true),
      nf('u1', 'picked', 'Food picked up', 'RP-1041 was picked up and verified via QR. Thank you for sharing!', at(-1, 14, 0), '#/app/donation/RP-1041', true),
      // ngo u2
      nf('u2', 'new', 'New donation available', 'Spice Garden Restaurant listed 50 servings of Veg Biryani, 2.4 km away.', at(0, 9, 42), '#/app/accept/RP-1048'),
      nf('u2', 'new', 'New donation available', 'Golden Crust Bakery listed 60 pieces of bread & buns, 1.2 km away.', at(0, 8, 16), '#/app/accept/RP-1047'),
      nf('u2', 'volunteer', 'Volunteer assigned', 'Rahul Naik accepted pickup for RP-1043.', at(0, 10, 5), '#/app/donation/RP-1043'),
      nf('u2', 'accepted', 'Donation accepted', 'You accepted RP-1045 (Paneer Curry, Jeera Rice & Rotis). Finding a volunteer.', at(0, 9, 30), '#/app/donation/RP-1045', true),
      // volunteer u3
      nf('u3', 'request', 'New pickup request', 'RP-1045: 120 servings from Royal Orchid Wedding Hall → Hope Foundation.', at(0, 9, 31), '#/app/request/RP-1045'),
      nf('u3', 'reminder', 'Pickup reminder', 'RP-1042 pickup at FreshMart Supermarket is scheduled for 11:00 AM.', at(0, 9, 0), '#/app/verify/RP-1042'),
      nf('u3', 'volunteer', 'Pickup accepted', 'You accepted pickup RP-1043 from Spice Garden Restaurant.', at(0, 10, 5), '#/app/verify/RP-1043', true),
      // supermarket u4
      nf('u4', 'expiry', 'Products expiring soon', 'Several products expire within 7 days. Consider donating them through RePlate.', at(0, 8, 0), '#/app/expiry'),
      nf('u4', 'donation', 'Donation submitted', 'RP-1037 (Instant Noodles & Pasta) is now visible to NGOs.', at(0, 10, 11), '#/app/donation/RP-1037'),
      nf('u4', 'picked', 'Pickup update', 'Volunteer Rahul Naik is assigned to RP-1042. Pickup at 11:00 AM.', at(-1, 18, 0), '#/app/donation/RP-1042', true),
      // admin u5
      nf('u5', 'users', 'New registrations', '3 new users registered today (2 donors, 1 volunteer).', at(0, 9, 0), '#/app/users'),
      nf('u5', 'alert', 'Volunteer search running long', 'RP-1044 has been waiting for a volunteer for over 3 hours.', at(0, 10, 30), '#/app/monitor'),
      nf('u5', 'report', 'Weekly report ready', 'Last week: 64 donations, 2,140 servings redistributed.', at(-1, 8, 0), '#/app/reports', true)
    ];

    return { users, donations, inventory, notifications, nextId: 1049, scanCursor: 0 };
  }

  function nf(to, type, title, text, time, link, read) {
    return { id: 'n' + Math.random().toString(36).slice(2, 9), to, type, title, text, time, link: link || '', read: !!read };
  }

  /* ---------- persistence ---------- */
  let state;
  function load() {
    try { state = JSON.parse(localStorage.getItem(KEY)); } catch (e) { state = null; }
    if (!state || !state.users) { state = seed(); save(); }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { console.warn('Could not save RePlate state', e); }
  }
  function reset() { state = seed(); save(); }

  /* ---------- session ---------- */
  function getSession() {
    let s = null;
    try { s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY)); } catch (e) {}
    return s;
  }
  function setSession(userId, remember) {
    const s = JSON.stringify({ userId });
    try {
      sessionStorage.setItem(SESSION_KEY, s);
      if (remember) localStorage.setItem(SESSION_KEY, s); else localStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  }
  function clearSession() {
    try { sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(SESSION_KEY); } catch (e) {}
  }
  function currentUser() {
    const s = getSession();
    return s ? state.users.find(u => u.id === s.userId) || null : null;
  }

  /* ---------- queries ---------- */
  const Store = {
    STATUSES, STATUS_META, CATEGORIES, CAT_META, DONOR_TYPES, NGO_TYPES, ROLE_LABEL,
    get state() { return state; },
    load, save, reset, setSession, clearSession, currentUser,
    user: id => state.users.find(u => u.id === id),
    userByEmail: email => state.users.find(u => u.email.toLowerCase() === String(email).trim().toLowerCase()),
    donation: id => state.donations.find(d => d.id === id),
    donations: () => state.donations.slice().sort((a, b) => new Date(b.created) - new Date(a.created)),
    notificationsFor: uid => state.notifications.filter(n => n.to === uid).sort((a, b) => new Date(b.time) - new Date(a.time)),
    unreadCount: uid => state.notifications.filter(n => n.to === uid && !n.read).length,

    notify(to, type, title, text, link) {
      state.notifications.push(nf(to, type, title, text, new Date().toISOString(), link));
    },
    notifyRole(role, type, title, text, link) {
      state.users.filter(u => u.role === role && u.status === 'Active').forEach(u => Store.notify(u.id, type, title, text, link));
    },

    register(data) {
      if (Store.userByEmail(data.email)) return { error: 'exists' };
      const u = Object.assign({ id: 'u' + Date.now(), status: 'Active', joined: new Date().toISOString() }, data);
      state.users.push(u);
      Store.notify(u.id, 'welcome', 'Welcome to RePlate', 'Your ' + ROLE_LABEL[u.role] + ' account is ready. Together we can reduce food waste.', '#/app/dashboard');
      save();
      return { user: u };
    },

    createDonation(data, donor) {
      const id = 'RP-' + (state.nextId++);
      const now = new Date().toISOString();
      const d = Object.assign({
        id, donorId: donor.id, donorName: donor.org || donor.name, donorType: donor.orgType,
        status: 'Pending', created: now, history: [{ status: 'Pending', at: now }],
        ngoId: null, ngoName: null, volunteerId: null, volunteerName: null,
        qrCode: 'RPQR-' + id.slice(3) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
        qrUsed: false, declinedBy: [], ngoDeclined: [], distance: +(1 + Math.random() * 7).toFixed(1)
      }, data);
      state.donations.push(d);
      Store.notify(donor.id, 'donation', 'Donation submitted', id + ' (' + d.food + ') is now visible to NGOs.', '#/app/donation/' + id);
      Store.notifyRole('ngo', 'new', 'New donation available', d.donorName + ' listed ' + d.servings + ' servings of ' + d.food + '.', '#/app/accept/' + id);
      save();
      return d;
    },

    updateDonation(id, patch) {
      const d = Store.donation(id);
      Object.assign(d, patch);
      save();
      return d;
    },

    setStatus(d, status) {
      d.status = status;
      d.history = d.history.filter(h => h.status !== status);
      d.history.push({ status, at: new Date().toISOString() });
    },

    ngoAccept(id, ngo) {
      const d = Store.donation(id);
      if (!d || d.status !== 'Pending') return null;
      d.ngoId = ngo.id; d.ngoName = ngo.org;
      Store.setStatus(d, 'Accepted');
      Store.notify(d.donorId, 'accepted', 'NGO accepted your donation', ngo.org + ' accepted ' + d.id + ' (' + d.food + ').', '#/app/donation/' + d.id);
      Store.notify(ngo.id, 'accepted', 'Donation accepted', 'You accepted ' + d.id + '. Finding a volunteer for pickup.', '#/app/donation/' + d.id);
      Store.notifyRole('volunteer', 'request', 'New pickup request', d.id + ': ' + d.servings + ' servings from ' + d.donorName + ' → ' + ngo.org + '.', '#/app/request/' + d.id);
      save();
      return d;
    },
    ngoDecline(id, ngo) {
      const d = Store.donation(id);
      d.ngoDeclined = d.ngoDeclined || [];
      if (!d.ngoDeclined.includes(ngo.id)) d.ngoDeclined.push(ngo.id);
      save();
    },
    volunteerAccept(id, vol) {
      const d = Store.donation(id);
      if (!d || d.status !== 'Accepted') return null;
      d.volunteerId = vol.id; d.volunteerName = vol.name;
      Store.setStatus(d, 'Volunteer Assigned');
      Store.notify(d.donorId, 'volunteer', 'Volunteer assigned', vol.name + ' will pick up ' + d.id + '. Keep the pickup QR ready.', '#/app/donation/' + d.id);
      if (d.ngoId) Store.notify(d.ngoId, 'volunteer', 'Volunteer assigned', vol.name + ' accepted pickup for ' + d.id + '.', '#/app/donation/' + d.id);
      Store.notify(vol.id, 'volunteer', 'Pickup accepted', 'You accepted pickup ' + d.id + ' from ' + d.donorName + '.', '#/app/verify/' + d.id);
      save();
      return d;
    },
    volunteerReject(id, vol) {
      const d = Store.donation(id);
      if (!d.declinedBy.includes(vol.id)) d.declinedBy.push(vol.id);
      const next = state.users.find(u => u.role === 'volunteer' && u.status === 'Active' && !d.declinedBy.includes(u.id));
      if (next) Store.notify(next.id, 'request', 'New pickup request', d.id + ': ' + d.servings + ' servings from ' + d.donorName + '.', '#/app/request/' + d.id);
      save();
      return next;
    },
    verifyQR(id, code, vol) {
      const d = Store.donation(id);
      if (!d) return 'invalid';
      if (code !== d.qrCode) return 'invalid';
      if (d.qrUsed) return 'used';
      d.qrUsed = true; d.verifiedAt = new Date().toISOString();
      Store.setStatus(d, 'Picked Up');
      Store.notify(d.donorId, 'picked', 'Food picked up', d.id + ' was picked up by ' + vol.name + ' and verified via QR.', '#/app/donation/' + d.id);
      if (d.ngoId) Store.notify(d.ngoId, 'picked', 'Pickup confirmed', vol.name + ' collected ' + d.id + ' (' + d.food + ') for your organization.', '#/app/donation/' + d.id);
      save();
      return 'ok';
    },

    lookupBarcode(code) {
      return state.inventory.find(p => p.barcode === String(code).trim()) || null;
    }
  };

  /* ---------- formatting ---------- */
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const Fmt = {
    date(iso) { if (!iso) return '—'; const d = new Date(iso); return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); },
    time(iso) { if (!iso) return '—'; const d = new Date(iso); return Fmt.hm(d.getHours(), d.getMinutes()); },
    hm(h, m) { const ap = h >= 12 ? 'PM' : 'AM'; const hh = h % 12 || 12; return hh + ':' + String(m).padStart(2, '0') + ' ' + ap; },
    t24(str) { if (!str) return '—'; const [h, m] = str.split(':').map(Number); return Fmt.hm(h, m); },
    dateTime(iso) { return iso ? Fmt.date(iso) + ', ' + Fmt.time(iso) : '—'; },
    pickup(d) {
      if (!d.pickupDate) return '—';
      const today = dateOnly(0);
      const tmr = dateOnly(1);
      const day = d.pickupDate === today ? 'Today' : d.pickupDate === tmr ? 'Tomorrow' : Fmt.date(d.pickupDate);
      return day + ', ' + Fmt.t24(d.pickupTime);
    },
    rel(iso) {
      const s = (Date.now() - new Date(iso).getTime()) / 1000;
      if (s < 60) return 'Just now';
      if (s < 3600) return Math.floor(s / 60) + ' min ago';
      if (s < 86400) return Math.floor(s / 3600) + ' hr ago';
      if (s < 172800) return 'Yesterday';
      return Fmt.date(iso);
    },
    num(n) { return Number(n).toLocaleString('en-IN'); },
    initials(name) { return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase(); },
    esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  };

  /* expiry: safe (>7 days), soon (0..7 days), expired (<0) */
  function expiryInfo(dateStr) {
    if (!dateStr) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const e = new Date(dateStr); e.setHours(0, 0, 0, 0);
    const days = Math.round((e - today) / 864e5);
    if (days < 0) return { key: 'expired', label: 'Expired', days, text: 'Expired – Cannot be donated' };
    if (days <= 7) return { key: 'soon', label: 'Expiring Soon', days, text: days === 0 ? 'Expires today' : 'Expires soon' };
    return { key: 'safe', label: 'Safe', days, text: 'Valid' };
  }

  Store.load();
  window.Store = Store;
  window.Fmt = Fmt;
  window.expiryInfo = expiryInfo;
})();
