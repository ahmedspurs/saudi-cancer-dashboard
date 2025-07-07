<script setup>
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
import request from '@/service/Request';
import { useToast } from 'primevue/usetoast';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const checked = ref(false);
const router = useRouter();
const toast = useToast();

const login = async () => {
    try {
        const res = await request.post('users/admin-login', {
            email: email.value,
            password: password.value
        });

        if (res.status) {
            localStorage.setItem('accessToken', res?.data?.accessToken);
            localStorage.setItem('user', JSON.stringify(res?.data?.user));

            router.push('/');
        } else {
            toast.add({
                severity: 'error',
                summary: 'Login Failed',
                detail: res?.msg || 'An error occurred while logging in.',
                life: 3000
            });
        }
    } catch (error) {
        console.error(error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error?.response?.data?.msg || 'حدث خطأ أثناء الاتصال بالخادم.',
            life: 3000
        });
    }
};
</script>

<template>
    <FloatingConfigurator />
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <img src="/images/main-logo-black.png" alt="Saudi Cancer Logo" class="w-full h-28 mb-6 object-contain dark:hidden" />
                        <img src="/images/main-logo-white.png" alt="Saudi Cancer Logo" class="w-full h-28 mb-6 object-contain dark:block hidden" />
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Welcome to Saudi Cancer Admin Dashboard</div>
                        <span class="text-muted-color font-medium">Sign in to continue</span>
                    </div>

                    <div>
                        <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                        <InputText id="email1" type="text" placeholder="Email address" class="w-full mb-8" v-model="email" />

                        <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Password</label>
                        <Password id="password1" v-model="password" placeholder="Password" :toggleMask="true" class="mb-4" fluid :feedback="false" />

                        <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                            <div class="flex items-center">
                                <Checkbox v-model="checked" id="rememberme1" binary class="mr-2"></Checkbox>
                                <label for="rememberme1">Remember me</label>
                            </div>
                        </div>
                        <Button label="Sign In" class="w-full" @click="login()"></Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>
