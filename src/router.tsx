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
const SuperAdminDashboardPage = lazy(() => import('./pages/super-admin/SuperAdminDashboardPage'));

import { useAuthStore } from './stores/authStore';

const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const PartiesListPage = lazy(() => import('./pages/party/PartiesListPage'));
const AddPartyPage = lazy(() => import('./pages/party/AddPartyPage'));
const EditPartyPage = lazy(() => import('./pages/party/EditPartyPage'));

const TransactionsListPage = lazy(() => import('./pages/transaction/TransactionsListPage'));
const RecordTransactionPage = lazy(() => import('./pages/transaction/RecordTransactionPage'));
const EditTransactionPage = lazy(() => import('./pages/transaction/EditTransactionPage'));
const TransactionDetailPage = lazy(() => import('./pages/transaction/TransactionDetailPage'));

const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'));
const LedgerPage = lazy(() => import('./pages/reports/LedgerPage'));
const BalanceSheetPage = lazy(() => import('./pages/reports/BalanceSheetPage'));
const MonthlyReportPage = lazy(() => import('./pages/reports/MonthlyReportPage'));
const ChecklistPage = lazy(() => import('./pages/reports/ChecklistPage'));
const TradingReportPage = lazy(() => import('./pages/reports/TradingReportPage'));
const PLReportPage = lazy(() => import('./pages/reports/PLReportPage'));

const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const PersonalDetailsPage = lazy(() => import('./pages/settings/PersonalDetailsPage'));
const OrganizationDetailsPage = lazy(() => import('./pages/settings/OrganizationDetailsPage'));

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
    <Suspense fallback={<Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>}>
        {children}
    </Suspense>
);

const HomeRedirect = () => {
    const { profile, isAdminMode } = useAuthStore();
    if (profile?.userType === 'admin' && isAdminMode) return <Navigate to="/admin/dashboard" replace />;
    if (profile?.userType === 'super-admin') return <Navigate to="/super-admin" replace />;
    return <Navigate to="/dashboard" replace />;
};

export const router = createBrowserRouter([
    {
        element: <AuthLayout />,
        children: [
            { path: '/login', element: <LoginPage /> },
            { path: '/signup', element: <SignupPage /> },
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
                                    { path: '/admin/firms', element: <FirmManagementPage /> },
                                    { path: '/admin/firms/:id', element: <FirmDetailPage /> },
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
                                ]
                            },

                            { path: '/settings', element: <SuspenseWrapper><SettingsPage /></SuspenseWrapper> },
                            { path: '/settings/personal', element: <SuspenseWrapper><PersonalDetailsPage /></SuspenseWrapper> },
                            { path: '/settings/organization', element: <SuspenseWrapper><OrganizationDetailsPage /></SuspenseWrapper> },
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
