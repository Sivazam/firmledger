# Viswa Ledger - Project Context

## Project Overview
**Viswa Ledger** is a comprehensive financial ledger and accounting application designed for businesses and administrative users. It was originally named "FirmLedger" and has undergone a full rebranding and architectural hardening to support multiple organizations and strictly enforced role-based access.

## Tech Stack
- **Frontend**: React (TypeScript), Vite, Material UI (MUI).
- **Backend**: Firebase (Firestore, Authentication, Storage).
- **State Management**: Zustand (AuthStore, OrganizationStore, TransactionStore, PartyStore).
- **Routing**: React Router v6 with hierarchical role-based guards.
- **Styling**: Vanilla CSS and MUI System/Theming.

## Role Architecture
1. **Super Admin**: 
   - Global oversight.
   - Access to dedicated Super Admin console.
   - Bypasses standard user onboarding.
2. **Admin**:
   - Manages multiple organizations.
   - Approves/Rejects organization requests from standard users.
   - Viswa Ledger Admin branding in header.
   - Streamlined UI (direct "Profile" access, filtered management lists).
3. **User**:
   - Manages a single organization.
   - Records transactions, adds parties, and generates financial reports.
   - Subject to approval by Admins.

## Core Entities & Workflows
- **Organizations**: The central container for all business data. Formerly referred to as "Firms".
- **Parties**: Customers, Vendors, and internal ledgers (CASH, SALE, PURC, etc.).
- **Transactions**: 
   - Types: Cash Receipt/Payment, Bank Receipt/Payment, Sales, Purchase, Sales Return, Purchase Return, Journal Voucher.
   - Flow: Synchronized "From" and "To" assignments to align with standard accounting (Dr/Cr) and user-centric UI.
- **Onboarding**: 
   - Auth -> Profile Setup -> Organization Setup -> Pending Approval -> Dashboard.
   - Hardened with loading states ("Identity-Wait") to prevent UI flickering.

## Recent Major Milestones
- **Global Rebranding**: Replaced all "Firm" and "FirmLedger" references with "Organization" and "Viswa Ledger".
- **Route Synchronization**: Migrated admin routes to `/admin/organizations` and repaired deep-linking 404s.
- **Data Filtering**: The Admin Dashboard now strictly filters out administrative-owned organizations, focusing exclusively on legitimate user requests.
- **Transaction Alignment**: Refined `TransactionForm` to ensure Sales (SI) and Purchase (PI) result in "To Party" selection, while Returns (SR/PR) result in "From Party" selection.

## Critical Files
- `src/router.tsx`: Role-based route definitions and guards.
- `src/components/transaction/TransactionForm.tsx`: Core logic for recording financial data.
- `src/services/admin.service.ts`: Backend logic for administrative filtering and organization management.
- `src/stores/authStore.ts`: Global authentication and profile state.
