// src/router/index.js
import AppLayout from '@/layout/AppLayout.vue';
import { api } from '@/service/axios';
import LoadingService from "../service/Loading";

import { createRouter, createWebHashHistory } from 'vue-router';
// Utility to match routes (aligned with backend logic)
const matchRoute = (routePattern, url) => {
    const pattern = new RegExp(`^${routePattern.replace(/:[^/]+/g, '[^/]+')}$`);
    return pattern.test(url);
};


const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            component: AppLayout,
            children: [
                {
                    path: '/',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboard.vue'),
                    meta: { user_roles: ['general_manager', 'user'] }, // Example: Allow general_managers and users
                },
                {
                    path: '/dashboard',
                    component: () => import('@/views/Dashboard.vue'),
                    meta: { user_roles: ['general_manager', 'user'] },
                },
                {
                    path: '/statistics',
                    name: 'Statistics',
                    component: () => import('@/views/Statistics/Statistics.vue'),
                    meta: { user_roles: ['general_manager'] }, // Example: Only general_managers
                },
                {
                    path: '/users',
                    name: 'users',
                    component: () => import('@/views/Users/Users.vue'),
                    meta: { user_roles: ['general_manager'] },
                },
                {
                    path: '/add-user',
                    component: () => import('@/views/Users/AddUser.vue'),
                    meta: { user_roles: ['general_manager'] },
                },
                {
                    path: '/chats',
                    component: () => import('@/views/Users/Chats.vue'),
                    meta: { user_roles: ['general_manager', 'user'] },
                },
                {
                    path: '/donations',
                    component: () => import('@/views/Donations/Donations.vue'),
                    meta: { user_roles: ['general_manager', 'user'] },
                },
                {
                    path: '/donation-categories',
                    component: () => import('@/views/Categories/DonationCategories.vue'),
                    meta: { user_roles: ['general_manager'] },
                },
                {
                    path: '/add-donation',
                    component: () => import('@/views/Donations/AddDonation.vue'),
                    meta: { user_roles: ['general_manager'] },
                },
                {
                    path: '/pain-relief-options',
                    component: () => import('@/views/PainRelief/PainReliefOptions.vue'),
                    meta: { user_roles: ['general_manager', 'user'] },
                },
                {
                    path: '/pain-relief-programs',
                    component: () => import('@/views/PainRelief/PainReliefPrograms.vue'),
                    meta: { user_roles: ['general_manager', 'user'] },
                },
                {
                    path: '/pain-relief-donations',
                    component: () => import('@/views/PainRelief/PainReliefDonations.vue'),
                    meta: { user_roles: ['general_manager', 'user'] },
                },
                {
                    path: '/cases',
                    component: () => import('@/views/Cases/Cases.vue'),
                    meta: { user_roles: ['general_manager', 'donor'] },
                },
                {
                    path: '/cases-donations',
                    component: () => import('@/views/Cases/CasesDonations.vue'),
                    meta: { user_roles: ['general_manager', 'user'] },
                },
                {
                    path: '/add-case',
                    component: () => import('@/views/Cases/AddCase.vue'),
                    meta: { user_roles: ['general_manager'] },
                },
                {
                    path: '/payments',
                    component: () => import('@/views/Payments/Payments.vue'),
                    meta: { user_roles: ['general_manager'] },
                },
                {
                    path: '/integration-links',
                    component: () => import('@/views/IntegrationLinks/IntegrationLinks.vue'),
                    meta: { user_roles: ['general_manager'] },
                },
                {
                    path: '/contact-messages',
                    component: () => import('@/views/Contact/ContactMessages.vue'),
                    meta: { user_roles: ['general_manager'] },
                },
                {
                    path: '/gift-donations',
                    component: () => import('@/views/GiftDonations/GiftDonations.vue'),
                    meta: { user_roles: ['general_manager', 'user'] },
                },
                {
                    path: '/donations-reports',
                    component: () => import('@/views/Reports/DonationsReports.vue'),
                    meta: { user_roles: ['general_manager'] },
                },
                {
                    path: '/payments-reports',
                    component: () => import('@/views/Reports/PaymentsReport.vue'),
                    meta: { user_roles: ['general_manager'] },
                },
                {
                    path: '/cases-reports',
                    component: () => import('@/views/Reports/CasesDonations.vue'),
                    meta: { user_roles: ['general_manager'] },
                },
                // Website routes
                {
                    path: '/static-sections',
                    component: () => import('@/views/Website/StaticSections.vue'),
                    meta: { user_roles: ['general_manager'] },
                },
                {
                    path: '/organization-members',
                    component: () => import('@/views/Website/OrganizationMembers.vue'),
                    meta: { user_roles: ['general_manager'] },
                },
                {
                    path: '/comprehensive-documents',
                    component: () => import('@/views/Website/ComprehensiveDocuments.vue'),
                    meta: { user_roles: ['general_manager'] },
                },
                {
                    path: '/social-media-links',
                    component: () => import('@/views/Website/SocialMediaLinks.vue'),
                    meta: { user_roles: ['general_manager'] },
                },
                {
                    path: '/governance-categories',
                    component: () => import('@/views/Website/GovernanceCategories.vue'),
                    meta: { user_roles: ['general_manager'] },
                },
                {
                    path: '/governance',
                    component: () => import('@/views/Website/Governance.vue'),
                    meta: { user_roles: ['general_manager'] },
                },
                {
                    path: '/add-post',
                    component: () => import('@/views/Website/AddPost.vue'),
                    meta: { user_roles: ['general_manager'] },
                },
                {
                    path: '/edit-post/:id',
                    component: () => import('@/views/Website/EditPost.vue'),
                    meta: { user_roles: ['general_manager'] },
                },
                {
                    path: '/posts',
                    component: () => import('@/views/Website/Posts.vue'),
                    meta: { user_roles: ['general_manager', 'user'] },
                },
                {
                    path: '/post-types',
                    component: () => import('@/views/Website/PostTypes.vue'),
                    meta: { user_roles: ['general_manager', 'user'] },
                },
                {
                    path: '/partners',
                    component: () => import('@/views/Website/Partners.vue'),
                    meta: { user_roles: ['general_manager', 'user'] },
                },
            ],
        },
        {
            path: '/auth/login',
            name: 'login',
            component: () => import('@/views/auth/Login.vue'),
            meta: { auth: true }, // Public route
        },
        {
            path: '/auth/access',
            name: 'accessDenied',
            component: () => import('@/views/auth/Access.vue'),
            meta: { auth: true }, // Public route
        },
        {
            path: '/auth/error',
            name: 'error',
            component: () => import('@/views/auth/Error.vue'),
            meta: { auth: true }, // Public route
        },
    ],
});

// Auth guard
router.beforeEach(async (to, from, next) => {
    LoadingService.show();


    // Check if user is authenticated
    const loggedToken = localStorage.getItem('accessToken'); // Align with Axios instance
    if (!loggedToken) {
        LoadingService.hide();

        return next({
            path: '/auth/login',
            query: { redirect: to.fullPath, error: 'not_authenticated' },
        });
    }

    try {
        // Fetch user data to verify roles
        console.log("get me ");

        if (to.meta?.auth) {

            return next()
        }
        const response = await api.instance.get('tokens/me'); // Adjust endpoint as needed
        console.log({ me: response.data });
        const user = response.data.data; // Assuming response: { data: { id, role, ... } }

        if (response.status == 401) {
            return next({
                path: '/auth/login',
                query: { redirect: to.fullPath, error: 'session_expired' },
            });
        }
        // Check required roles
        const requiredRoles = to.meta?.user_roles || [];

        // If no roles are specified, allow access if authenticated
        if (!requiredRoles.length) {
            LoadingService.hide();

            return next();
        }

        // Verify user role
        const hasRequiredRole = user.roles.some(role => requiredRoles.includes(role));
        console.log({ hasRequiredRole });



        if (hasRequiredRole) {
            LoadingService.hide();

            return next();
        } else {
            LoadingService.hide();

            return next({
                path: '/auth/access',
                query: { error: 'insufficient_permissions' },
            });
        }
    } catch (error) {
        LoadingService.hide();

        console.error('Auth guard error:', {
            message: error.message,
            status: error,
        });

        // Handle token-related errors
        if (error?.status === 401 || error.response?.status_code === 401) {
            api.clearAuth();
            return next({
                path: '/auth/login',
                query: { redirect: to.fullPath, error: 'session_expired' },
            });
        }

        // Handle other errors
        return next({
            path: '/auth/error',
            query: { error: 'server_error' },
        });
    } finally {
        LoadingService.hide();

        window.scrollTo(0, 0); // Reset scroll position
    }
});

export default router;