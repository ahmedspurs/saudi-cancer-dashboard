import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import { ImageService } from '@/service/ImageService';
import Aura from '@primeuix/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

import '@/assets/styles.scss';

const app = createApp(App);
app.config.globalProperties.$imageService = ImageService;
app.config.errorHandler = (err, instance, info) => {
    console.error('Vue error:', err);
    console.log('Component instance:', instance);
    console.log('Error info:', info);
};
app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});
app.use(ToastService);
app.use(ConfirmationService);

app.mount('#app');
