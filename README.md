# Dr. Simonini Concierge CFO Dashboard

A manual-entry React/Vite dashboard for planning the launch of Dr. Simonini's annual concierge membership practice.

## Run locally

```bash
npm install
npm run dev
```

## Included

- Fixed tier model from the provided pricing page
- Executive overview KPIs
- Lead funnel and expected revenue
- Tier economics and sensitivity controls
- 24-month base/upside/downside forecast
- Capacity and service-load indicators
- Action dashboard
- JSON export/import and CSV lead import/export

## Sandbox CRM features

- CRM-style navigation with separate Overview, Members, Leads, and member-detail pages
- Billing workspace with invoice worklist, failed/overdue status tracking, one-time charges, and payment-source health
- Plans workspace with tier capacity, future plan changes, enrollment/eligibility queue, and admin placeholders
- Practice Pulse alerts for incomplete enrollments, card-on-file issues, overdue invoices, and scheduled changes
- Manually add leads with name, phone, address, source, and referral details
- Manually add members with active/inactive status
- Open each member page from the Members directory
- View a one-card member summary with name, phone, address, email, point of contact, and active/inactive status
- Edit member profiles, tiers, start dates, renewal dates, contact details, and point-of-contact details
- Track member activity history
- Upload document metadata for consent forms, membership agreements, payment authorizations, and other files
- Track card-on-file status using processor, token/reference, last four digits, expiration, and billing ZIP
- Manage each member's care team by provider specialty, first/last name, phone, email, and address

This is a sandbox planning app with client-side data only. Do not store full credit card numbers, clinical notes, diagnoses, insurance details, or other regulated sensitive information in this version.
