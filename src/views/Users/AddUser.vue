<script setup>
import request from '@/service/Request';
import Button from 'primevue/button';
// import Dropdown from 'primevue/Dropdown';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const toast = useToast();
const router = useRouter();

// Form data for a new user
const user = ref({
    name: '',
    email: '',
    password: '',
    phone: '',
    role_id: '' // Array to store multiple role IDs
});

// Reference data for dropdowns
const roles = ref([]);
const submitted = ref(false);

// Fetch roles on component mount
onMounted(() => {
    getRoles();
});

const getRoles = async () => {
    try {
        const res = await request.get('roles');
        if (res.status) {
            roles.value = res.data.map((role) => ({ label: role.name, value: role.id }));
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في جلب الأدوار', life: 3000 });
        }
    } catch (error) {
        console.error('Error fetching roles:', error);
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في جلب الأدوار', life: 3000 });
    }
};

// Handle form submission
const saveUser = async () => {
    submitted.value = true;

    // Validation
    if (!user.value.name.trim()) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'الاسم مطلوب', life: 3000 });
        return;
    }
    if (!user.value.email.trim()) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'البريد الإلكتروني مطلوب', life: 3000 });
        return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.value.email)) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'صيغة البريد الإلكتروني غير صحيحة', life: 3000 });
        return;
    }
    if (!user.value.password.trim()) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'كلمة المرور مطلوبة', life: 3000 });
        return;
    }
    if (user.value.password.length < 6) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', life: 3000 });
        return;
    }
    if (user.value.phone && user.value.phone.length < 9) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'رقم الهاتف يجب أن يكون 9 أرقام على الأقل', life: 3000 });
        return;
    }
    if (!user.value.role_id) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'يجب اختيار دور واحد على الأقل', life: 3000 });
        return;
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('name', user.value.name);
    formData.append('email', user.value.email);
    formData.append('password', user.value.password);
    formData.append('phone', user.value.phone || '');
    formData.append('role_id', user.value.role_id || '');

    // Send API request
    try {
        const res = await request.post('users', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: res.data.msg, life: 3000 });
            resetForm();
            router.push('/users'); // Adjust route as needed
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.data.msg || 'فشل في إضافة المستخدم', life: 3000 });
        }
    } catch (error) {
        console.error('Registration error:', error);
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.response?.data?.msg || 'حدث خطأ ما', life: 3000 });
    } finally {
        submitted.value = false;
    }
};

// Reset form
const resetForm = () => {
    user.value = {
        name: '',
        email: '',
        password: '',
        phone: '',
        role_ids: [] // Reset to empty array for multiple selection
    };
    submitted.value = false;
};

// Go back
const goBack = () => {
    router.push('/users'); // Adjust route as needed
};
</script>

<template>
    <div dir="rtl" class="p-6 mx-auto max-w-4xl">
        <div class="card bg-white shadow-md rounded-lg p-6">
            <h1 class="text-2xl font-bold mb-6 text-center">إضافة مستخدم جديد</h1>
            <form @submit.prevent="saveUser" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Name -->
                    <div class="flex flex-col">
                        <label for="name" class="block font-bold mb-2">الاسم</label>
                        <InputText id="name" v-model.trim="user.name" required autofocus :invalid="submitted && !user.name.trim()" class="w-full" />
                        <small v-if="submitted && !user.name.trim()" class="text-red-500">الاسم مطلوب.</small>
                    </div>

                    <!-- Email -->
                    <div class="flex flex-col">
                        <label for="email" class="block font-bold mb-2">البريد الإلكتروني</label>
                        <InputText id="email" v-model.trim="user.email" type="email" required :invalid="submitted && !user.email.trim()" class="w-full" />
                        <small v-if="submitted && !user.email.trim()" class="text-red-500">البريد الإلكتروني مطلوب.</small>
                    </div>

                    <!-- Password -->
                    <div class="flex flex-col">
                        <label for="password" class="block font-bold mb-2">كلمة المرور</label>
                        <Password id="password" v-model="user.password" toggleMask :feedback="false" required :invalid="submitted && !user.password.trim()" class="w-full" />
                        <small v-if="submitted && !user.password.trim()" class="text-red-500">كلمة المرور مطلوبة.</small>
                    </div>

                    <!-- Phone -->
                    <div class="flex flex-col">
                        <label for="phone" class="block font-bold mb-2">رقم الهاتف</label>
                        <InputText id="phone" v-model="user.phone" :invalid="submitted && user.phone && user.phone.length < 9" class="w-full" />
                        <small v-if="submitted && user.phone && user.phone.length < 9" class="text-red-500">رقم الهاتف يجب أن يكون 9 أرقام على الأقل.</small>
                        <small class="text-gray-500">اختياري</small>
                    </div>

                    <!-- Roles -->
                    <div class="flex flex-col md:col-span-2">
                        <label for="role_ids" class="block font-bold mb-2">الأدوار</label>
                        <Dropdown id="role_id" v-model="user.role_id" :options="roles" option-label="label" option-value="value" placeholder="اختر الأدوار" multiple :invalid="submitted && user.role_ids.length === 0" class="w-full" />
                        <small v-if="submitted && !user.role_id.trim()" class="text-red-500">يجب اختيار دور واحد على الأقل.</small>
                    </div>
                </div>

                <!-- Form Actions -->
                <div class="flex justify-end gap-4 mt-6">
                    <Button label="العودة إلى المستخدمين" icon="pi pi-arrow-right" text @click="goBack" />
                    <Button label="إعادة تعيين" icon="pi pi-refresh" text @click="resetForm" />
                    <Button type="submit" label="حفظ" icon="pi pi-check" />
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
.card {
    background-color: #ffffff;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
}
.p-inputtext,
.p-password,
.p-dropdown {
    width: 100%;
}
.p-dropdown .p-overlay {
    z-index: 1000 !important;
}
.text-red-500 {
    color: #ef4444;
}
.text-gray-500 {
    color: #6b7280;
}
</style>
