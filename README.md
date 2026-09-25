# RePlate – Food Redistribution Platform

A responsive, mobile-first web app (plain HTML, CSS and JavaScript, no frameworks) that connects surplus food donors with NGOs and volunteers.

## Run it

Double-click `index.html`, or serve the folder so it behaves like a real site:

```
python -m http.server 5173
```

Then open http://localhost:5173.

## Demo accounts (password: `demo123`)

| Role        | Email                   |
|-------------|-------------------------|
| Donor       | donor@replate.in        |
| NGO         | ngo@replate.in          |
| Volunteer   | volunteer@replate.in    |
| Supermarket | supermarket@replate.in  |
| Admin       | admin@replate.in        |

The login page also has one-click demo buttons. Data is saved in the browser's localStorage; use **Profile → Reset demo data** (or the footer link on the landing page) to restore the sample data.

## Donation lifecycle

`Pending → Accepted → Volunteer Assigned → Picked Up`

The volunteer confirms **Picked Up** by scanning the donor's QR code. There is no delivery tracking.

## Try the full flow

1. **Donor**: Donate Food → submit → status *Pending*.
2. **NGO**: Available Donations → Accept Donation → status *Accepted*.
3. **Volunteer**: Available Pickups → View Request → Accept Pickup (or Reject to pass it to another volunteer) → status *Volunteer Assigned*.
4. **Donor**: open the donation → the pickup QR is shown.
5. **Volunteer**: QR Verification → Scan QR → status *Picked Up*. Scan again to see "already used"; use "simulate scanning a wrong QR" for the invalid state.
6. **Supermarket**: Barcode Scanner → Add Product → expiry is checked, and expired items are blocked.

## Files

```
index.html               app shell
css/style.css            design tokens, components, responsive layouts
js/icons.js              inline SVG icon set
js/store.js              sample data, localStorage persistence, lifecycle actions
js/ui.js                 reusable components (badges, cards, tracker, QR, barcode, charts, modals, toasts)
js/app.js                hash router, role-based sidebar and bottom navigation
js/views-public.js       landing, login, register
js/views-donor.js        donor dashboard, donation form, my donations, details, tracking
js/views-ngo-volunteer.js NGO and volunteer screens, QR verification
js/views-supermarket.js  supermarket dashboard, packaged food form, barcode scanner, expiry alerts
js/views-common.js       history, notifications, profile, reports, component library
js/views-admin.js        admin dashboard, user management, pickup monitor
```
