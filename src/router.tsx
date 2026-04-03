import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

import AuthGuard from './guards/AuthGuard';
import ProfileCompleteGuard from './guards/ProfileCompleteGuard';
import ApprovedGuard from './guards/ApprovedGuard';
import AdminGuard from './guards/AdminGuard';
import SuperAdminGuard from './guards/SuperAdminGuard';

import AuthLayout from './layouts/AuthLayout';
import AppLayout from './layouts/AppLayout';

import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ProfileSetupPage from './pages/auth/ProfileSetupPage';
import OrganizationSetupPage from './pages/onboarding/OrganizationSetupPage';
import PendingApprovalPage from './pages/onboarding/PendingApprovalPage';

import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import FirmManagementPage from './pages/admin/FirmManagementPage';
import FirmDetailPage from './pages/admin/FirmDetailPage';
import UserManagementPage from './pages/admin/UserManagementPage';
const lazyWithRetry = (componentImport: () => Promise<any>) =>
    lazy(async () => {
        const pageHasAlreadyBeenForceRefreshed = JSON.parse(
            window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
        );
        try {
            const component = await componentImport();
            window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
            return component;
        } catch (error: any) {
            if (!pageHasAlreadyBeenForceRefreshed && (error?.message?.includes('fetch dynamically imported module') || error?.message?.includes('Importing a module script failed'))) {
                window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
                window.location.reload();
                return new Promise(() => {});
            }
            throw error;
        }
    });

const SuperAdminDashboardPage = lazyWithRetry(() => import('./pages/super-admin/SuperAdminDashboardPage'));

import { useAuthStore } from './stores/authStore';

const DashboardPage = lazyWithRetry(() => import('./pages/dashboard/DashboardPage'));
const PartiesListPage = lazyWithRetry(() => import('./pages/party/PartiesListPage'));
const AddPartyPage = lazyWithRetry(() => import('./pages/party/AddPartyPage'));
const EditPartyPage = lazyWithRetry(() => import('./pages/party/EditPartyPage'));

const TransactionsListPage = lazyWithRetry(() => import('./pages/transaction/TransactionsListPage'));
const RecordTransactionPage = lazyWithRetry(() => import('./pages/transaction/RecordTransactionPage'));
const EditTransactionPage = lazyWithRetry(() => import('./pages/transaction/EditTransactionPage'));
const TransactionDetailPage = lazyWithRetry(() => import('./pages/transaction/TransactionDetailPage'));

const ReportsPage = lazyWithRetry(() => import('./pages/reports/ReportsPage'));
const LedgerPage = lazyWithRetry(() => import('./pages/reports/LedgerPage'));
const BalanceSheetPage = lazyWithRetry(() => import('./pages/reports/BalanceSheetPage'));
const MonthlyReportPage = lazyWithRetry(() => import('./pages/reports/MonthlyReportPage'));
const ChecklistPage = lazyWithRetry(() => import('./pages/reports/ChecklistPage'));
const TradingReportPage = lazyWithRetry(() => import('./pages/reports/TradingReportPage'));
const PLReportPage = lazyWithRetry(() => import('./pages/reports/PLReportPage'));
const TrialBalancePage = lazyWithRetry(() => import('./pages/reports/TrialBalancePage'));

const SettingsPage = lazyWithRetry(() => import('./pages/settings/SettingsPage'));
const SecurityPage = lazyWithRetry(() => import('./pages/settings/SecurityPage'));
const OrganizationDetailsPage = lazyWithRetry(() => import('./pages/settings/OrganizationDetailsPage'));
const ManageMembersPage = lazyWithRetry(() => import('./pages/settings/ManageMembersPage'));

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
    <Suspense fallback={<Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>}>
        {children}
    </Suspense>
);

const HomeRedirect = () => {
    const { user, profile, loading, initialized } = useAuthStore();
    
    if (!initialized || loading || (user && !profile)) return (
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
            <CircularProgress />
        </Box>
    );

    if (profile?.userType === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (profile?.userType === 'super-admin') return <Navigate to="/super-admin" replace />;
    
    // Efficiency: Bypass /dashboard hop and go straight to pending screen
    if (profile?.status === 'pending' || profile?.status === 'denied') {
        return <Navigate to="/pending-approval" replace />;
    }

    return <Navigate to="/dashboard" replace />;
};

export const router = createBrowserRouter([
    {
        element: <AuthLayout />,
        children: [
            { path: '/login', element: <LoginPage /> },
            { path: '/accountCreateSecure', element: <SignupPage /> },
            { path: '/forgot-password', element: <ForgotPasswordPage /> },
        ]
    },
    {
        element: <AuthGuard />,
        children: [
            {
                element: <AuthLayout />,
                children: [
                    { path: '/setup-profile', element: <ProfileSetupPage /> },
                    { path: '/setup-organization', element: <OrganizationSetupPage /> },
                    { path: '/pending-approval', element: <PendingApprovalPage /> },
                ]
            },
            {
                element: <ProfileCompleteGuard />,
                children: [
                    {
                        element: <AppLayout />,
                        children: [
                            { path: '/', element: <HomeRedirect /> },

                            {
                                element: <AdminGuard />,
                                children: [
                                    { path: '/admin/dashboard', element: <AdminDashboardPage /> },
                                    { path: '/admin/organizations', element: <FirmManagementPage /> },
                                    { path: '/admin/organizations/:id', element: <FirmDetailPage /> },
                                    { path: '/admin/users', element: <SuspenseWrapper><UserManagementPage /></SuspenseWrapper> },
                                ]
                            },
                            {
                                element: <SuperAdminGuard />,
                                children: [
                                    { path: '/super-admin', element: <SuspenseWrapper><SuperAdminDashboardPage /></SuspenseWrapper> },
                                ]
                            },

                            {
                                element: <ApprovedGuard />,
                                children: [
                                    { path: '/dashboard', element: <SuspenseWrapper><DashboardPage /></SuspenseWrapper> },

                                    { path: '/parties', element: <SuspenseWrapper><PartiesListPage /></SuspenseWrapper> },
                                    { path: '/parties/add', element: <SuspenseWrapper><AddPartyPage /></SuspenseWrapper> },
                                    { path: '/parties/edit/:id', element: <SuspenseWrapper><EditPartyPage /></SuspenseWrapper> },

                                    { path: '/transactions', element: <SuspenseWrapper><TransactionsListPage /></SuspenseWrapper> },
                                    { path: '/transactions/record', element: <SuspenseWrapper><RecordTransactionPage /></SuspenseWrapper> },
                                    { path: '/transactions/edit/:id', element: <SuspenseWrapper><EditTransactionPage /></SuspenseWrapper> },
                                    { path: '/transactions/:id', element: <SuspenseWrapper><TransactionDetailPage /></SuspenseWrapper> },

                                    { path: '/reports', element: <SuspenseWrapper><ReportsPage /></SuspenseWrapper> },
                                    { path: '/reports/ledger', element: <SuspenseWrapper><LedgerPage /></SuspenseWrapper> },
                                    { path: '/reports/balance-sheet', element: <SuspenseWrapper><BalanceSheetPage /></SuspenseWrapper> },
                                    { path: '/reports/monthly', element: <SuspenseWrapper><MonthlyReportPage /></SuspenseWrapper> },
                                    { path: '/reports/checklist', element: <SuspenseWrapper><ChecklistPage /></SuspenseWrapper> },
                                    { path: '/reports/trading', element: <SuspenseWrapper><TradingReportPage /></SuspenseWrapper> },
                                    { path: '/reports/pl', element: <SuspenseWrapper><PLReportPage /></SuspenseWrapper> },
                                    { path: '/reports/trial-balance', element: <SuspenseWrapper><TrialBalancePage /></SuspenseWrapper> },
                                ]
                            },

                            { path: '/settings', element: <SuspenseWrapper><SettingsPage /></SuspenseWrapper> },
                            { path: '/settings/security', element: <SuspenseWrapper><SecurityPage /></SuspenseWrapper> },
                            { path: '/settings/organization', element: <SuspenseWrapper><OrganizationDetailsPage /></SuspenseWrapper> },
                            { path: '/settings/members', element: <SuspenseWrapper><ManageMembersPage /></SuspenseWrapper> },
                        ]
                    }
                ]
            }
        ]
    },
    {
        path: '*',
        element: <Box p={3} textAlign="center"><h2>404 - Not Found</h2></Box>
    }
]);
