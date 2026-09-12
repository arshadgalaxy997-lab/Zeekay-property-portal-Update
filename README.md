# ZEEKAY Properties — Separate Client & Broker Portal

## Architecture
- React + Vite frontend
- Firebase Authentication for brokers/admin
- Firestore for properties, brokers and visit requests
- Firebase Storage for property photos
- Netlify/Firebase Hosting compatible SPA
- WhatsApp click-to-chat notification for visit requests

## User workflow
CLIENT:
Portal link → search approved inventory → property details → Book Visit → request saved in Firestore + WhatsApp message prepared.

BROKER:
Register/Login → Broker Dashboard → upload inventory/photos → status `pending` → Admin approves → listing becomes public.

ADMIN:
Admin Login → approve broker listings → view visit requests.

## Before production
1. Create Firebase project.
2. Enable Email/Password Authentication.
3. Create Firestore Database.
4. Enable Storage.
5. Add Firebase config to `.env`.
6. Set `VITE_WHATSAPP_NUMBER` to the official ZEEKAY WhatsApp Business number in international format without `+`.
7. Add proper Firestore/Storage Security Rules so only authenticated brokers can create their own inventory and only admin users can approve listings.
8. Deploy to Netlify using build command `npm run build` and publish directory `dist`.
9. Connect a custom subdomain such as `portal.zeekayproperties.pk`.
10. For true automated WhatsApp Business API notifications (without opening WhatsApp), connect Meta WhatsApp Cloud API or an approved BSP through a server-side function. The current prototype uses a WhatsApp click-to-chat fallback.

## Admin security
Do NOT make the frontend alone responsible for admin privileges. Production should use Firebase custom claims (`admin: true`) and Firestore/Storage security rules.

## Suggested Firestore collections
- `users` — role/profile
- `brokers` — broker profile
- `properties` — inventory
- `visits` — visit requests
- `settings` — WhatsApp number, office details, portal configuration
- `auditLogs` — approvals and changes

## Next build phase
- Proper admin custom claims
- Broker inventory management (edit/delete/status)
- Client visit calendar with available slots
- Office calendar/blocked dates
- Automated WhatsApp Cloud API templates
- Image gallery/reordering
- Property sharing cards
- Broker-wise inventory and leads
- Client CRM
- Dashboard analytics
- SEO/social preview pages
