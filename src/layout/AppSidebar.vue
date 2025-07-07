<script setup>
import AppMenu from './AppMenu.vue';
import { useLayout } from '@/layout/composables/layout';

const { layoutState, layoutConfig } = useLayout();
</script>

<template>
    <aside
        class="layout-sidebar"
        :class="{
            'is-active': layoutState.overlayMenuActive || layoutState.staticMenuMobileActive || (!layoutState.staticMenuDesktopInactive && layoutConfig.menuMode === 'static'),
            'is-collapsed': layoutState.staticMenuDesktopInactive && layoutConfig.menuMode === 'static'
        }"
    >
        <app-menu />
    </aside>
</template>

<style lang="scss" scoped>
.layout-sidebar {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 20rem;
    background-color: var(--surface-overlay);
    z-index: 999;
    padding: 1rem;
    overflow-y: auto;
    transition: transform 0.3s ease-in-out;
    transform: translateX(0);

    &.is-collapsed {
        transform: translateX(-100%);
    }

    // لموبايل فقط
    @media (max-width: 768px) {
        width: 16rem;
        &.is-collapsed {
            transform: translateX(-100%);
        }
    }
}

// RTL الدعم الكامل
html[lang='ar'] .layout-sidebar {
    left: auto;
    right: 2rem;

    &.is-collapsed {
        transform: translateX(100%);
    }

    @media (max-width: 768px) {
        html[lang='ar'] .layout-sidebar {
            display: none !important;

            &.is-active {
                transform: translateX(0%) !important; // show in RTL
            }
        }
    }
}
</style>
