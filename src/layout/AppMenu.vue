<script setup>
import { ref } from 'vue';

import AppMenuItem from './AppMenuItem.vue';

const model = ref([
    {
        label: 'لوحة التحكم',
        icon: 'pi pi-home',
        items: [
            { label: 'الرئيسية', icon: 'pi pi-home', to: '/dashboard' }
            // { label: 'الإحصائيات', icon: 'pi pi-chart-bar', to: '/statistics' }
        ]
    },

    // {
    //     label: ' الحالات',
    //     icon: 'pi pi-user-md',
    //     items: [
    //         { label: 'قائمة الحالات', icon: 'pi pi-users', to: '/cases' },
    //         { label: '  اضافة حالة جديد', icon: 'pi pi-user-plus', to: '/add-case' }
    //     ]
    // },

    // {
    //     label: 'التبرعات',
    //     icon: 'pi pi-heart',
    //     items: [
    //         { label: 'كل التبرعات', icon: 'pi pi-table', to: '/donations' },
    //         {
    //             label: 'أنواع التبرعات',
    //             icon: 'pi pi-share-alt',
    //             items: [
    //                 { label: 'تبرعات الإهداءات', icon: 'pi pi-gift', to: '/gift-donations' },
    //                 { label: 'تبرعات الحالات', icon: 'pi pi-user-plus', to: '/cases-donations' }
    //             ]
    //         }
    //     ]
    // },

    // {
    //     label: 'المدفوعات',
    //     icon: 'pi pi-credit-card',
    //     items: [{ label: 'سجلات الدفع', icon: 'pi pi-wallet', to: '/payments' }]
    // },

    // {
    //     label: 'التقارير',
    //     icon: 'pi pi-chart-line',
    //     items: [
    //         { label: 'تقرير التبرعات', icon: 'pi pi-file', to: '/donations-reports' },
    //         { label: 'تقرير الحالات', icon: 'pi pi-user', to: '/cases-reports' },
    //         { label: 'تقرير المدفوعات', icon: 'pi pi-money-bill', to: '/payments-reports' }
    //     ]
    // },

    // {
    //     label: 'الإدارة',
    //     icon: 'pi pi-cog',
    //     items: [
    //         {
    //             label: 'المستخدمين والصلاحيات',
    //             icon: 'pi pi-users',
    //             items: [
    //                 { label: 'قائمة المستخدمين', icon: 'pi pi-user', to: '/users' },
    //                 { label: 'إضافة مستخدم', icon: 'pi pi-user-plus', to: '/add-user' }
    //                 // { label: 'إدارة الصلاحيات', icon: 'pi pi-lock', to: '/roles' }
    //             ]
    //         },
    //         {
    //             label: 'الإعدادات',
    //             icon: 'pi pi-sliders-h',
    //             items: [
    //                 { label: 'روابط التكامل', icon: 'pi pi-link', to: '/integration-links' },
    //                 { label: 'تصنيفات التبرعات', icon: 'pi pi-tags', to: '/donation-categories' }
    //             ]
    //         },
    //         {
    //             label: 'الرسائل',
    //             icon: 'pi pi-envelope',
    //             items: [{ label: 'رسائل التواصل', icon: 'pi pi-inbox', to: '/contact-messages' }]
    //         }
    //     ]
    // },
    {
        label: 'الموقع الالكتروني',
        icon: 'pi pi-globe',
        items: [
            { label: 'المنشورات', icon: 'pi pi-copy', to: '/posts' },
            { label: 'إضافة منشور', icon: 'pi pi-plus', to: '/add-post' },
            { label: 'الوثائق الشاملة', icon: 'pi pi-file', to: '/comprehensive-documents' },
            { label: 'الحوكمة', icon: 'pi pi-briefcase', to: '/governance' },
            { label: 'تصنيفات الحوكمة', icon: 'pi pi-list', to: '/governance-categories' },
            { label: 'أعضاء المنظمة', icon: 'pi pi-users', to: '/organization-members' },
            { label: 'روابط التواصل الاجتماعي', icon: 'pi pi-share-alt', to: '/social-media-links' },
            { label: 'الأقسام الثابتة', icon: 'pi pi-bookmark', to: '/static-sections' },
            { label: 'الشركاء', icon: 'pi pi-building', to: '/partners' }
        ]
    }
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
