# Plan: FirmLedger — Enterprise Transaction Recording PWA

## TL;DR
A mobile-first PWA for Indian firms to record financial transactions (Receipts, Payments, Journal, Sales, Purchase, Sales Return, Purchase Return) between parties, with admin-managed multi-tenant firm isolation, PDF receipt sharing, and accounting reports. Built with **React + Vite + TypeScript**, **MUI (Material UI)** for native mobile feel, **Zustand** for state, **Firebase** (Auth, Firestore, Storage) for backend, hosted on **Vercel**.



## Tech Stack Decisions

| Layer | Choice | Rationale |
|---|---|---|
| Framework | React 19 + Vite 6 | Fast builds, modern, PWA plugin support |
| Language | TypeScript (strict) | Enterprise-grade type safety |
| UI Library | **MUI v6 (Material UI)** | Best mobile-app feel — native-like bottom nav, FAB, swipeable drawers, form controls. Material Design is familiar to Android users (99% mobile user base in India) |
| State | **Zustand** | Lightweight, minimal boilerplate, perfect for small-to-medium app (20-50 firms, <2000 parties) |
| Routing | React Router v7 | De-facto standard, nested layouts |
| Forms | React Hook Form + Zod | Performant forms, schema-based validation |
| PDF | **@react-pdf/renderer** | React-native JSX API, well-maintained (1M+ weekly npm downloads), client-side, no server needed |
| Auth | Firebase Auth | Google Sign-In + Email/Password + Username mapping |
| Database | Cloud Firestore | Real-time, security rules for isolation, subcollections for tenancy |
| Storage | Firebase Storage | Firm logos |
| Hosting | Vercel | User's choice |
| PWA | vite-plugin-pwa (Workbox) | Service worker, manifest, install prompt |
| Date | dayjs | Lightweight, locale support for en-IN |
| Icons | MUI Icons + lucide-react | Consistent icon set |
| Charts | recharts | Lightweight charts for reports |

---

## Architecture Overview

### Multi-Tenant Data Isolation Model

```
Firestore Root
├── users/{userId}                          ← User profile (personal details)
├── usernames/{username}                    ← Username-to-UID mapping (for username login)
├── organizations/{orgId}                   ← Firm/Organization details
│   ├── parties/{partyId}                   ← Party masters (subcollection)
│   └── transactions/{transactionId}        ← Transactions (subcollection)
└── counters/{orgId}                        ← Auto-increment counters for SL No & Party Code
```

**Isolation strategy**: Parties and Transactions are **subcollections** under each organization. Firestore Security Rules enforce that only the organization owner can read/write their subcollections. Admin can read all organizations for approval workflow.

### Firebase Auth — Username Login Approach

Firebase doesn't natively support username/password. Solution:
1. During signup, user picks a username
2. Store mapping in `usernames/{username}` → `{ uid, email }`
3. On login with username, query the mapping to get email, then call `signInWithEmailAndPassword(email, password)`
4. Firestore Security Rule ensures username uniqueness (document ID = username)

---

## Firestore Schema

### `users/{userId}`
```
{
  uid: string,
  email: string,
  displayName: string,
  phone: string,
  address: string,
  city: string,
  pincode: string,
  userType: "admin" | "user",
  organizationId: string | null,     // linked org after creation
  profileComplete: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `usernames/{username}`
```
{
  uid: string,
  email: string
}
```

### `organizations/{orgId}`
```
{
  id: string,
  ownerId: string,                    // userId of the firm owner
  orgName: string,
  address: string,
  city: string,
  pincode: string,
  gstNumber: string,
  logoUrl: string | null,             // Firebase Storage URL
  status: "pending" | "approved" | "denied",
  approvedBy: string | null,          // admin userId
  approvedAt: Timestamp | null,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `organizations/{orgId}/parties/{partyId}`
```
{
  id: string,
  code: string,                        // unique within org, e.g., "P001"
  name: string,
  fatherName: string,
  address: string,
  town: string,
  phoneNumber: string,
  aadharNumber: string,               // stored encrypted at rest
  panNumber: string,
  gstNumber: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `organizations/{orgId}/transactions/{transactionId}`
```
{
  id: string,
  slNo: number,                        // auto-increment unique within org
  date: Timestamp,
  type: "receipt" | "payment" | "journal" | "sales" | "purchase" | "sales_return" | "purchase_return",
  fromPartyId: string,
  fromPartyName: string,               // denormalized for fast reads
  toPartyId: string,
  toPartyName: string,                 // denormalized for fast reads
  description: string,
  amount: number,                      // stored in paisa (integer) to avoid floating point
  createdBy: string,                   // userId
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### `counters/{orgId}`
```
{
  lastSlNo: number,                    // last used serial number
  lastPartyCode: number               // last used party code number
}
```

---

## Transaction Type — From/To Logic

| Type | From | To |
|---|---|---|
| Receipt | Party (who pays) | Organization (who receives) |
| Payment | Organization (who pays) | Party (who receives) |
| Journal | Party A | Party B |
| Sales | Organization (seller) | Party (buyer) |
| Purchase | Party (seller) | Organization (buyer) |
| Sales Return (CR) | Party (returns to) | Organization (receives back) |
| Purchase Return (DR) | Organization (returns to) | Party (receives back) |

The form dynamically swaps From/To field order and pre-fills Organization based on type.

---

## Folder Structure

```
firm-ledger/
├── public/
│   ├── manifest.json
│   ├── sw.js
│   ├── icons/                          # PWA icons (192x192, 512x512, maskable)
│   └── favicon.ico
├── src/
│   ├── main.tsx                        # Entry point
│   ├── App.tsx                         # Root component with providers
│   ├── router.tsx                      # Route definitions
│   ├── vite-env.d.ts
│   │
│   ├── config/
│   │   ├── firebase.ts                 # Firebase initialization (asia-south1/asia-south2)
│   │   ├── constants.ts                # App constants, transaction types enum
│   │   └── theme.ts                    # MUI theme customization (mobile-first)
│   │
│   ├── types/
│   │   ├── user.types.ts
│   │   ├── organization.types.ts
│   │   ├── party.types.ts
│   │   ├── transaction.types.ts
│   │   └── common.types.ts
│   │
│   ├── services/                       # Firebase data access layer
│   │   ├── auth.service.ts             # signup, login, googleSignIn, usernameLogin
│   │   ├── user.service.ts             # CRUD user profiles
│   │   ├── organization.service.ts     # CRUD organizations
│   │   ├── party.service.ts            # CRUD parties (scoped to org)
│   │   ├── transaction.service.ts      # CRUD transactions (scoped to org)
│   │   ├── counter.service.ts          # Auto-increment SL No & Party Code
│   │   ├── admin.service.ts            # Approve/deny orgs, list all orgs
│   │   └── storage.service.ts          # Upload/download firm logos
│   │
│   ├── stores/                         # Zustand stores
│   │   ├── authStore.ts                # Current user, auth state
│   │   ├── organizationStore.ts        # Current org details
│   │   ├── partyStore.ts               # Parties list, CRUD state
│   │   ├── transactionStore.ts         # Transactions list, filters
│   │   └── uiStore.ts                  # Loading, toasts, modals
│   │
│   ├── hooks/                          # Custom React hooks
│   │   ├── useAuth.ts                  # Auth state, login/logout
│   │   ├── useParties.ts               # Party CRUD operations
│   │   ├── useTransactions.ts          # Transaction CRUD + filters
│   │   ├── useOrganization.ts          # Org CRUD
│   │   ├── useAdmin.ts                 # Admin operations
│   │   └── usePDF.ts                   # PDF generation & sharing
│   │
│   ├── layouts/
│   │   ├── AuthLayout.tsx              # Centered card layout for login/signup
│   │   ├── AppLayout.tsx               # Main app shell: TopBar + Content + BottomNav
│   │   ├── AdminLayout.tsx             # Admin-specific layout
│   │   └── SafeAreaWrapper.tsx         # Handles PWA safe areas (notch, bottom bar)
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SignupPage.tsx
│   │   │   └── ProfileSetupPage.tsx    # Post-signup profile form
│   │   │
│   │   ├── onboarding/
│   │   │   ├── OrganizationSetupPage.tsx   # Create org after profile
│   │   │   └── PendingApprovalPage.tsx     # Shown while awaiting admin approval
│   │   │
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx       # Summary stats, quick actions
│   │   │
│   │   ├── party/
│   │   │   ├── PartiesListPage.tsx     # List all parties with search
│   │   │   ├── AddPartyPage.tsx        # Add party form
│   │   │   └── EditPartyPage.tsx       # Edit party form
│   │   │
│   │   ├── transaction/
│   │   │   ├── TransactionsListPage.tsx    # List with filters (date range, type, search)
│   │   │   ├── RecordTransactionPage.tsx   # Record new transaction
│   │   │   ├── EditTransactionPage.tsx     # Edit existing transaction
│   │   │   └── TransactionDetailPage.tsx   # Detail view + PDF share
│   │   │
│   │   ├── reports/
│   │   │   ├── ReportsPage.tsx         # Reports hub/menu
│   │   │   ├── BalanceSheetPage.tsx    # Balance sheet report
│   │   │   ├── LedgerPage.tsx          # Party-wise ledger
│   │   │   ├── ChecklistPage.tsx       # Audit checklist
│   │   │   └── MonthlyReportPage.tsx   # Month-wise summary
│   │   │
│   │   ├── settings/
│   │   │   ├── SettingsPage.tsx        # Settings hub
│   │   │   ├── PersonalDetailsPage.tsx # Edit personal info
│   │   │   └── OrganizationDetailsPage.tsx # Edit org info + logo
│   │   │
│   │   ├── admin/
│   │   │   ├── AdminDashboardPage.tsx  # Admin overview
│   │   │   ├── FirmManagementPage.tsx  # Approve/deny firms
│   │   │   └── FirmDetailPage.tsx      # View firm details
│   │   │
│   │   └── NotFoundPage.tsx
│   │
│   ├── components/                     # Reusable UI components
│   │   ├── common/
│   │   │   ├── BottomNavigation.tsx    # 4-tab bottom nav (Dashboard, Parties, Transactions, More)
│   │   │   ├── TopAppBar.tsx           # App bar with org name, back button
│   │   │   ├── LoadingScreen.tsx       # Full-screen loading
│   │   │   ├── EmptyState.tsx          # Empty list placeholder
│   │   │   ├── ConfirmDialog.tsx       # Reusable confirm modal
│   │   │   ├── SearchBar.tsx           # Mobile search input
│   │   │   ├── FilterChips.tsx         # Transaction type filter chips
│   │   │   ├── DateRangePicker.tsx     # From-To date picker
│   │   │   ├── FloatingActionButton.tsx # FAB for add actions
│   │   │   ├── PullToRefresh.tsx       # Pull-to-refresh wrapper
│   │   │   └── StatusBadge.tsx         # Approved/Pending/Denied badge
│   │   │
│   │   ├── party/
│   │   │   ├── PartyForm.tsx           # Shared form for add/edit party
│   │   │   ├── PartyCard.tsx           # Party list item card
│   │   │   └── PartySelector.tsx       # Searchable party picker for transaction form
│   │   │
│   │   ├── transaction/
│   │   │   ├── TransactionForm.tsx     # Dynamic form (swaps From/To based on type)
│   │   │   ├── TransactionCard.tsx     # Transaction list item
│   │   │   ├── TransactionTypeSelect.tsx # Dropdown for 7 types
│   │   │   ├── TransactionFilters.tsx  # Filter panel (date, type, search)
│   │   │   └── AmountDisplay.tsx       # INR formatted amount
│   │   │
│   │   ├── pdf/
│   │   │   ├── ReceiptDocument.tsx     # @react-pdf/renderer receipt template
│   │   │   └── ReportDocument.tsx      # @react-pdf/renderer report template
│   │   │
│   │   ├── admin/
│   │   │   ├── FirmApprovalCard.tsx    # Firm card with approve/deny buttons
│   │   │   └── FirmStats.tsx           # Admin dashboard stats
│   │   │
│   │   └── settings/
│   │       ├── PersonalDetailsForm.tsx
│   │       └── OrganizationDetailsForm.tsx
│   │
│   ├── utils/
│   │   ├── formatters.ts              # Currency (INR), date, amount-in-words
│   │   ├── validators.ts              # Aadhar, PAN, GST, phone validators
│   │   └── helpers.ts                 # Misc helpers
│   │
│   └── guards/
│       ├── AuthGuard.tsx              # Redirect to login if not authenticated
│       ├── ApprovedGuard.tsx          # Redirect to pending page if org not approved
│       ├── AdminGuard.tsx             # Redirect if not admin
│       └── ProfileCompleteGuard.tsx   # Redirect to profile setup if incomplete
│
├── index.html
├── vite.config.ts                      # Vite + PWA plugin config
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── package.json
├── .env                                # Firebase config keys
├── .env.example
├── .eslintrc.cjs
├── .prettierrc
├── firestore.rules                     # Firestore security rules
├── firestore.indexes.json              # Composite indexes
├── storage.rules                       # Storage security rules
└── firebase.json                       # Firebase project config
```

---

## Screen Flow & Navigation

### Authentication Flow
```
Login/Signup
    ↓ (first time)
Profile Setup Form (name, email, phone, address, city, pincode)
    ↓
Organization Setup Form (org name, address, city, pincode, GST, logo upload)
    ↓
Pending Approval Screen ("Your firm is awaiting admin approval")
    ↓ (admin approves)
Dashboard (main app)
```

### Main App — Bottom Navigation (4 tabs)
```
┌─────────────────────────────────────┐
│  [TopAppBar: Org Name | Settings ⚙] │
│                                     │
│         [Page Content Area]         │
│                                     │
│                                     │
│  [FAB: + Add Party / Transaction]   │
│                                     │
├─────────────────────────────────────┤
│ 🏠 Home | 👥 Parties | 💰 Trans | ⋯ More │
└─────────────────────────────────────┘
```

**Tab 1 — Home/Dashboard**: Quick stats (total parties, today's transactions, recent activity)
**Tab 2 — Parties**: Party list with search + FAB to add party
**Tab 3 — Transactions**: Transaction list with filters + FAB to record transaction
**Tab 4 — More**: Reports, Settings, Logout

### Admin Bottom Navigation (different tabs)
```
│ 🏠 Dashboard | 🏢 Firms | 👥 Parties | 💰 Trans | ⋯ More │
```
Admin sees an extra "Firms" tab for approval management.

---

## PWA Configuration

### Safe Area Handling
- Use `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)` CSS variables
- Bottom navigation gets `padding-bottom: env(safe-area-inset-bottom)`
- Top app bar gets `padding-top: env(safe-area-inset-top)`
- Content area scrolls independently within safe bounds

### manifest.json
```
{
  "name": "FirmLedger Accounts",
  "short_name": "FirmLedger",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#1976d2",
  "background_color": "#ffffff",
  "start_url": "/",
  "scope": "/",
  "icons": [...]
}
```

### vite-plugin-pwa Config
- **Strategy**: generateSW (Workbox)
- **Runtime caching**: Cache Firebase Firestore reads, images/logos
- **Precache**: App shell (HTML, CSS, JS, fonts)
- **Install prompt**: Custom MUI Banner for "Add to Home Screen"

---

## Firebase Configuration

### Region
- **Firestore**: `asia-south1` (Mumbai) — lowest latency for Indian users
- **Storage**: `asia-south1` (Mumbai)
- **Auth**: Global (Firebase Auth is always global)

### Firestore Security Rules (Key Rules)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if isAdmin();
    }

    // Username mapping — anyone authenticated can read, create only if not exists
    match /usernames/{username} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && !exists(/databases/$(database)/documents/usernames/$(username));
    }

    // Organizations — owner can read/write, admin can read all and update status
    match /organizations/{orgId} {
      allow read: if request.auth != null && (resource.data.ownerId == request.auth.uid || isAdmin());
      allow create: if request.auth != null;
      allow update: if request.auth != null && (resource.data.ownerId == request.auth.uid || isAdmin());

      // Parties — only org owner
      match /parties/{partyId} {
        allow read, write: if request.auth != null && getOrg(orgId).data.ownerId == request.auth.uid;
        allow read: if isAdmin();
      }

      // Transactions — only org owner
      match /transactions/{transactionId} {
        allow read, write: if request.auth != null && getOrg(orgId).data.ownerId == request.auth.uid;
        allow read: if isAdmin();
      }
    }

    // Counters — only org owner
    match /counters/{orgId} {
      allow read, write: if request.auth != null && getOrg(orgId).data.ownerId == request.auth.uid;
    }

    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'admin';
    }

    function getOrg(orgId) {
      return get(/databases/$(database)/documents/organizations/$(orgId));
    }
  }
}
```

### Firestore Composite Indexes
1. `organizations/{orgId}/transactions` — `type ASC, date DESC` (filter by type + sort by date)
2. `organizations/{orgId}/transactions` — `date DESC` (sort by date)
3. `organizations/{orgId}/parties` — `name ASC` (alphabetical party list)

---

## PDF Receipt Template

### Layout (Indian Accounting Voucher Style)
```
┌─────────────────────────────────────────────┐
│  [FIRM LOGO]   ORGANIZATION NAME            │
│               Address, City - Pincode        │
│               GST: XXXXXXXXXXXX              │
├─────────────────────────────────────────────┤
│         RECEIPT / PAYMENT VOUCHER            │
│                                              │
│  Voucher No: SL-001        Date: 11/03/2026 │
├─────────────────────────────────────────────┤
│  From: Party Name                            │
│  To:   Organization Name                    │
│                                              │
│  Description:                                │
│  Payment for goods received                  │
│                                              │
│  Amount: ₹ 25,000.00                        │
│  (Rupees Twenty-Five Thousand Only)          │
├─────────────────────────────────────────────┤
│  Authorized Signatory                        │
└─────────────────────────────────────────────┘
```

- Built with `@react-pdf/renderer` using `<Document>`, `<Page>`, `<View>`, `<Text>`, `<Image>`
- Org logo fetched from Firebase Storage
- Amount in words using a utility function (Indian numbering: lakhs/crores)
- Share via Web Share API (WhatsApp, Email) — `navigator.share({ files: [pdfBlob] })`

---

## MUI Theme (Mobile-First)

```typescript
// Key theme customizations
{
  palette: {
    primary: { main: '#1565C0' },        // Professional blue
    secondary: { main: '#2E7D32' },      // Green for money/positive
    error: { main: '#C62828' },          // Red for debit/negative
    background: { default: '#F5F5F5' },  // Light gray background
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    // Slightly larger touch targets on mobile
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { minHeight: 48, borderRadius: 12 } // Larger touch target
      }
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', fullWidth: true }
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 16 }  // Rounded modern cards
      }
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: { paddingBottom: 'env(safe-area-inset-bottom)' }
      }
    }
  }
}
```

---

## Implementation Steps

### Phase 0: Project Scaffolding
1. Initialize Vite + React + TypeScript project
2. Install all dependencies (MUI, Firebase, Zustand, React Router, React Hook Form, Zod, @react-pdf/renderer, vite-plugin-pwa, dayjs, recharts)
3. Configure MUI theme, Firebase initialization (`asia-south1`), environment variables
4. Set up PWA manifest, icons, service worker config
5. Set up ESLint + Prettier
6. Create folder structure as defined above
7. Define all TypeScript types (`types/` directory)

### Phase 1: Authentication & User Management
8. Implement Firebase Auth service (Google sign-in, email/password signup/login)
9. Implement username-to-email mapping for username login
10. Build `AuthLayout.tsx` — centered card layout for auth pages
11. Build `LoginPage.tsx` — Google button + email/password or username/password form
12. Build `SignupPage.tsx` — Google button + email/password + username registration
13. Build `ProfileSetupPage.tsx` — collect name, email, phone, address, city, pincode
14. Implement `AuthGuard`, `ProfileCompleteGuard` route guards
15. Build `authStore.ts` — Zustand store for auth state, listener on `onAuthStateChanged`

### Phase 2: Organization/Firm Setup & Approval
16. Build `OrganizationSetupPage.tsx` — org name, address, city, pincode, GST, logo upload
17. Implement `organization.service.ts` — create org, update org, upload logo
18. Build `PendingApprovalPage.tsx` — waiting screen with status polling
19. Implement `ApprovedGuard.tsx` — redirect to pending if org not approved
20. Build `AdminDashboardPage.tsx` — count of pending firms, total firms, total users
21. Build `FirmManagementPage.tsx` — list firms with status filter, approve/deny buttons
22. Build `FirmDetailPage.tsx` — view firm details before approval
23. Implement `admin.service.ts` — list all orgs, approve/deny org status
24. Build `AdminGuard.tsx` — restrict admin routes

### Phase 3: App Shell & Navigation
25. Build `SafeAreaWrapper.tsx` — handles PWA safe area insets
26. Build `TopAppBar.tsx` — org name, back button, settings gear
27. Build `BottomNavigation.tsx` — 4-tab navigation (Home, Parties, Transactions, More)
28. Build `AppLayout.tsx` — combines SafeArea + TopBar + Content + BottomNav
29. Build `AdminLayout.tsx` — admin variant with 5 tabs
30. Configure `router.tsx` — nested routes with guards and layouts

### Phase 4: Party Management (Masters)
31. Define Zod validation schemas for party (Aadhar: 12 digits, PAN: AAAAA9999A, GST: 15 chars, phone: 10 digits)
32. Implement `party.service.ts` — CRUD parties scoped to org subcollection
33. Implement `counter.service.ts` — auto-increment party code using Firestore transaction
34. Build `PartyForm.tsx` — reusable form component (code/name/fatherName/address/town/phone/aadhar/pan/gst)
35. Build `AddPartyPage.tsx` — form with auto-generated code
36. Build `EditPartyPage.tsx` — pre-filled form
37. Build `PartyCard.tsx` — list item showing code, name, town
38. Build `PartiesListPage.tsx` — searchable list + FAB
39. Build `PartySelector.tsx` — searchable dropdown for transaction form
40. Build `partyStore.ts` — Zustand store for parties list and CRUD state

### Phase 5: Transaction Recording
41. Define Zod validation schema for transaction
42. Implement `transaction.service.ts` — CRUD transactions scoped to org, auto-increment SL No using Firestore transaction (atomic)
43. Build `TransactionTypeSelect.tsx` — dropdown with all 7 types
44. Build `TransactionForm.tsx` — dynamic form that swaps From/To based on selected type, uses `PartySelector` for party fields, `DatePicker` for date, amount with INR formatting
45. Build `RecordTransactionPage.tsx` — full-page form
46. Build `EditTransactionPage.tsx` — pre-filled form for editing
47. Build `TransactionCard.tsx` — list item showing SL No, date, type badge, from→to, amount
48. Build `TransactionFilters.tsx` — date range picker + type filter chips + SL No search
49. Build `TransactionsListPage.tsx` — filterable, searchable list + FAB
50. Build `TransactionDetailPage.tsx` — full detail view with share button
51. Build `transactionStore.ts` — Zustand store with filter state

### Phase 6: PDF Generation & Sharing
52. Build `ReceiptDocument.tsx` — @react-pdf/renderer template with firm logo, org details header, voucher layout, amount in words (Indian numbering)
53. Implement `formatAmountInWords()` utility — Indian numbering (lakhs, crores)
54. Implement `formatINR()` utility — ₹ symbol, comma formatting (Indian: 1,00,000)
55. Build PDF generation hook `usePDF.ts` — generate blob, trigger download or share
56. Implement Web Share API integration — share PDF via WhatsApp/Email using `navigator.share()`
57. Fallback for browsers without Web Share API — download PDF button

### Phase 7: Reports
58. Build `ReportsPage.tsx` — hub with cards linking to each report type
59. Build `LedgerPage.tsx` — party-wise ledger: select party → show all transactions for that party with running balance, date range filter
60. Build `BalanceSheetPage.tsx` — summary of all parties showing total debit, credit, net balance per party
61. Build `MonthlyReportPage.tsx` — month-wise aggregation using recharts bar/line chart + table
62. Build `ChecklistPage.tsx` — audit checklist showing transaction counts by type, totals, any discrepancies
63. Build `ReportDocument.tsx` — @react-pdf/renderer template for exporting reports as PDF

### Phase 8: Settings
64. Build `SettingsPage.tsx` — hub with links to personal details, org details, logout
65. Build `PersonalDetailsPage.tsx` — edit name, phone, address, city, pincode
66. Build `OrganizationDetailsPage.tsx` — edit org name, address, GST, logo

### Phase 9: Polish & PWA
67. Add pull-to-refresh on list pages
68. Add empty state illustrations for empty lists
69. Add loading skeletons (MUI Skeleton) for data loading states
70. Add toast notifications (MUI Snackbar) for success/error feedback
71. Add "Add to Home Screen" install prompt banner
72. Test and fix PWA safe area spacing on iOS Safari and Android Chrome
73. Add proper 404 page
74. Performance: lazy-load routes with `React.lazy()` + `Suspense`

### Phase 10: Security & Deployment
75. Write Firestore security rules (as defined above) and deploy
76. Write Storage security rules (only org owner can upload to their org's folder)
77. Set up Firestore composite indexes
78. Configure `.env` with Firebase config (never commit API keys to repo)
79. Deploy to Vercel — configure build command, environment variables
80. Test complete flow end-to-end on mobile devices

---

## Relevant Files (Key Implementation References)

- `src/config/firebase.ts` — Firebase app initialization with `asia-south1` region
- `src/config/theme.ts` — MUI theme with mobile-first customizations, safe areas
- `src/config/constants.ts` — Transaction types enum, validation patterns
- `src/types/*.ts` — All TypeScript interfaces
- `src/services/auth.service.ts` — Google sign-in, email/password, username login mapping
- `src/services/counter.service.ts` — Firestore transactions for atomic auto-increment (SL No, Party Code)
- `src/services/transaction.service.ts` — CRUD with subcollection queries, composite filters
- `src/components/transaction/TransactionForm.tsx` — Core form with dynamic From/To swap logic
- `src/components/pdf/ReceiptDocument.tsx` — PDF receipt with org logo, amount in words
- `src/components/common/BottomNavigation.tsx` — 4-tab nav with safe area padding
- `src/layouts/SafeAreaWrapper.tsx` — PWA safe area CSS handling
- `src/guards/*.tsx` — Auth, profile, approval, admin route guards
- `src/utils/formatters.ts` — INR formatting, amount in words (Indian numbering), date formatting
- `src/utils/validators.ts` — Aadhar (12 digits), PAN (AAAAA9999A), GST (15 chars), phone (10 digits)
- `firestore.rules` — Security rules for multi-tenant isolation
- `vite.config.ts` — PWA plugin configuration with Workbox

---

## Verification

1. **Auth flow**: Sign up with Google → redirected to profile form → fill details → redirected to org setup → submit → see pending approval screen → admin approves → refresh → see dashboard
2. **Auth flow (email)**: Sign up with email/password + username → same flow. Then logout → login with username/password → success
3. **Data isolation**: Create 2 test firms → firm A adds parties → firm B cannot see firm A's parties (verify in Firestore console and app)
4. **Party CRUD**: Add party with all fields including Aadhar/PAN/GST → verify validation → edit party → verify update → search by name → found
5. **Transaction recording**: Select each of the 7 types → verify From/To swap correctly → submit → verify SL No auto-increments → verify in Firestore subcollection
6. **Transaction filters**: Filter by date range → only matching shown. Filter by type → only that type shown. Search by SL No → exact match found
7. **PDF receipt**: Record transaction → view detail → tap share → PDF generated with org logo, name, address, GST, voucher details, amount in words → share via WhatsApp/Email
8. **Reports**: Add 10+ test transactions → Balance Sheet shows correct totals per party → Ledger for specific party shows correct running balance → Monthly report aggregates correctly
9. **Admin approval**: Admin login → see pending firms → approve one, deny another → approved firm can access app, denied firm sees denied message
10. **PWA mobile**: Open in Chrome Android → "Add to Home Screen" prompt appears → install → opens standalone (no browser chrome) → bottom nav doesn't overlap system nav bar → top bar doesn't overlap notch/status bar
11. **PWA iOS**: Open in Safari iOS → Add to Home Screen → same safe area checks
12. **Firestore rules**: Use Firebase emulator or rules playground → verify unauthorized access is denied for cross-org reads

---

## Decisions

- **Amount storage**: Store in **paisa (integer)** to avoid floating-point issues. Display converts paisa → rupees.
- **Party name denormalization**: Store `fromPartyName` and `toPartyName` directly on transaction documents for fast list rendering without joins. Update on party name change.
- **Username login**: Implemented via Firestore `usernames` collection mapping. Not a native Firebase feature — custom lookup layer.
- **No Cloud Functions**: All logic client-side to keep costs zero/minimal on Firebase free tier. Auto-increment uses Firestore transactions (atomic client-side).
- **No offline mode**: Online-only as per user's choice. PWA caches app shell but not data.
- **English only**: No i18n setup needed.
- **No notifications**: Admin manually checks for pending firms.
- **Single org per user**: One-to-one relationship between user and organization.
- **Scope included**: Auth, CRUD parties, CRUD transactions, 7 transaction types, PDF receipts with sharing, 4 report types, admin approval, settings, PWA.
- **Scope excluded**: Multi-currency, offline data sync, push notifications, multi-language, audit logs, role-based access within a firm (only owner model).
