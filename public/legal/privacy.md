# Privacy Policy

**Last updated:** 20 April 2026 · Effective immediately

This Privacy Policy explains how VoxSite collects, uses, stores and protects your personal data. We are committed to handling your data responsibly and in compliance with the EU General Data Protection Regulation (GDPR), the Polish Personal Data Protection Act, and the UK GDPR.

🇪🇺 **GDPR compliant · EU-hosted · Kraków, Poland**

---

## 1. Who we are

VoxSite is a construction snagging software platform operated by:

**Łukasz Biniecki Lbicon Projektowanie Konstrukcji**
ul. Unruga 65a, 30-394 Kraków, Poland
NIP: 7822124418
EU VAT: PL7822124418
Email: [sales@voxsite.app](mailto:sales@voxsite.app)
Website: [voxsite.app](https://voxsite.app)

VoxSite is our trade name. Łukasz Biniecki Lbicon Projektowanie Konstrukcji is the legal entity responsible for the service. Throughout this document "we", "us", "our" and "VoxSite" refer to this legal entity.

For data protection purposes:
- We act as **data controller** for account, billing, and usage data that identifies you as our customer.
- We act as **data processor** for the inspection data you enter into the platform (site visits, snag items, photos, voice notes). You — the customer — are the controller for that data.

Where you process personal data of third parties (for example, photos of a building site that incidentally include people) through VoxSite, you are the controller and we are your processor. A Data Processing Agreement (DPA) is available on request for business customers — contact [sales@voxsite.app](mailto:sales@voxsite.app).

---

## 2. What data we collect

We collect only what we need to provide the service.

**Account data**
- Name
- Email address
- Company name and details
- Password (hashed using bcrypt; never stored in readable form)
- Role (admin, member)

**Inspection data (the content you enter)**
- Projects, site visits, snag items
- Photos you upload (up to 4 per snag)
- Voice recordings you capture
- Automatic transcriptions of those recordings
- Custom report fields (weather, attendees, access notes, document reference, sign-off names)
- Company logo and branding colour (if uploaded)

**Billing data**
- Subscription plan, billing cycle, payment status
- Stripe customer ID
- Invoice history
- Payment card details: we **never store** card details. Stripe holds them on their PCI-compliant systems. We only receive a reference token.

**Usage data**
- Which pages and features you use, session duration
- Device type, browser type, approximate geographic region (country-level, derived from IP)
- Error logs and crash reports

**Communications**
- Emails you send to `sales@voxsite.app`
- Support tickets, if any

We do **not** collect:
- Special category data (health, racial/ethnic origin, political opinions, religious beliefs, biometric data for identification purposes, sexual orientation)
- Financial details beyond what Stripe needs for billing
- Photos of faces, signatures, or identity documents beyond anything you voluntarily upload

---

## 3. Photos and voice recordings — a note on third parties

Construction site photos may incidentally capture third parties — workers, visitors, passers-by. Voice recordings may mention third parties by name.

**You are responsible** for:
- Ensuring you have a lawful basis to record and photograph on site (typically your own legitimate interest as the inspector, the site operator's consent, or notices at site entrances)
- Informing data subjects where legally required
- Not uploading photos or recordings that you do not have the right to process

We will not process these photos or recordings for any purpose other than storing them for you, transcribing voice notes (see Section 5), and rendering your PDF reports.

If a third party contacts us directly about data concerning them that appears in your VoxSite account, we will refer them to you (as the controller) and may ask you to respond within 30 days.

---

## 4. How we use your data

We use your data solely to:

- Provide, maintain and improve the VoxSite platform
- Authenticate users and manage access to your company workspace
- Send transactional emails (account setup, team invites, payment confirmations, PDF report delivery, payment-failure notifications)
- Process subscription payments through Stripe
- Respond to your support requests
- Generate your PDF reports
- Transcribe voice recordings (see Section 5)
- Analyse aggregated, anonymised usage patterns to improve the product
- Detect and prevent abuse, fraud, and security incidents
- Comply with legal obligations (tax records, court orders, etc.)

We **never** sell your data. We **never** use your data to train AI models. We **never** share your inspection data with other customers.

---

## 5. Voice transcription — international transfer

VoxSite's core feature is automatic transcription of voice recordings into text. This requires processing by OpenAI.

**How it works:**
- You record a voice note in the app
- The audio is uploaded to our backend on Railway (servers located in the United States)
- Our backend forwards the audio to OpenAI's Whisper API for transcription
- OpenAI returns the text; we store the text on your snag record
- The audio file itself is retained by us only for the duration needed to transcribe it, then deleted

**International transfer disclosure:** OpenAI processes this audio on infrastructure that may be located in the United States. This constitutes a transfer of personal data outside the European Economic Area (EEA) and the United Kingdom.

We safeguard this transfer through:
- A Data Processing Agreement with OpenAI
- Standard Contractual Clauses (SCCs) approved by the European Commission
- OpenAI's published retention policy: audio inputs sent via the standard API tier are retained by OpenAI for up to 30 days for abuse monitoring purposes, then deleted. OpenAI does not use API inputs to train its models.

If you do not wish for voice data to be sent to OpenAI, **do not use the voice recording feature**. All other VoxSite features work without it — you can type defect descriptions manually.

Our backend hosting provider (Railway) is also located in the United States. Other personal data stored on your behalf (account info, photos, transcribed text, PDF reports) is held in Supabase in eu-west-1 (Ireland), within the EEA.

---

## 6. Legal basis for processing (GDPR Article 6)

We process your personal data on the following legal bases:

| Processing activity | Legal basis |
|---|---|
| Providing the service you subscribed to | **Contract performance** (Art. 6(1)(b)) |
| Transcription via OpenAI | **Contract performance** (Art. 6(1)(b)) |
| Payment processing | **Contract performance** + **legal obligation** (Polish tax law) |
| Fraud and abuse prevention | **Legitimate interest** (Art. 6(1)(f)) |
| Product improvement (aggregated, anonymised) | **Legitimate interest** (Art. 6(1)(f)) |
| Marketing emails (only to existing customers, opt-out always available) | **Legitimate interest** (Art. 6(1)(f)) |
| Legal record retention | **Legal obligation** (Art. 6(1)(c)) |

You can object to processing based on legitimate interest at any time (see Section 9).

---

## 7. Where your data is stored

| Data | Location | Provider |
|---|---|---|
| Database, authentication, files, photos | eu-west-1 (Ireland) | Supabase |
| Backend API servers | United States | Railway |
| Frontend / website | Global edge network | Vercel |
| Voice transcription | United States | OpenAI |
| Transactional email delivery | Ireland + US (Resend uses AWS SES `eu-west-1`) | Resend |
| Payment processing | Global (Ireland HQ for EU) | Stripe |

All data in transit is encrypted using TLS 1.2 or higher. All data at rest on Supabase is encrypted using AES-256.

Supabase, Railway, Vercel, Resend, OpenAI, and Stripe are each bound by a Data Processing Agreement with us, and each operates with their own appropriate safeguards for international transfers.

---

## 8. How long we keep your data

| Data | Retention |
|---|---|
| Active account data | For as long as your subscription is active |
| Inspection data (projects, snags, photos, recordings) | Retained during subscription; you may delete anytime via the app |
| Cancelled account | Deleted within 30 days of cancellation |
| Financial records (invoices, tax documentation) | 5 years after the end of the calendar year in which the sale occurred (Polish accounting law) |
| Encrypted backups | Rolling 30 days then purged |
| Voice audio files (on our servers) | Deleted automatically after transcription (within minutes) |
| Voice audio on OpenAI servers | Up to 30 days per OpenAI's retention policy |
| Usage logs and crash reports | 90 days |

You may delete individual projects, site visits, and snag items at any time using the app's delete functions. Deleting a project also deletes all associated photos from our storage within a best-effort cleanup window.

To request earlier deletion of all your personal data, contact [sales@voxsite.app](mailto:sales@voxsite.app). Note that we may be required to retain financial records for the statutory periods above.

---

## 9. Your rights under GDPR

If you are located in the EEA, the UK, or Switzerland, you have the following rights:

- **Right of access** — receive a copy of the personal data we hold about you
- **Right to rectification** — correct inaccurate or incomplete data
- **Right to erasure** ("right to be forgotten") — request deletion, subject to legal retention periods
- **Right to restriction** — require us to stop processing your data while a dispute is resolved
- **Right to portability** — receive your data in a machine-readable format (we provide JSON export on request)
- **Right to object** — object to processing based on legitimate interest
- **Right to withdraw consent** — where we process based on your consent, you can withdraw it at any time
- **Right not to be subject to solely automated decision-making** — VoxSite does not make automated decisions that produce legal effects about you

To exercise any right, email [sales@voxsite.app](mailto:sales@voxsite.app). We will respond within 30 days of a verifiable request.

You also have the right to lodge a complaint with your national data protection authority. In Poland this is:
**Prezes Urzędu Ochrony Danych Osobowych (UODO)**
ul. Stawki 2, 00-193 Warszawa
[uodo.gov.pl](https://uodo.gov.pl)

If you are in another EEA country or the UK, you can complain to your local authority instead.

---

## 10. Data processors (subprocessors)

We use the following third parties to operate VoxSite:

| Subprocessor | Purpose | Location | DPA |
|---|---|---|---|
| Supabase | Database, authentication, file storage | Ireland (eu-west-1) | Yes |
| Railway | Backend hosting | United States | Yes |
| Vercel | Frontend hosting | Global edge | Yes |
| Stripe | Payment processing | Ireland (EU HQ) | Yes |
| Resend | Transactional email | Ireland (EU-West) / US | Yes |
| OpenAI | Voice-to-text transcription | United States | Yes (with SCCs) |

All subprocessors are contractually obliged to process your data only on our instructions, maintain appropriate security, and assist us in responding to data-subject requests.

We will update this list if we add or change subprocessors. Material changes will be notified to account administrators by email at least 14 days in advance.

---

## 11. Cookies

VoxSite uses only **essential cookies**:

- **Authentication tokens** — keep you logged in (stored as JWT in your browser; required for the app to work)
- **Session preferences** — remember your UI choices (e.g. dark/light mode)

We do **not** use advertising cookies, cross-site tracking cookies, or third-party analytics trackers. We do not use Google Analytics, Facebook Pixel, or similar tools. We do not sell or share any cookie-derived data.

Because we only use essential cookies, no cookie-banner consent is legally required. If we ever add non-essential cookies in the future, we will present a consent banner and update this policy.

---

## 12. Security

We implement appropriate technical and organisational measures to protect your data:

- **Encryption in transit** — all API calls use HTTPS/TLS 1.2+
- **Encryption at rest** — AES-256 on Supabase-stored data, including photos
- **Password hashing** — bcrypt; passwords are never stored or transmitted in plain text
- **Row-level access control** — Supabase Row Level Security restricts each user to their own company's data
- **Webhook signature verification** — all Stripe webhook callbacks are cryptographically verified
- **Rate limiting** — on authentication endpoints and high-cost API routes
- **Principle of least privilege** — production database access is limited to the owner (one person)
- **No cross-tenant access** — each company's workspace is fully isolated at the database layer
- **Signed URLs with short expiry** — photos and PDF downloads use time-limited signed URLs (5 minutes default)

No system is perfect. If you discover a security issue, please report it responsibly to [sales@voxsite.app](mailto:sales@voxsite.app). We will acknowledge within 48 hours.

In the event of a personal-data breach affecting EEA/UK residents, we will notify the relevant supervisory authority within 72 hours where legally required, and notify affected customers without undue delay.

---

## 13. Children's privacy

VoxSite is a B2B tool for construction professionals. The service is not intended for individuals under the age of 16. We do not knowingly collect personal data from children. If you believe we have inadvertently collected data from a child, contact us immediately and we will delete it.

---

## 14. Changes to this policy

We may update this Privacy Policy from time to time. When we do:

- We will update the "Last updated" date at the top
- We will notify account administrators by email at least 14 days before material changes take effect
- We will summarise the key changes in the notification

Your continued use of VoxSite after changes take effect constitutes acceptance of the revised policy. If you do not agree, you may cancel your subscription under Section 10 of our [Terms of Service](/terms).

---

## 15. Contact us

For any privacy-related question, data subject request, or to request a Data Processing Agreement:

**Email:** [sales@voxsite.app](mailto:sales@voxsite.app)
**Post:** Łukasz Biniecki Lbicon Projektowanie Konstrukcji, ul. Unruga 65a, 30-394 Kraków, Poland

We respond to all privacy requests within 30 days as required by GDPR.

---

*This Privacy Policy is governed by Polish law and the EU General Data Protection Regulation.*

*© 2026 Łukasz Biniecki Lbicon Projektowanie Konstrukcji · VoxSite is a trade name of the above.*
