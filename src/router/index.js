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
        },
        {
            path: '/auth/access',
            name: 'accessDenied',
            component: () => import('@/views/auth/Access.vue'),
        },
        {
            path: '/auth/error',
            name: 'error',
            component: () => import('@/views/auth/Error.vue'),
        },
    ],
});
// In-memory cache for user data
let userCache = null;
const userCacheTTL = 15 * 60 * 1000; // Cache for 5 minutes

// Routes that don’t require authentication checks
const publicRoutes = ['/auth/login', '/auth/access', '/auth/error'];

router.beforeEach(async (to, from, next) => {
    // Skip authentication checks for public routes
    if (publicRoutes.includes(to.path)) {
        LoadingService.hide(); // Ensure loading is hidden for public routes
        return next();
    }

    LoadingService.show();

    try {
        // Check if token exists
        const loggedToken = localStorage.getItem('accessToken');
        if (!loggedToken) {
            return next({
                path: '/auth/login',
                query: { redirect: to.fullPath, error: 'not_authenticated' },
            });
        }

        // Lightweight token validation (optional, for JWT)
        const isTokenValid = () => {
            try {
                const payload = JSON.parse(atob(loggedToken.split('.')[1]));
                return payload.exp * 1000 > Date.now();
            } catch {
                return false;
            }
        };

        // if (!isTokenValid()) {
        //     api.clearAuth();
        //     return next({
        //         path: '/auth/login',
        //         query: { redirect: to.fullPath, error: 'session_expired' },
        //     });
        // }

        // Fetch user data if not cached or cache is stale
        if (!userCache || Date.now() - userCache.timestamp > userCacheTTL) {
            const response = await api.instance.get('tokens/me');
            if (response.status === 401) {
                api.clearAuth();
                return next({
                    path: '/auth/login',
                    query: { redirect: to.fullPath, error: 'session_expired' },
                });
            }
            userCache = {
                data: response.data.data,
                timestamp: Date.now(),
            };
        }

        const user = userCache.data;
        const requiredRoles = to.meta?.user_roles || [];

        // Allow access if no roles are required
        if (!requiredRoles.length) {
            return next();
        }

        // Check if user has required roles
        const hasRequiredRole = user.roles.some(role => requiredRoles.includes(role));
        if (hasRequiredRole) {
            return next();
        }

        return next({
            path: '/auth/access',
            query: { error: 'insufficient_permissions' },
        });
    } catch (error) {
        console.error('Auth guard error:', {
            message: error.message,
            status: error.response?.status,
            to: to.path, // Log the target route for debugging
            from: from.path, // Log the source route
        });

        // Handle unauthorized errors
        if (error.response?.status === 401) {
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
        // Only reset scroll if specified in route meta
        if (to.meta?.resetScroll) {
            window.scrollTo(0, 0);
        }
    }
});
export default router;