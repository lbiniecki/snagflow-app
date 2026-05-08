# Data Processing Agreement

**Last updated:** 8 May 2026 · Effective immediately

This Data Processing Agreement ("DPA") forms part of, and is incorporated into, the VoxSite Terms of Service ("Terms") between you (the "Customer", "Controller") and Łukasz Biniecki Lbicon Projektowanie Konstrukcji ("VoxSite", "Processor", "we", "us"). It governs the processing of personal data carried out by VoxSite on behalf of the Customer in connection with the Services.

This DPA applies whenever the Customer's use of the Services involves the processing of personal data of identified or identifiable natural persons (for example, names of attendees on a site visit, voice notes mentioning third parties by name, or photographs in which individuals are visible). It is designed to satisfy the requirements of Article 28 of the EU General Data Protection Regulation (Regulation (EU) 2016/679, "GDPR") and the equivalent provisions of the UK GDPR.

By accepting the Terms, the Customer accepts this DPA. No separate signature is required. A countersigned PDF version is available on request from sales@voxsite.app for Customer compliance records.

## 1. Definitions

Capitalised terms not defined here have the meanings given to them in the Terms or, where applicable, in the GDPR.

- **Controller**, **Processor**, **Subprocessor**, **Personal Data**, **Processing**, **Data Subject**, **Personal Data Breach**, and **Special Category Data** have the meanings given in Article 4 of the GDPR.
- **Customer Personal Data** means Personal Data processed by VoxSite on behalf of the Customer under this DPA.
- **Data Protection Laws** means the GDPR, the UK GDPR, the Polish Personal Data Protection Act, and any other data protection laws applicable to the Processing of Personal Data under this DPA.
- **Standard Contractual Clauses** ("SCCs") means the clauses approved by the European Commission in Implementing Decision (EU) 2021/914 of 4 June 2021, as updated from time to time.
- **UK Addendum** means the International Data Transfer Addendum to the EU Commission Standard Contractual Clauses issued by the UK Information Commissioner's Office.

## 2. Subject matter and roles

**2.1 Roles.** With respect to Customer Personal Data, the Customer acts as Controller and VoxSite acts as Processor. Where the Customer is itself a processor acting on behalf of its own customer or another controller, VoxSite acts as a sub-processor; the obligations in this DPA apply equally in that scenario.

**2.2 Customer's own data.** Separately, VoxSite is the Controller of Personal Data it collects directly to operate its business — for example, account-holder name and email, billing data, and usage logs. That processing is governed by VoxSite's Privacy Policy, not by this DPA.

**2.3 Subject matter.** The subject matter of the Processing is the provision of the Services as described in the Terms.

**2.4 Duration.** Processing under this DPA continues for the term of the Customer's subscription and any post-termination period during which Customer Personal Data is retained in accordance with Section 10 below.

**2.5 Nature and purpose of Processing.** Storage, transmission, transcription (where the Customer uses the voice-note feature), rendering of PDF reports, and any other processing necessary to provide the Services as instructed by the Customer.

**2.6 Categories of Data Subjects.** Persons whose Personal Data the Customer chooses to upload to or generate within the Services, which may include: the Customer's own employees and contractors using the Services; persons named or depicted in inspection content (site workers, contractors, visitors, building occupants, third parties incidentally captured in photographs or voice recordings).

**2.7 Categories of Personal Data.**

- Identification data (names, email addresses) of the Customer's users
- Inspection content created by the Customer's users (project descriptions, snag descriptions, locations, weather, attendees, access notes, sign-off names)
- Photographs uploaded by the Customer's users, which may incidentally include images of identifiable individuals
- Voice recordings uploaded by the Customer's users, which may include audible references to identifiable individuals
- Text transcriptions of the above voice recordings

**2.8 Special Category Data.** The Services are not designed to process Special Category Data. The Customer agrees not to use the Services to deliberately process such data. VoxSite cannot prevent Special Category Data from being incidentally captured in photographs or voice recordings; the Customer remains responsible for assessing and lawfully managing such incidental processing.

## 3. Customer's instructions

**3.1 Documented instructions.** VoxSite shall process Customer Personal Data only on the documented instructions of the Customer, except where required to do so by Union or Member State law to which VoxSite is subject.

**3.2 Sources of instructions.** The Customer's instructions are set out in:

- The Terms and this DPA
- The configuration choices the Customer makes within the Services (e.g. choosing to use the voice-note feature, deciding which projects to create, who to invite to the workspace)
- Any further written instructions issued by the Customer under this DPA

**3.3 Notice of unlawful instructions.** VoxSite shall inform the Customer if, in its opinion, an instruction infringes Data Protection Laws. VoxSite is not obliged to act on any instruction it considers unlawful, and may suspend processing pending clarification.

**3.4 Customer warranty.** The Customer warrants that it has, and will maintain throughout the term, all necessary lawful bases (under Article 6 GDPR and where applicable Article 9 GDPR), permissions, notices, and consents to enable VoxSite's lawful Processing of Customer Personal Data on the Customer's behalf.

## 4. Confidentiality

**4.1 Personnel.** VoxSite shall ensure that any person authorised to process Customer Personal Data is bound by an appropriate obligation of confidentiality, whether by contract or statutory duty. Access is limited on a strict need-to-know basis. As of the last update of this DPA, the only natural person with administrative access to production data is the controller of the legal entity identified above.

**4.2 No disclosure.** VoxSite shall not disclose Customer Personal Data to any third party, except (a) to the Subprocessors listed in Section 6, (b) where required by law (in which case VoxSite will, where legally permitted, notify the Customer in advance), or (c) on the Customer's documented instruction.

## 5. Security

**5.1 Technical and organisational measures.** Taking into account the state of the art, the costs of implementation, the nature, scope, context, and purposes of Processing, and the risks to Data Subjects, VoxSite shall implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk, including the measures described in VoxSite's Privacy Policy, Section 12, which forms part of this DPA by reference. Those measures include, as a minimum:

- Encryption of Personal Data in transit using TLS 1.2 or higher
- Encryption of Personal Data at rest using AES-256 on database and file storage
- Hashing of authentication credentials using bcrypt
- Row-level access controls in the application database that isolate each Customer's workspace
- Cryptographic verification of payment-webhook callbacks
- Rate limiting on authentication and high-cost endpoints
- Time-limited signed URLs (default 5 minutes) for photo and report downloads
- The principle of least privilege applied to all personnel accessing production systems

**5.2 Updates to security measures.** VoxSite may update its security measures from time to time provided that any change does not materially diminish the overall level of security afforded by them.

## 6. Subprocessors

**6.1 Authorised Subprocessors.** The Customer grants VoxSite general authorisation to engage Subprocessors in connection with the Services. The Subprocessors authorised as of the last update of this DPA are:

| Subprocessor | Service | Location |
|---|---|---|
| Supabase | Database, authentication, file storage | Ireland (`eu-west-1`) |
| Railway | Backend application hosting | Netherlands (Amsterdam) |
| Vercel | Frontend hosting and global edge delivery | Global edge network |
| Stripe | Payment processing | Ireland (EU entity) with global processing infrastructure |
| Resend | Transactional email delivery | Ireland (dispatch routing) and United States (account data and logs) |
| OpenAI | Voice-to-text transcription (only when the voice-note feature is used) | United States |

**6.2 Subprocessor obligations.** VoxSite shall ensure that each Subprocessor is bound by a written contract that imposes data protection obligations equivalent to those set out in this DPA, including in respect of security, confidentiality, and international transfers. VoxSite remains liable to the Customer for the acts and omissions of its Subprocessors as if they were its own.

**6.3 Changes to Subprocessors.** VoxSite shall notify the Customer at least 14 days before adding or replacing any Subprocessor that processes Customer Personal Data. Notice will be given to the Customer's account-administrator email address.

**6.4 Right to object.** The Customer may object to the engagement of a new Subprocessor on reasonable data-protection grounds by notifying VoxSite in writing within the 14-day notice period. The parties shall discuss the objection in good faith. If the parties cannot resolve the objection, the Customer's sole and exclusive remedy is to terminate the affected subscription with effect from the date the new Subprocessor begins Processing, and receive a pro-rata refund of any prepaid fees for the unused period.

## 7. International transfers

**7.1 EU/EEA transfers.** Where the Processing of Customer Personal Data involves a transfer outside the European Economic Area to a country not subject to an adequacy decision by the European Commission, the parties incorporate by reference the Standard Contractual Clauses (Module 2: Controller to Processor or Module 3: Processor to Processor, as applicable), with the following selections:

- Clause 7 (docking): not applicable
- Clause 9 (use of subprocessors): Option 2 (general written authorisation), with the notice period specified in Section 6.3 above
- Clause 11 (redress): the optional language is not included
- Clause 17 (governing law): the law of the Republic of Poland
- Clause 18 (forum and jurisdiction): the courts of the Republic of Poland competent for the seat of Łukasz Biniecki Lbicon Projektowanie Konstrukcji (Kraków, Poland)
- Annex I.A (parties): the Customer is the data exporter; VoxSite (or the relevant Subprocessor) is the data importer
- Annex I.B (description of transfer): as described in Sections 2.5 to 2.7 of this DPA
- Annex I.C (competent supervisory authority): the Polish data protection authority (Prezes Urzędu Ochrony Danych Osobowych, UODO)
- Annex II (technical and organisational measures): as set out in Section 5.1 of this DPA and Section 12 of the Privacy Policy

**7.2 UK transfers.** Where the Processing involves a transfer of Personal Data to which UK GDPR applies, the parties incorporate by reference the UK Addendum, applied to the SCCs identified in Section 7.1. Tables 1 to 4 of the UK Addendum are completed as follows:

- Table 1 (parties): as set out in Annex I.A of the SCCs
- Table 2 (selected SCCs, modules and clauses): the SCCs as identified in Section 7.1, with the selections set out there
- Table 3 (appendix information): as set out in Section 7.1 above
- Table 4 (ending the addendum if there is a change): both parties may end the Addendum

**7.3 Onward transfers.** Where a Subprocessor located outside the EEA or the UK transfers Customer Personal Data onward, that transfer is safeguarded by the SCCs and/or UK Addendum (or successor mechanism) entered into between VoxSite and the Subprocessor. Each Subprocessor in Section 6.1 located outside the EEA processes Customer Personal Data subject to such safeguards.

## 8. Data Subject rights

**8.1 Assistance.** Taking into account the nature of the Processing, VoxSite shall provide reasonable assistance to the Customer, by appropriate technical and organisational measures, to enable the Customer to fulfil its obligations to respond to requests from Data Subjects exercising their rights under Chapter III of the GDPR (access, rectification, erasure, restriction, portability, objection, and rights related to automated decision-making).

**8.2 Direct requests.** If a Data Subject contacts VoxSite directly with a request relating to Personal Data processed on behalf of the Customer, VoxSite will, where it can identify the relevant Customer, forward the request to the Customer without undue delay and not respond substantively to the Data Subject except to acknowledge receipt and provide the contact details of the Customer.

**8.3 Self-service.** Many Customer obligations under Chapter III GDPR can be discharged through the Customer's own administrative use of the Services (e.g. by accessing, editing, exporting, or deleting projects, snags, photos, and voice notes through the application interface). Where additional assistance is required, the Customer may contact sales@voxsite.app.

## 9. Personal Data Breaches

**9.1 Notification to Customer.** VoxSite shall notify the Customer without undue delay, and in any event within 72 hours, after becoming aware of a Personal Data Breach affecting Customer Personal Data. Notification will be made to the Customer's account-administrator email address and will include, to the extent then known:

- The nature of the breach, including (where possible) the categories and approximate number of Data Subjects and records concerned
- The likely consequences of the breach
- The measures taken or proposed to address the breach and to mitigate possible adverse effects
- A point of contact within VoxSite from whom further information can be obtained

**9.2 Cooperation.** VoxSite shall cooperate with the Customer and provide such information and assistance as the Customer reasonably requires in order for the Customer to fulfil its own obligations under Articles 33 and 34 GDPR (notification to supervisory authorities and to Data Subjects).

**9.3 Containment and remediation.** VoxSite shall take reasonable steps to identify the cause of any Personal Data Breach, contain it, mitigate its effects, and prevent recurrence.

## 10. Return and deletion

**10.1 During the term.** The Customer may delete Customer Personal Data at any time using the deletion functions available within the Services. Deletion of a project also deletes the photos, voice notes, and transcriptions associated with that project, within a reasonable technical timeframe.

**10.2 On termination.** Within 30 days after the termination or expiry of the Customer's subscription, VoxSite will, at the Customer's choice, return or delete all Customer Personal Data, except to the extent that VoxSite is required by Union or Member State law to retain some or all of it (in particular, financial records retained for the period required by Polish accounting law — currently five years from the end of the calendar year of the relevant transaction).

**10.3 Backups.** Encrypted backups containing Customer Personal Data are retained on a rolling 30-day cycle and overwritten in due course; VoxSite will not restore deleted Customer Personal Data from backups except where doing so is necessary to recover from a system incident affecting other live data.

**10.4 Anonymised data.** VoxSite may continue to use Customer Personal Data after termination if it has been irreversibly anonymised, in which case it is no longer Personal Data and no longer subject to this DPA.

## 11. Audit

**11.1 Information.** VoxSite shall make available to the Customer all information reasonably necessary to demonstrate compliance with this DPA and Article 28 GDPR.

**11.2 Audits.** The Customer (or an independent third-party auditor mandated by the Customer and reasonably acceptable to VoxSite, bound by appropriate obligations of confidentiality) may, on at least 30 days' written notice and not more than once in any 12-month period (except in the event of a Personal Data Breach or where required by a competent supervisory authority), conduct an audit of VoxSite's compliance with this DPA. Audits shall be conducted during normal business hours, in a manner that does not unreasonably disrupt VoxSite's operations, and shall not extend to any data of other VoxSite customers.

**11.3 Subprocessor audits.** Where the audit reasonably requires access to a Subprocessor, VoxSite shall use reasonable efforts to facilitate that access on equivalent terms.

**11.4 Costs.** Each party shall bear its own costs in connection with an audit, except where the audit reveals a material breach of this DPA by VoxSite, in which case VoxSite shall reimburse the Customer's reasonable and documented audit costs.

## 12. Liability

The aggregate liability of each party arising out of or in connection with this DPA, whether in contract, tort (including negligence), under statute or otherwise, is governed by, and subject to, the limitations of liability set out in the Terms. This DPA does not increase or extend the liability of either party beyond what is provided in the Terms.

## 13. Conflict and order of precedence

If there is a conflict between this DPA and any other agreement between the parties (including the Terms), this DPA prevails on matters concerning the Processing of Personal Data. If there is a conflict between the body of this DPA and the SCCs or UK Addendum (where applicable), the SCCs or UK Addendum prevail to the extent of that conflict.

## 14. Term

This DPA takes effect when the Customer accepts the Terms (or, if later, when this DPA is first published on voxsite.app/dpa). It remains in force for as long as VoxSite processes Customer Personal Data on the Customer's behalf, and the obligations in Sections 9 (Personal Data Breaches) and 10 (Return and deletion) survive termination as necessary for their performance.

## 15. Changes to this DPA

VoxSite may update this DPA from time to time to reflect changes in applicable law, in our Subprocessors, or in our processing practices. Material changes will be notified to account administrators by email at least 14 days before they take effect. The Customer's continued use of the Services after a change takes effect constitutes acceptance of the revised DPA. If the Customer does not accept the revised DPA, the Customer may terminate the affected subscription under the Terms.

## 16. Governing law and jurisdiction

This DPA is governed by the laws of the Republic of Poland, without regard to conflict-of-law principles. Any dispute arising from or related to this DPA shall be brought exclusively before the courts competent for the seat of Łukasz Biniecki Lbicon Projektowanie Konstrukcji (Kraków, Poland), subject to mandatory consumer-protection provisions of the laws of any country where a Customer who is a consumer habitually resides.

## 17. Contact

For questions about this DPA, to request a countersigned copy, or to exercise any right under it:

Email: sales@voxsite.app
Post: Łukasz Biniecki Lbicon Projektowanie Konstrukcji, ul. Unruga 65a, 30-394 Kraków, Poland

© 2026 Łukasz Biniecki Lbicon Projektowanie Konstrukcji · VoxSite is a trade name of the above.
