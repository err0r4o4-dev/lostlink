# LostLink Stitch Prompt Pack

This document is a copy-ready prompt set for generating the current LostLink
interface in Google Stitch and moving the result into Figma. It follows a
faithful-finalization approach: preserve the implemented design language and
finish incomplete screens without inventing new product policy or backend
behavior.

## Scope lock

- Recreate the current LostLink interface faithfully. Do not redesign it into
  a generic SaaS dashboard, social network, marketplace, or native iOS app.
- Preserve the existing information architecture, routes, wording, roles,
  privacy boundaries, and workflow states.
- Complete unfinished presentation for recovery, onboarding, locations,
  profile preferences, privacy controls, and policy-document layouts.
- Treat all newly completed but unimplemented capabilities as design-only.
  Do not imply that the backend behavior exists.
- AI similarity assists discovery only. It never proves ownership, approves a
  claim, or replaces staff review.
- Use synthetic university examples only. Do not use real people, student IDs,
  phone numbers, receipts, serial numbers, or precise pickup details.

## Recommended Stitch workflow

1. Create one Stitch project named `LostLink - Faithful Final UI`.
2. Paste the Master Project Prompt once.
3. Generate the three shared shells and component library.
4. Paste each route prompt in numerical order, keeping all screens in the same
   Stitch project so components and styles remain consistent.
5. For each route, generate the requested desktop, tablet, and mobile frames.
6. Export to Figma, convert repeated elements into components, and preserve the
   frame names in this document.
7. Compare against the current application before accepting visual changes.

If Stitch loses context, paste the Context Lock immediately before the page
prompt.

## Context Lock

```text
Continue the existing LostLink design project. Reuse the established LostLink
components, tokens, typography, icon family, public shell, authenticated app
shell, and responsive behavior. This is faithful finalization, not a redesign.
Do not introduce a new color palette, dark mode, decorative gradients, generic
dashboard styling, or a different navigation model. Keep public discovery data
separate from private ownership evidence. AI similarity is assistance only and
must never be presented as proof of ownership.
```

## Master Project Prompt

```text
Create a complete responsive web application design system and screen set for
LostLink, a privacy-conscious university Lost & Found platform. Faithfully
recreate and complete the existing interface; do not redesign the product.

PRODUCT CHARACTER
- Calm, premium, friendly, trustworthy, and web-first.
- Apple-inspired principles of clarity, restraint, hierarchy, and responsive
  feedback, without copying Apple products or making the site look like a
  native iPhone application.
- The interface must feel appropriate for students, university staff, and
  administrators.
- Use clear workflow language rather than gamification or social-media visual
  patterns.

EXACT VISUAL TOKENS
- Brand: #8B183F.
- Brand hover: #761334. Brand active: #64102C.
- Brand soft background: #FCE7EA.
- Canvas: #F5F5F7. Primary surface: #FFFFFF.
- Secondary surface: #F3F6FB.
- Primary text: #0F172A. Secondary text: #64748B.
- Strong secondary text: #526176. Tertiary text: #94A3B8.
- Border: rgba(15, 23, 42, 0.08).
- Success: #22C55E. Warning: #F59E0B. Error: #EF4444.
- Information: #3B82F6.
- Use Inter Variable for Latin text and Noto Sans Thai Variable for Thai.
- Font weights: 400, 500, 600, and 700 only.
- Display 48px, page heading 36px desktop and 28px mobile, section heading
  24px, card heading 18px, body 16px, caption 14px, label 12px.
- Radii: 12px small, 14px controls, 20px cards, 24px features, 28px overlays.
  Pill radius is reserved for status chips, filters, and compact segmented
  controls only.
- Card shadow: 0 4px 18px rgba(15,23,42,.05).
- Floating shadow: 0 10px 35px rgba(15,23,42,.08).
- Minimum touch target: 44px.
- Spacing follows a 4px base scale with spacious 20-40px content padding.
- Focus rings use a visible 3px brand outline with a 3px offset.

BACKGROUND AND SURFACES
- Use the light canvas with restrained radial atmosphere: a soft burgundy glow
  near the upper-left and a very subtle blue glow near the upper-right.
- Content cards stay solid white and readable.
- Use glass only for sticky navigation, floating toolbars, dialogs, and mobile
  sheets. Glass is rgba(255,255,255,.70), 16px blur, 140% saturation, with a
  subtle white border. Always provide a solid white fallback.
- Avoid excessive glass, neon effects, purple gradients, heavy shadows,
  oversized pills, and decorative visual noise.

SHARED COMPONENTS
- Public brand mark: burgundy rounded square containing a white L, followed by
  the LostLink wordmark.
- Authenticated and auth-screen brand mark: burgundy rounded square containing
  the existing white paperclip/link glyph, followed by the LostLink wordmark.
  Expanded desktop usage includes the tagline "Find what matters"; compact
  mobile usage may show the glyph alone with an accessible name.
- Primary button: burgundy fill, white label, compact icon where helpful.
- Secondary button: solid white or secondary surface, subtle border.
- Ghost button: text-led low-emphasis action.
- Destructive actions remain secondary until confirmation and use explicit
  warning or error treatment.
- Cards use solid white surfaces, 20px radius, subtle border, and soft shadow.
- Inputs are at least 48px high with permanent labels, optional helper text,
  visible required indicators, clear errors, and no placeholder-only labels.
- Reuse item cards, route cards, notices, empty states, loading states, error
  states, status badges, notification rows, upload areas, and tracking timeline.
- Use Lucide-style outline icons consistently. Do not mix icon families.

PUBLIC SHELL
- Sticky solid white header with subtle bottom border.
- Content width is approximately 70% on large desktop, with generous side
  margins; use full-width padded content on smaller screens.
- Brand on the left; language toggle and compact Sign in button on the right.
- Footer includes LostLink description, Privacy, Terms of use, Help, and the
  year 2026.
- Mobile keeps the same hierarchy with a compact header and stacked footer.

AUTH SHELL
- Light atmospheric canvas, centered LostLink brand, and a maximum 512px auth
  card.
- Auth card uses a white elevated surface, 20px radius, 20px mobile padding and
  32px desktop padding.
- Forms stay single-column and keyboard friendly.

AUTHENTICATED APP SHELL
- Desktop at 1024px and above: 280px fixed left sidebar, sticky 80px top bar,
  and a broad content area up to 1600px.
- Desktop sidebar navigation order: Explore items, Search, AI Chat, Report,
  Matches, Claims, Tracking, Locations, Help, Staff preview.
- Active navigation uses brand-soft background and brand text.
- Desktop top bar contains the phrase "University lost & found", language
  toggle, notification action, and profile action.
- Tablet: hide the sidebar, keep the sticky glass top bar, and show compact
  primary navigation for Explore, Search, AI Chat, and Report.
- Mobile: compact sticky glass header and a fixed glass bottom navigation for
  Explore, Search, AI Chat, Tracking, and Profile. Respect top and bottom safe
  areas. Main content must never be covered by the bottom navigation.
- Use page containers with 20px mobile, 28px tablet, and 32-40px desktop side
  padding. Keep desktop layouts broad rather than phone-width.

RESPONSIVE OUTPUT
- For every route create frames named Desktop / 1440, Tablet / 834, and Mobile
  / 390 unless a prompt explicitly requests additional state frames.
- Desktop uses grids and side panels. Tablet reduces columns deliberately.
- Mobile stacks content by task priority, converts side panels to inline cards
  or bottom sheets, makes primary actions reachable, and preserves entered form
  data when sheets open.
- Tables may become labeled cards on mobile. Never solve overflow by hiding
  content globally.

ACCESSIBILITY
- Maintain logical heading order, clear landmarks, visible focus, keyboard
  operation, semantic labels, readable contrast, and 44px targets.
- Do not use color, icons, position, or motion as the only status indicator.
- Error text appears next to the relevant field and an error summary or notice
  remains visible after submission.
- Support English and Thai content without clipping. Thai text may wrap more
  often and must not reduce below the defined readable sizes.
- Provide reduced-motion equivalents for animated feedback.

TRUST AND PRIVACY RULES
- Public report screens may show item name, category, visible description,
  event date, approximate location, and sanitized public images.
- Never show reporter contact data, precise private locations, ownership
  answers, receipt details, secret serial information, claim evidence, or staff
  notes on public discovery surfaces.
- Claim evidence is visibly restricted to the claimant and authorized staff.
- Unknown private references use a generic unavailable state to avoid exposing
  whether another user's record exists.
- Matching scores are always labeled as similarity estimates and are paired
  with a warning that they are not ownership proof.

OUTPUT QUALITY
- Build reusable Figma-ready components and variants rather than drawing each
  screen from unrelated one-off elements.
- Use realistic synthetic content and meaningful populated states.
- Also create loading, empty, error, disabled, and success variants requested
  by each page prompt.
- Do not use lorem ipsum.
- Do not invent legal promises, retention periods, university policy, backend
  capabilities, or authorization behavior that is not stated in the prompt.
```

## Figma page and frame structure

```text
00 Foundations
01 Components
02 Public
03 Authentication
04 Discovery & AI Chat
05 Reports
06 Matching
07 Claims & Verification
08 Tracking & Account
09 Staff
10 Admin
11 States & Responsive
```

Frame naming format:

```text
NN Route Name / Desktop 1440 / Primary
NN Route Name / Tablet 834 / Primary
NN Route Name / Mobile 390 / Primary
NN Route Name / Desktop 1440 / Empty|Loading|Error|Success
```

## Route coverage matrix

| No. | Route | Frame name | Treatment |
| ---: | --- | --- | --- |
| 01 | `/` | Guest Home | Preserve |
| 02 | `/privacy` | Privacy Information | Finalize document layout |
| 03 | `/terms` | Terms of Use | Finalize document layout |
| 04 | `/login` | Sign In | Preserve |
| 05 | `/register` | Create Account | Preserve |
| 06 | `/forgot-password` | Recover Account | Finalize success state |
| 07 | `/reset-password` | Reset Password | Finalize token states |
| 08 | `/auth/callback` | Google Auth Callback | Preserve state screen |
| 09 | `/onboarding` | Privacy Onboarding | Finalize continuation |
| 10 | `/discover` | Discovery Hub | Preserve |
| 11 | `/chat` | AI Chat | Preserve and finish mobile history |
| 12 | `/search` | Search Reports | Preserve |
| 13 | `/items/:itemId` | Public Item Detail | Preserve |
| 14 | `/help` | Help and Safety | Preserve |
| 15 | `/locations` | Campus Locations | Finalize coarse-location design |
| 16 | `/report` | Report Hub | Preserve |
| 17 | `/report/lost` | Report Lost Item | Preserve |
| 18 | `/report/found` | Report Found Item | Preserve |
| 19 | `/reports/:reportId/manage` | Manage Report | Preserve |
| 20 | `/matches` | Potential Matches | Preserve |
| 21 | `/matches/:matchId` | Match Detail | Preserve |
| 22 | `/verification` | Verification Guide | Preserve |
| 23 | `/claims` | My Claims | Preserve |
| 24 | `/claims/new` | Start Claim | Preserve |
| 25 | `/claims/:claimId` | Claim Detail | Preserve |
| 26 | `/tracking` | Tracking | Preserve |
| 27 | `/notifications` | Notifications | Preserve |
| 28 | `/profile` | Profile and Preferences | Finalize policy-dependent panels |
| 29 | `/staff` | Staff Dashboard | Preserve |
| 30 | `/staff/reports` | Staff Report Moderation | Preserve |
| 31 | `/staff/matches` | Staff Matching Review | Preserve |
| 32 | `/staff/claims` | Staff Claim Queue | Preserve |
| 33 | `/staff/claims/:claimId` | Staff Claim Review | Preserve |
| 34 | `/staff/returns` | Staff Return Queue | Preserve |
| 35 | `/staff/returns/:returnId` | Staff Return Detail | Preserve |
| 36 | `/admin/audit-events` | Audit Events | Preserve |
| 37 | `*` | Page Not Found | Preserve |

## Shared shell and component generation prompt

```text
Using the LostLink Master Project Prompt, create a Figma-ready foundations and
components page before generating routes.

Create color, typography, spacing, radius, elevation, breakpoint, icon, focus,
and motion documentation using the exact LostLink tokens. Create component
sets with auto-layout and variants for:
- Brand mark and language toggle.
- Public header and footer.
- Desktop sidebar, tablet top navigation, mobile top bar, and mobile bottom
  navigation, including default, hover, focus, active, and notification states.
- Primary, secondary, ghost, compact, disabled, loading, and destructive
  confirmation buttons.
- Text input, password input, textarea, select, search field, checkbox, file
  upload, and form helper/error states.
- Card, route card, item card, notification row, status badge, notice, empty
  state, loading state, error state, page header, tracking timeline, and dialog.
- Status vocabulary for report, match, claim, and return lifecycle states.

Create the Public Shell, Auth Shell, and Authenticated App Shell at Desktop
1440, Tablet 834, and Mobile 390. Keep ordinary content solid; use glass only
for persistent navigation, dialogs, and sheets. Include English and Thai stress
test examples for navigation, buttons, form labels, and notices.
```

## Page prompts

### 01. Guest Home - `/`

```text
Create route `/` as frames named `01 Guest Home` using the LostLink Public
Shell. Faithfully preserve the current landing page rather than inventing a
marketing redesign.

Desktop composition:
- Sticky public header with LostLink brand left; language toggle and compact
  Sign in button right.
- Hero uses a broad two-column layout. Left column contains a brand-soft pill
  "Lost & Found for universities", the headline "Lost items may be waiting for
  you to find them", a supporting paragraph, one primary Get started button to
  registration, and the trust line "Easy to use - Respects privacy -
  Verification before return".
- Right column contains the existing abstract campus-item illustration: a
  white elevated interface card with simple outline icons for a backpack,
  student ID card, and drink cup, plus a search-result chip. Do not use a stock
  photo or realistic personal data.
- Second section is solid white with centered heading "Find lost items more
  easily in 3 steps" and three numbered cards: Report item details, Find
  potentially matching items, Verify and collect.
- Place the burgundy-soft AI notice directly under the step cards: "AI only
  assists with discovery and similarity ranking. A potential match is not
  proof of ownership."
- Third section contains one large white privacy card titled "Find lost items
  without revealing more than necessary" and three trust items: limited
  personal information exposure, no precise public locations, and verification
  before return.
- Finish with the existing public footer.

Responsive behavior:
- Tablet keeps the hero balanced but may stack the illustration below the
  copy when needed.
- Mobile stacks all sections, keeps one full-width Get started button, uses
  three compact illustration tiles, and turns trust items into icon-and-text
  rows.
- Generate Primary and Thai-localized stress-test frames. Preserve heading
  hierarchy and do not add testimonials, pricing, app-store badges, or metrics.
```

### 02. Privacy Information - `/privacy`

```text
Create route `/privacy` as frames named `02 Privacy Information` using the
LostLink Public Shell. Preserve the current narrow public-information layout
and finalize it as a readable policy-document template without inventing legal
commitments.

Primary composition:
- Maximum article width approximately 896px with generous vertical whitespace.
- Feature icon in a brand-soft rounded square, eyebrow "Privacy", and Thai page
  title "ข้อมูลความเป็นส่วนตัว". Include a concise introduction explaining
  that the formal policy is still being prepared.
- Add a clearly visible neutral status notice: "Draft information - approved
  institutional policy copy is required before production use."
- Create a compact in-page contents card and document sections for Purpose,
  Data categories, Who can access data, Public versus restricted information,
  Retention and deletion, Account choices, and Contact. Use short neutral
  placeholder summaries only; do not specify retention periods, legal bases,
  compliance claims, or rights not approved by the university.
- Include a final callout reinforcing that claim evidence, verification
  answers, precise pickup details, and staff notes are restricted.
- Provide a secondary Back to home action and the public footer.

Responsive behavior and states:
- Desktop may use a slim sticky contents rail beside the article.
- Tablet and mobile move contents above the article and keep sections in a
  single readable column.
- Create a document-loading skeleton and a policy-unavailable error state.
- Support Thai body copy without clipping and keep body text at least 16px.
```

### 03. Terms of Use - `/terms`

```text
Create route `/terms` as frames named `03 Terms of Use` using the LostLink
Public Shell. Match the visual structure of Privacy Information so both pages
form one document family.

Primary composition:
- Narrow article layout with a document icon, eyebrow "Terms", and Thai title
  "ข้อกำหนดการใช้งาน".
- Introductory copy explains that formal terms covering rights,
  responsibilities, and verification procedures are still being prepared.
- Show a neutral draft-status notice and do not imply that placeholder content
  is legally approved.
- Add an in-page contents card and visually complete sections for Acceptable
  use, Report accuracy, Public-safe content, Claim and ownership review,
  Prohibited disclosure, Staff decisions, Account actions, and Contact.
- Keep all copy conservative. Do not invent penalties, warranties,
  jurisdiction, legal compliance claims, or binding retention rules.
- Add a warning card stating that similarity results are discovery assistance
  and cannot establish ownership.
- Provide Back to home and the shared public footer.

Responsive behavior:
- Desktop can use a sticky table of contents; mobile uses a single column with
  clear section dividers.
- Create Primary, document-loading, and unavailable frames.
```

### 04. Sign In - `/login`

```text
Create route `/login` as frames named `04 Sign In` using the LostLink Auth
Shell. Preserve the current centered authentication card.

Place the LostLink brand above an elevated white card. Inside the card show:
- Heading "Sign in to LostLink" and a concise explanation that authentication
  is required for private reports, claims, tracking, and staff tools.
- Labeled University email or account identifier field.
- Labeled Password field, a Show password checkbox, and a Forgot password link.
- Primary Sign in action aligned with the form hierarchy.
- A divider labeled "or" and a full-width secondary Continue with Google
  action with a simple G mark.
- Footer copy "Need an account? Create one".

Create variants for default, validation errors, server authentication error,
submitting, and successful sign-in confirmation dialog. The error remains
visible in the card and is not communicated by color alone. On mobile the card
uses almost the full content width and keeps all controls at least 48px high.
Do not add social providers beyond Google or collect additional identity data.
```

### 05. Create Account - `/register`

```text
Create route `/register` as frames named `05 Create Account` using the LostLink
Auth Shell and the same card geometry as Sign In.

Inside the card show:
- Heading "Create your account" and the current explanation that only a basic
  account is created until additional identity contracts are approved.
- University email or account identifier.
- Password with helper text "Use 12-128 characters".
- Confirm password and Show passwords checkbox.
- Full-width primary Create account button.
- Divider and secondary Continue with Google button.
- Link "Already registered? Sign in".

Create default, inline validation, password mismatch, registration error,
submitting, and account-created confirmation variants. Do not add name, phone,
student number, department, profile image, marketing consent, or unapproved
legal checkboxes. Ensure Thai translations can wrap without moving labels away
from their controls.
```

### 06. Recover Account - `/forgot-password`

```text
Create route `/forgot-password` as frames named `06 Recover Account` using the
LostLink Auth Shell. Faithfully retain the simple recovery form and finalize
its post-submit presentation.

Default frame:
- Heading "Recover account access".
- Explain that responses remain generic so the interface never reveals whether
  an account exists.
- One labeled University email or account identifier field.
- Full-width primary Request recovery action with a key icon.
- Secondary text link Back to sign in.

Finalized generic-response frame:
- Replace the form emphasis with a calm success/info notice titled "Check your
  recovery options".
- Copy: "If an eligible account exists, recovery instructions will be sent
  through the approved channel."
- Provide Resend when available and Back to sign in actions, but visually mark
  rate-limited delivery as a design-only backend dependency.
- Never display whether the identifier exists, a delivery destination, or a
  countdown that implies an unimplemented policy.

Also create validation, submitting, rate-limit, and service-unavailable
variants. Keep the same generic language for both valid and unknown accounts.
```

### 07. Reset Password - `/reset-password`

```text
Create route `/reset-password` as frames named `07 Reset Password` using the
LostLink Auth Shell. Preserve the current three-field form and finalize token
states.

Default frame:
- Heading "Set a new password".
- Description that a server-validated recovery token is required.
- Recovery token field, New password field, Confirm new password field.
- Full-width primary Review password reset button.
- Use the same password visibility and validation patterns as registration.

Generate additional frames:
- Invalid or expired token: generic error notice, Request a new recovery link,
  and Back to sign in. Do not expose token parsing details.
- Validation error: password requirements and mismatch shown inline.
- Submitting: disabled fields and clear progress label.
- Success: confirmation that the password was updated and existing sessions
  were revoked only if the approved backend contract supports it; otherwise
  label session revocation as pending. Provide a primary Sign in action.
- Service unavailable: persistent error with retry.

Do not display the raw token after submission and do not invent password policy
beyond the current 12-128 character guidance.
```

### 08. Google Auth Callback - `/auth/callback`

```text
Create route `/auth/callback` as frames named `08 Google Auth Callback` using
the LostLink Auth Shell. This is a compact state screen, not a form.

Create three variants:
1. Loading: heading "Completing sign-in", description "LostLink is creating
   your local session", and an accessible loading state "Verifying your
   session".
2. Provider verification failed: heading "Google sign-in failed", generic
   error notice "Try again from the sign-in page. No Google token was stored",
   and full-width Back to sign in action.
3. Local session failed: same generic visual treatment without provider codes,
   authorization codes, state values, tokens, or secrets.

Keep the card centered and calm. Do not use a full-page celebratory success
screen because successful authentication redirects to Profile.
```

### 09. Privacy Onboarding - `/onboarding`

```text
Create route `/onboarding` as frames named `09 Privacy Onboarding` using the
authenticated App Shell. Preserve the existing three-card orientation and
finalize the continuation path without inventing legal consent.

Page header:
- Eyebrow "Before you begin".
- Heading "Privacy-conscious by design".
- Explain that this orientation uses approved architecture language and does
  not replace future legal or institutional consent copy.

Content:
- Three equal cards on desktop: Share public-safe details, Keep evidence
  private, Treat AI as assistance. Use eye, shield, and eye-off/sparkles icons.
- Add a concise example under each card showing safe versus unsafe content.
- Keep a warning notice explaining that legal acknowledgement, versioning,
  retention, and consent storage require approved policy and backend support.
- Finalize the page with a primary Continue to discovery action and secondary
  Review privacy information action. Do not add a required consent checkbox.

Responsive behavior:
- Three columns desktop, two-plus-one tablet, one column mobile.
- On mobile place the primary continuation action in a safe, non-obscuring
  sticky action area only if the content remains fully reachable.
- Create first-visit and returning-user variants; do not imply the orientation
  itself grants consent.
```

### 10. Discovery Hub - `/discover`

```text
Create route `/discover` as frames named `10 Discovery Hub` using the
authenticated App Shell.

Use the standard page header with eyebrow "Find what matters", heading
"Discovery tools", and description explaining that users move from public-safe
search to potential-match review without crossing the ownership boundary.

Below the header show two large reusable route cards in a balanced two-column
desktop grid:
- Search reports, with search icon and description "Filter active public-safe
  lost and found reports".
- Potential matches, with sparkles icon and description "Run matching for your
  lost reports and review ranked candidates".

Cards use solid white surfaces, generous padding, clear hover/focus states, and
an arrow or understated destination cue. Mobile stacks the cards and keeps
each one fully tappable. Do not add analytics, recent activity, match scores,
or private data to this hub.
```

### 11. AI Chat - `/chat`

```text
Create route `/chat` as frames named `11 AI Chat` using the authenticated App
Shell. Faithfully preserve the current two-pane chat workspace and complete
the missing mobile history interaction.

Desktop and tablet composition:
- Use the available content height beneath the sticky app header.
- A 256px chat-history rail contains a full-width New Chat button, "Recent
  Chats" label, session rows with message icon, truncated title, active state,
  and a low-emphasis delete action revealed on hover/focus.
- Main area is one solid white card with a header showing a brand-soft
  sparkles avatar, current chat title or "New Chat", and subtitle
  "AI-assisted discovery".
- Empty conversation centers a message icon, heading "How can I help you find
  your item?", the current discovery disclaimer, and four suggested prompts in
  a two-column grid.
- Conversation state uses burgundy right-aligned user bubbles and pale neutral
  left-aligned AI bubbles with a sparkles avatar. Provide Copy on AI messages
  and Copy plus Edit on user messages.
- Composer is fixed to the bottom of the chat card, with an auto-growing
  textarea, compact send/cancel button, and disclaimer "AI can make mistakes.
  Please verify important information with staff."

Mobile finalization:
- Do not permanently hide chat history. Add a History button in the chat
  header that opens a safe-area-aware bottom sheet or full-height side sheet.
- The sheet contains New Chat, recent sessions, active state, and delete
  actions. Closing it returns focus to History and preserves the draft message.
- Keep the composer above the mobile bottom navigation and virtual keyboard.

Generate these state frames:
- Empty new chat.
- Populated conversation.
- Loading sessions and loading messages.
- "Thinking" response with reduced-motion alternative.
- Failed unsaved turn with Try again, Edit message, and Cancel.
- Editing a prior user message with Cancel and Send.
- Empty history.
- Delete confirmation dialog.

Never display chat output as authoritative ownership proof. Do not expose model
names, prompts, tokens, internal analysis metadata, or private claim evidence.
```

### 12. Search Reports - `/search`

```text
Create route `/search` as frames named `12 Search Reports` using the
authenticated App Shell.

Page header:
- Eyebrow "Discovery".
- Heading "Search LostLink".
- Description that search uses public-safe item attributes and never private
  ownership evidence.

Search composition:
- One white search card with a prominent labeled search field and primary
  Search button in the first row.
- Second row contains Report type select with Lost and found, Lost only, Found
  only options, plus a Category field.
- Results header contains filter icon, heading "Results", and a count badge.
- Populated results use reusable item cards in three desktop columns, two
  tablet columns, and one mobile column. Each card includes a sanitized image
  placeholder, lost/found badge, item name, category, approximate location,
  and date.

Generate states for search not started, searching, populated results, zero
results, and public-report service error with retry. Use examples such as a
black water bottle, navy backpack, student ID card, and vehicle key. Avoid
reporter identity and precise locations. On mobile stack the Search action
below the field and keep filters readable without horizontal scrolling.
```

### 13. Public Item Detail - `/items/:itemId`

```text
Create route `/items/:itemId` as frames named `13 Public Item Detail` using the
authenticated App Shell, while keeping the content public-safe.

Page header shows eyebrow "Item details", the item name, and a description
that reporter identity and private evidence are excluded.

Desktop composition:
- Main content uses a broad two-column layout with a flexible detail card and
  an approximately 288px side panel.
- Detail card begins with a large contained sanitized item image on a neutral
  background. Below it show lost/found status, category, item title, public
  description, date and optional approximate time, and approximate location.
- Side panel contains a "Private by design" notice, a compact grid of
  additional sanitized thumbnails when available, and Back to search.

Mobile stacks the main image, details, privacy notice, thumbnails, and action
in that order. Generate loading, unavailable/withdrawn, no-image, one-image,
and multi-image frames. Never add reporter name, contact details, exact pickup
location, secret serial information, receipts, or claim evidence.
```

### 14. Help and Safety - `/help`

```text
Create route `/help` as frames named `14 Help and Safety` using the
authenticated App Shell.

Use page header eyebrow "Help and safety", heading "LostLink guide", and the
current description about approved architecture, privacy boundaries, and the
product lifecycle.

Desktop layout has a flexible FAQ column plus a 352px side rail:
- FAQ column uses accessible disclosure cards with question, answer, and a
  single Lucide-style indicator that changes orientation when open.
- Questions cover how matching works, how ownership is verified, why locations
  are approximate, why the browser cannot call the AI service, and what
  completes a return.
- Side rail contains a warning "Safety first" listing content that must not be
  published, followed by a white card directing users to Search, Report,
  Matching, or Tracking.

Mobile places the safety warning before the FAQ list and keeps disclosure
targets at least 44px. Create all-closed, one-open, and keyboard-focus frames.
Do not add live chat, emergency claims, or unsupported contact channels.
```

### 15. Campus Locations - `/locations`

```text
Create route `/locations` as frames named `15 Campus Locations` using the
authenticated App Shell. Faithfully retain the coarse-location privacy model
and finalize the visual design without pretending a live provider is
configured.

Page header:
- Eyebrow "Campus locations".
- Heading "Explore approximate areas".
- Explain that the interface supports an approved provider or coarse-location
  API and never exposes precise private locations.

Final desktop composition:
- Left 352px control card with search icon, heading "Find an area", a labeled
  Campus area search field, category chips such as Library area, Student
  center, Sports complex, and Transport zone, plus a compact list of synthetic
  coarse areas.
- Right large map card uses a custom abstract campus diagram, not provider
  branding or real coordinates. Show broad named zones, paths, and public
  buildings using the LostLink palette. Pins represent approximate areas, not
  report-level exact positions.
- Selecting an area opens a small solid detail card with area name, general
  description, and Search reports in this area action.
- Display a permanent privacy badge "Approximate locations only".
- Include a neutral annotation that live search, routing, and map data remain a
  design-only dependency until an approved provider and API exist.

Responsive behavior:
- Tablet stacks controls above the map.
- Mobile uses a search/list-first layout; the map becomes a full-width card
  with an optional details bottom sheet. Preserve safe areas and keyboard
  reachability.
- Generate no-provider, populated prototype, no-results, and loading states.
```

### 16. Report Hub - `/report`

```text
Create route `/report` as frames named `16 Report Hub` using the authenticated
App Shell.

Page header uses eyebrow "Report an item", heading "What happened?", and the
current description about reviewing details before public or ownership
workflow begins.

Show two large route cards in a two-column desktop grid:
- "I lost something" with package-search icon and guidance to create a
  public-safe description while keeping identifying evidence private.
- "I found something" with box icon and guidance to record where and when the
  item was found without exposing private handoff or contact details.

Below, add section heading "My reports" and a populated owned-report list using
solid cards with report type, lifecycle status, item name, category,
approximate location, and Manage report action. Generate loading, empty, error,
and populated variants. Mobile stacks choice cards and report cards; primary
report choices remain above account history.
```

### 17. Report Lost Item - `/report/lost`

```text
Create route `/report/lost` as frames named `17 Report Lost Item` using the
authenticated App Shell and the existing report form vocabulary.

Header uses eyebrow "Lost report", heading "Report a lost item", and the
current description about creating a structured draft, previewing an image,
and reviewing before submission.

Form composition:
- Use a form-width container and solid cards.
- Section "Item information" contains Item name, Category, Public description,
  Date lost, optional Approximate time, and Approximate location.
- Section "Item photo" uses the existing dashed upload area, JPG/PNG guidance,
  file validation, preview, replace, and remove states.
- Include an optional browser-local private identifying detail field only as a
  preparation aid and clearly state that it is not submitted with the public
  report. Include the acknowledgement that contact information and ownership
  secrets were kept out of the public description.
- Permanent notices explain that public discovery details and private
  ownership evidence remain separate.
- Primary action is Review report, not immediate submission.

Create a review state showing a structured definition list of every public
field, image filename, Edit report action, and primary Submit report action.
Create validation-error, uploading, submitting, submitted-success, submission
failure, and partial-image-upload warning states. Mobile uses one column and a
reachable action area without covering fields or the virtual keyboard.
```

### 18. Report Found Item - `/report/found`

```text
Create route `/report/found` as frames named `18 Report Found Item` using the
same form components and responsive structure as Report Lost Item.

Header uses eyebrow "Found report", heading "Report a found item", and the
description "Share enough public-safe information to support discovery while
preserving a safe return process."

Fields use found-specific labels such as Date found and Approximate area found.
Keep Item name, Category, Public description, optional time, sanitized image
upload, and privacy acknowledgements. Add concise helper copy warning the
finder not to publish an exact storage location, contact details, complete
serial number, or a distinctive ownership answer.

Use the same two-step Edit/Review then Submit flow and the same validation,
upload, success, partial-upload, and failure states as the lost report. Reuse
components exactly so the two pages feel like variants of one report system,
not separately designed forms.
```

### 19. Manage Report - `/reports/:reportId/manage`

```text
Create route `/reports/:reportId/manage` as frames named `19 Manage Report`
using the authenticated App Shell.

Page header:
- Eyebrow "Report lifecycle".
- Heading "Manage report".
- Description about editing public-safe details, managing sanitized images,
  withdrawing the report, or continuing to matching.

Desktop composition:
- Main column contains a report summary card with lost/found and lifecycle
  badges, item name, category, description, date, approximate time, and
  approximate location.
- Provide an Edit public details mode using the existing labeled fields and
  Save/Cancel actions.
- Add a "Report images" card with sanitized image thumbnails, upload area,
  progress state, retry, and remove controls.
- Side rail contains primary Continue to matching, secondary Back to my
  reports, and low-emphasis Withdraw report. Withdrawal opens a destructive
  confirmation dialog explaining the consequence without deleting private
  claim records.
- Place a notice that editing public report fields never changes claim evidence
  or ownership decisions.

Generate loading, unauthorized/not-found, active, withdrawn, image-empty,
image-uploading, save-error, and action-error frames. Mobile stacks content and
keeps destructive actions separated from primary workflow actions.
```

### 20. Potential Matches - `/matches`

```text
Create route `/matches` as frames named `20 Potential Matches` using the
authenticated App Shell.

Header uses eyebrow "AI-assisted discovery", heading "Potential matches", and
the exact boundary message that similarity can rank candidates but cannot
verify ownership or approve a claim.

Composition:
- A white control card contains a labeled Lost report select and a primary Run
  matching button with sparkles icon. Only active lost reports appear.
- Below, use a flexible results area plus a 352px warning side rail.
- Match results use reusable item cards with sanitized image, found badge,
  candidate name, category, approximate location, event date, and a clearly
  labeled "NN% similar" badge. Add a full-width secondary Review match action.
- Side rail contains a persistent warning titled "How scores are used": the
  score estimates similarity only and ownership requires private evidence and
  authorized staff review.

Generate choose-a-report, loading reports, running matching, populated results,
no matches, matching failed, and results unavailable frames. Never visually
equate a high percentage with approval, confidence of ownership, or a green
success state. Mobile stacks the selector, action, warning, and match cards.
```

### 21. Match Detail - `/matches/:matchId`

```text
Create route `/matches/:matchId` as frames named `21 Match Detail` using the
authenticated App Shell.

Page header:
- Eyebrow "Potential match comparison".
- Candidate item name or fallback "Review potential match".
- Description that users review public-safe candidate data and similarity
  signals before deciding whether to start a private claim.

Desktop layout uses a broad comparison card and a 352px action rail:
- Main card shows a warning-colored similarity percentage badge, review-status
  badge, candidate item name, public description, category, approximate
  location, event date, and source report reference.
- Show "Similarity signals" as neutral compact chips such as similar color,
  category overlap, approximate area, and date proximity. Do not imply hidden
  reasoning or certainty.
- Side rail contains the warning "Ownership remains separate" and a primary
  Start private claim action.

Generate loading, unavailable/unauthorized, pending review, reviewed, and
dismissed variants. On mobile place the ownership warning before the claim CTA
and avoid sticky actions that cover content.
```

### 22. Verification Guide - `/verification`

```text
Create route `/verification` as frames named `22 Verification Guide` using the
authenticated App Shell.

Use page header eyebrow "Process guide", heading "How ownership verification
works", and the existing description about separating discovery assistance
from accountable ownership decisions.

Create four equal process cards on large desktop:
1. Review candidate - confirm the public-safe description could relate to the
   item.
2. Provide private evidence - ownership details remain separate from matching.
3. Staff review - authorized staff, not a score, decide ownership.
4. Arrange return - pickup and closure begin only after approval.

Each card contains STEP label, one outline icon, title, and short explanation.
Below the cards place primary Review potential matches and secondary View my
claims actions. Tablet uses two columns; mobile uses one vertical sequence with
a visible connective progression. Do not add claims that AI verifies receipts,
faces, identity, or ownership.
```

### 23. My Claims - `/claims`

```text
Create route `/claims` as frames named `23 My Claims` using the authenticated
App Shell.

Header uses eyebrow "Ownership workflow", heading "My claims", and description
about reviewing drafts, submitted evidence, staff decisions, and the next
authorized action.

Populated claims appear as a two-column desktop grid of solid cards. Each card
contains claim status, opaque claim reference, related match reference, last
updated timestamp, and secondary Open claim action. Use neutral status badges
for draft, submitted, under review, needs more info, approved, rejected, and
cancelled; status meaning must always be written as text.

Generate loading, empty, error, and populated frames. Empty state explains
that a claim starts from a potential match. Mobile uses one card per row and
keeps opaque references selectable or copyable without overwhelming the item
hierarchy. Do not show another user's claims or public match-score ranking on
this screen.
```

### 24. Start Claim - `/claims/new`

```text
Create route `/claims/new` as frames named `24 Start Claim` using the
authenticated App Shell.

Header uses eyebrow "Ownership verification", heading "Start a claim", and the
current explanation that private evidence is for authorized staff review and
similarity is never proof.

Default layout:
- Broad form card plus a 352px privacy rail.
- Show the potential-match reference as read-only text.
- Labeled required textarea "Private ownership details" with helper text that
  evidence enters only the restricted claim workflow.
- Optional supporting ownership image upload using the shared JPG/PNG upload
  component.
- Primary Review claim action.
- Side rail contains "Restricted evidence" notice and secondary View my claims
  action.

Review state:
- Brand badge "Private draft review".
- Definition list for match reference, ownership details, and supporting image.
- Secondary Edit evidence and primary Create claim draft actions.

Generate missing-match-reference warning, default, validation, review,
creating, success confirmation, evidence-partially-saved information dialog,
and creation-error frames. Never display private evidence in item search,
matching cards, public report screens, or analytics.
```

### 25. Claim Detail - `/claims/:claimId`

```text
Create route `/claims/:claimId` as frames named `25 Claim Detail` using the
authenticated App Shell.

Page header uses eyebrow "Claim status", dynamic heading such as "Claim under
review", explanatory workflow text, and secondary My claims action.

Desktop composition uses a broad main column and 352px action rail:
- Summary card shows status, opaque claim ID, lost report reference, and found
  report reference.
- Restricted Evidence card lists private statement and image evidence. Each
  item has evidence type, description, download for images, and Delete only
  while the claim is editable.
- Draft and needs-more-info states include Additional evidence or Response to
  staff textarea, optional image upload, and Save evidence action.
- Staff Decisions card uses a chronological list with action badge, timestamp,
  and reason.
- Side rail conditionally shows Submit for staff review, Cancel claim, Track
  this claim, and the permanent warning that a similarity score is not accepted
  as ownership evidence.

Generate distinct frames for draft, submitted, under review, needs more info,
approved, rejected, cancelled, no evidence, action error, and generic
unavailable/unauthorized. Cancellation uses a destructive confirmation dialog.
Mobile stacks status summary, evidence, decisions, warning, and actions in that
priority order.
```

### 26. Tracking - `/tracking`

```text
Create route `/tracking` as frames named `26 Tracking` using the authenticated
App Shell.

Header uses eyebrow "Your activity", heading "Track a report, claim, or
return", and description that only the authoritative timeline visible to the
active account is loaded.

Default layout:
- Broad main column plus 352px privacy rail.
- A white search card contains labeled Report or claim reference field and
  Check status action.
- Before a reference is entered, show a Process guide card with four numbered
  stages: Report submitted, Potential match found, Claim and verification,
  Staff review and return.
- Side rail contains a notice that unknown or unauthorized references produce
  the same generic unavailable state.

Loaded state:
- Summary row with reference type, current status, and status badge.
- Vertical tracking timeline using completed check icons and a burgundy current
  step, with event text and timestamps.
- If the reference is a return, show a separate Private pickup arrangement
  card with status, pickup time, and pickup location visible only to involved
  users.

Generate default guide, loading, populated report, populated claim, populated
return, generic unavailable, and pickup-detail error frames. Never distinguish
not-found from unauthorized in the user-facing error. Mobile uses one column
and keeps timeline labels readable with long Thai content.
```

### 27. Notifications - `/notifications`

```text
Create route `/notifications` as frames named `27 Notifications` using the
authenticated App Shell.

Header uses eyebrow "Updates", heading "Notifications", description about
report, match, claim, and return updates, and a secondary Mark all read action.
Disable the action when no unread items exist.

Notification rows are reusable bordered cards with:
- A 44px icon tile.
- Title, timestamp, and concise message.
- Unread state with brand-soft background, brand icon, and a small labeled
  unread indicator.
- Read state with white background and neutral icon.
- Entire row is a clear destination link when a related route exists.

Generate loading, empty, error with retry, mixed read/unread list, all-read
list, mark-all pending, and action-error notice. Mobile stacks title and time
without clipping and maintains a comfortable target for the entire row. Do not
include message content that leaks restricted evidence or exact pickup details
to users who are not involved.
```

### 28. Profile and Preferences - `/profile`

```text
Create route `/profile` as frames named `28 Profile and Preferences` using the
authenticated App Shell. Preserve the current account layout and finalize
policy-dependent panels without claiming unsupported behavior exists.

Page header:
- Eyebrow "Account".
- Heading "Profile and preferences".
- Description about the public-safe identity attached to the active session.
- Secondary Sign out action.

Top desktop grid contains three cards:
1. Account identity: user icon, synthetic identifier student@example.edu,
   current role badge, account loading and refresh-error variants.
2. Notification settings: visually complete preference rows for approved
   in-app categories, but mark controls as unavailable until server-side
   purpose and defaults are approved. Do not invent email/SMS delivery.
3. Privacy controls: clearly grouped links or disabled actions for policy
   information, active-session guidance, data-access request, and deletion
   policy. Label unimplemented actions as design-only and do not promise
   immediate export or deletion.

Below, section "More destinations" contains route cards for Notifications,
Potential matches, My claims, and My reports.

Generate loaded user, account loading, refresh error, and sign-out confirmation
dialog frames. The confirmation explains that private features require signing
in again. Include server-sign-out-incomplete error guidance for shared devices.
Mobile stacks identity first, destinations second, and policy-dependent cards
last. Do not collect new profile fields.
```

### 29. Staff Dashboard - `/staff`

```text
Create route `/staff` as frames named `29 Staff Dashboard` using the same
authenticated App Shell. Do not create a separate admin brand or dark
dashboard theme.

Header uses eyebrow "Staff workspace", heading "Operations dashboard", and
description "Server-authorized queues for moderation, verification, and
accountable returns."

Content:
- First row contains four metric cards: Open reports, Potential matches, Claims
  to review, Returns in progress. Each card has a caption and one clear count;
  no charts or decorative trends.
- Second area uses a flexible workspace grid plus a 352px API status card.
- Route cards: Report queue, Matching review, Claim review, Return workflow.
  Show Audit events only for an administrator role.
- API status card contains activity icon, heading "Public API", status badge,
  and plain-language health copy emphasizing server-side authorization.

Generate staff loaded, admin loaded, metrics loading, dashboard error, API
healthy, degraded, and unavailable frames. Mobile converts metric cards to a
two-column then one-column grid and stacks route cards before API status. Do
not expose sensitive record samples in dashboard metrics.
```

### 30. Staff Report Moderation - `/staff/reports`

```text
Create route `/staff/reports` as frames named `30 Staff Report Moderation`
using the authenticated App Shell.

Header uses eyebrow "Staff workspace", heading "Report moderation",
description about public-safe data and server-audited lifecycle actions, plus
secondary Dashboard action.

Place a labeled Status select above the queue with All statuses, Active,
Hidden, Withdrawn, and Closed. Queue entries use full-width white cards with
lost/found badge, lifecycle badge, item name, category, approximate location,
and contextual actions:
- Active: Hide and Close.
- Hidden: Restore and Close.
- Withdrawn or Closed: read-only status.

Actions use confirmation where impact is material and never expose claimant
evidence. Generate loading, empty, error, active queue, hidden queue, action
pending, and action-error frames. On mobile convert each row to a vertical
card with actions below the summary; avoid dense desktop tables.
```

### 31. Staff Matching Review - `/staff/matches`

```text
Create route `/staff/matches` as frames named `31 Staff Matching Review` using
the authenticated App Shell.

Header uses eyebrow "Staff workspace", heading "Matching review", description
"Inspect similarity output without using it as an ownership decision", and a
secondary Dashboard action.

Place a Review status select with Pending, Reviewed, and Dismissed. Show
matching cards in a two-column desktop grid. Each card contains a warning-tone
"NN% similar" badge, review-status badge, candidate item name, public
description, and contextual Mark reviewed and Dismiss actions only for pending
items.

Include a visible page-level note that review/dismissal categorizes matching
output and does not approve or reject ownership. Generate loading, empty,
error, pending, reviewed, dismissed, action-pending, and action-error frames.
Mobile stacks cards and keeps similarity visually secondary to item identity
and review status.
```

### 32. Staff Claim Queue - `/staff/claims`

```text
Create route `/staff/claims` as frames named `32 Staff Claim Queue` using the
authenticated App Shell.

Header uses eyebrow "Staff workspace", heading "Claim review", description
about restricted evidence and accountable decisions, and secondary Dashboard
action.

Place a Status filter with All statuses, Draft, Submitted, Under review, Needs
more info, Approved, Rejected, and Cancelled. Queue cards use a two-column
desktop grid and contain status badge, opaque claim ID, synthetic claimant
reference, last updated information, and secondary Review claim action.

Use restrained density and never preview private evidence, images, answers, or
similarity score in the queue. Generate loading, empty, error, populated mixed
status, and filtered frames. Mobile uses one card per row with clear status and
one primary destination.
```

### 33. Staff Claim Review - `/staff/claims/:claimId`

```text
Create route `/staff/claims/:claimId` as frames named `33 Staff Claim Review`
using the authenticated App Shell. This is a restricted review surface and
must look serious, clear, and auditable without becoming visually punitive.

Header uses eyebrow "Restricted review", dynamic heading such as "Claim under
review", description "Review private evidence independently from similarity
scores", and secondary Claim queue action.

Desktop composition:
- Main column lists restricted evidence cards. Each shows evidence type,
  private statement, and a Download action for authorized image evidence.
- Side rail shows claim status and a Decision reason textarea. Helper copy says
  a reason is required for Request more information and Reject, optional for
  approval.
- Contextual actions: Start review when submitted; Request more information;
  Approve claim; Reject claim. Disable actions according to current status and
  reason requirements.
- Needs-more-info state displays a waiting notice and no invalid decision
  actions.
- Approved state displays Create return arrangement.
- Permanent warning: match score is not ownership proof; decisions must use
  restricted evidence and policy.

Generate submitted, under-review, needs-more-info, approved, rejected,
evidence-download pending/error, decision pending/error, unavailable, and
create-return-success frames. Use confirmation dialogs for approval and
rejection. Mobile stacks evidence before decision controls and keeps restricted
content out of notifications or page previews.
```

### 34. Staff Return Queue - `/staff/returns`

```text
Create route `/staff/returns` as frames named `34 Staff Return Queue` using the
authenticated App Shell.

Header uses eyebrow "Staff workspace", heading "Return arrangements",
description about scheduling private pickup, confirming handoff, returning the
item, and closing the workflow, plus secondary Dashboard action.

Status filter includes All statuses, Scheduling, Scheduled, Picked up,
Returned, Closed, and Cancelled. Return cards use a two-column desktop grid and
show status badge, opaque return ID, related claim reference, optional scheduled
time summary, and secondary Manage return action.

Generate loading, empty, error, mixed queue, and each filtered status. Do not
show precise pickup locations or private notes in the queue. Mobile uses one
card per row with no horizontal overflow.
```

### 35. Staff Return Detail - `/staff/returns/:returnId`

```text
Create route `/staff/returns/:returnId` as frames named `35 Staff Return
Detail` using the authenticated App Shell.

Header uses eyebrow "Private handoff", dynamic heading such as "Return
scheduled", description that pickup details are limited to involved users and
authorized staff, and secondary Return queue action.

Desktop layout uses a broad detail/form card and 352px action rail:
- Summary shows status, opaque return ID, claim reference, pickup time, private
  pickup location, and private staff notes.
- Scheduling state includes labeled Pickup date and time, Private pickup
  location, Private staff notes, and primary Schedule pickup action.
- Side rail changes by lifecycle: Confirm pickup when scheduled, Mark returned
  when picked up, Close workflow when returned, Cancel return during scheduling
  or scheduled states, and Open timeline.
- Separate destructive cancellation from forward lifecycle actions.

Generate scheduling, scheduled, picked up, returned, closed, cancelled,
loading, unavailable, scheduling validation, action pending, and action-error
frames. Use explicit confirmations for handoff, completion, closure, and
cancellation. Mobile keeps private fields readable and places the current next
action after the summary rather than fixing controls over content.
```

### 36. Audit Events - `/admin/audit-events`

```text
Create route `/admin/audit-events` as frames named `36 Audit Events` using the
authenticated App Shell and an administrator role state.

Header uses eyebrow "Administrator", heading "Audit events", description
"Restricted audit history for workflow actions and accountable review", and a
secondary Staff dashboard action.

Display audit events as a readable vertical list of white cards rather than a
dense raw log table. Each event contains subject-type badge, action label,
timestamp, opaque subject ID, actor reference when authorized, and an optional
metadata disclosure. Metadata uses a bounded code-like block with horizontal
scroll only inside that block.

Add compact filters for subject type, action, and date only as design-ready
controls; do not invent search semantics or export behavior. Generate loading,
empty, administrator-only error, populated list, expanded metadata, and long
metadata overflow frames. Mobile turns each event into a labeled definition
list. Never expose tokens, passwords, authorization headers, claim secrets, or
raw database errors.
```

### 37. Page Not Found - `*`

```text
Create the wildcard route as frames named `37 Page Not Found` using the
authenticated App Shell when entered from application routes.

Center a compact empty state inside a maximum 672px content area. Use a compass
icon, heading "Page not found", and description "The address does not match a
LostLink frontend route." Add one primary Return home action.

Keep the page calm and useful. Do not use a large 404 illustration, joke copy,
search box, or fake suggestions. Mobile retains the same hierarchy with a
full-width action. Also create a public-shell variant for an unknown route
entered before authentication so Figma has both navigation contexts.
```

## Batch generation order

Generate in these batches to reduce style drift:

1. Foundations, components, and shared shells.
2. Guest Home, Privacy, Terms, Sign In, Create Account.
3. Recovery, Reset Password, Auth Callback, Onboarding.
4. Discovery Hub, AI Chat, Search, Item Detail, Help, Locations.
5. Report Hub, Lost Report, Found Report, Manage Report.
6. Potential Matches, Match Detail, Verification Guide.
7. My Claims, Start Claim, Claim Detail, Tracking, Notifications, Profile.
8. Staff Dashboard, all staff queues/details, Audit Events, Page Not Found.

Do not ask Stitch to generate all 37 routes in one request. Generate one batch
at a time, then correct component drift before continuing.

## Optional Thai localization pass

After all English primary frames are stable, use this prompt for each Figma
page family:

```text
Duplicate the selected LostLink frames as Thai localization stress tests. Keep
the exact component structure, spacing tokens, hierarchy, and responsive
behavior. Translate visible user-facing copy into natural Thai while keeping
opaque IDs, dates, statuses, and product name LostLink unchanged where
appropriate. Use Noto Sans Thai Variable for Thai glyph coverage. Allow labels
and headings to wrap; do not reduce font size, clip text, widen controls beyond
the viewport, or change the navigation model. Re-check form helper text,
notices, buttons, status badges, mobile bottom navigation, and dialog actions.
```

## Final acceptance checklist

- All 37 application routes have named desktop, tablet, and mobile frames.
- Public, auth, app, staff, and admin contexts use the correct shared shell.
- Repeated UI is built from shared Figma components and variants.
- Exact LostLink colors, fonts, radii, shadows, and spacing are preserved.
- Mobile layouts are recomposed intentionally and respect safe areas.
- AI similarity is never styled or worded as ownership proof.
- Public screens contain no private claim evidence, exact pickup information,
  reporter contact data, or staff notes.
- Private record errors do not reveal whether another user's record exists.
- Loading, empty, error, disabled, pending, and success states are included
  where specified.
- English and Thai content fit without clipping at a 320px-wide viewport and
  during browser zoom/reflow checks.
- Every interactive control has a visible label, focus state, and at least a
  44px target.
- Glass is limited to navigation, dialogs, and sheets; content cards stay
  solid and readable.
- Policy-dependent or backend-dependent capabilities are marked design-only
  rather than presented as implemented facts.

## Repository sources used

- `apps/web/src/routes/router.tsx`
- `apps/web/src/styles/tokens.css`
- `apps/web/src/index.css`
- `apps/web/src/layouts/AppShell.tsx`
- `apps/web/src/layouts/PublicLayout.tsx`
- `apps/web/src/pages/*`
- `apps/web/src/components/*`
- `docs/architecture/system-flow.md`
- `docs/api/lifecycle-api.md`
