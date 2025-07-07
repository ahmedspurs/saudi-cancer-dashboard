<script setup>
import request from '@/service/Request';
import Select from 'primevue/select'; // Ensure this is imported
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const toast = useToast();
const router = useRouter();
const item = ref({
    user_id: null,
    category_id: null,
    amount: null,
    status: 'pending',
    payment_method_id: null,
    payment_status: 'pending',
    receipt_url: ''
});
const users = ref([]);
const categories = ref([]);
const paymentMethods = ref([]);
const submitted = ref(false);

const statusOptions = ref([
    { label: 'معلق', value: 'pending' },
    { label: 'مدفوع', value: 'paid' }
]);

const paymentStatusOptions = ref([
    { label: 'ناجح', value: 'success' },
    { label: 'فشل', value: 'failed' },
    { label: 'معلق', value: 'pending' }
]);

onMounted(() => {
    getUsers();
    getCategories();
    getPaymentMethods();
});

const getUsers = async () => {
    const res = await request.get('users');
    if (res.status) {
        users.value = [{ id: null, name: 'مجهول' }, ...res.data];
    }
};

const getCategories = async () => {
    const res = await request.get('donation-categories');
    if (res.status) {
        categories.value = res.data;
    }
};

const getPaymentMethods = async () => {
    const res = await request.get('payment-methods');
    if (res.status) {
        paymentMethods.value = res.data;
    }
};

const saveItem = async () => {
    submitted.value = true;

    if (!item.value.amount || item.value.amount <= 0) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'المبلغ مطلوب ويجب أن يكون أكبر من صفر', life: 3000 });
        return;
    }
    if (!item.value.status) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'حالة التبرع مطلوبة', life: 3000 });
        return;
    }
    if (!item.value.payment_method_id || !item.value.payment_status) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'طريقة الدفع وحالة الدفع مطلوبة', life: 3000 });
        return;
    }

    const formData = new FormData();
    formData.append('user_id', item.value.user_id || '');
    formData.append('category_id', item.value.category_id || '');
    formData.append('amount', item.value.amount);
    formData.append('status', item.value.status);
    formData.append('payment_method_id', item.value.payment_method_id);
    formData.append('payment_status', item.value.payment_status);
    formData.append('receipt_url', item.value.receipt_url || '');

    const res = await request.post('donations-common', formData);
    if (res.status) {
        toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم إضافة التبرع بنجاح', life: 3000 });
        item.value = {
            user_id: null,
            category_id: null,
            amount: null,
            status: 'pending',
            payment_method_id: null,
            payment_status: 'pending',
            receipt_url: ''
        };
        submitted.value = false;
        router.push('/donations');
    } else {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في إضافة التبرع', life: 3000 });
    }
};

const resetForm = () => {
    item.value = {
        user_id: null,
        category_id: null,
        amount: null,
        status: 'pending',
        payment_method_id: null,
        payment_status: 'pending',
        receipt_url: ''
    };
    submitted.value = false;
};

const goBack = () => {
    router.push('/donations');
};

const exportCSV = (event) => {
    toast.add({ severity: 'info', summary: 'تصدير', detail: 'جاري تصدير البيانات كملف CSV', life: 3000 });
    console.log('Export CSV triggered', event);
};
</script>

<template>
    <div dir="rtl" class="p-6 mx-auto">
        <div class="card">
            <h1 class="text-2xl font-bold mb-6">إضافة تبرع</h1>
            <form @submit.prevent="saveItem">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="flex flex-col">
                        <label for="user_id" class="block font-bold mb-2">المتبرع</label>
                        <Select id="user_id" v-model="item.user_id" :options="users" option-label="name" option-value="id" placeholder="اختر المتبرع" class="w-full" :invalid="submitted && item.user_id === undefined" />
                        <small v-if="submitted && item.user_id === undefined" class="text-red-500">المتبرع مطلوب.</small>
                    </div>

                    <div class="flex flex-col">
                        <label for="category_id" class="block font-bold mb-2">الفئة</label>
                        <Select id="category_id" v-model="item.category_id" :options="categories" option-label="name_ar" option-value="id" placeholder="اختر الفئة" class="w-full" :invalid="submitted && item.category_id === undefined" />
                        <small v-if="submitted && item.category_id === undefined" class="text-red-500">الفئة مطلوبة.</small>
                    </div>

                    <div class="flex flex-col">
                        <label for="amount" class="block font-bold mb-2">المبلغ (ر.س)</label>
                        <InputText id="amount" v-model.number="item.amount" type="number" step="0.01" min="0" required autofocus :invalid="submitted && (!item.amount || item.amount <= 0)" class="w-full" />
                        <small v-if="submitted && (!item.amount || item.amount <= 0)" class="text-red-500">المبلغ مطلوب ويجب أن يكون أكبر من صفر.</small>
                    </div>

                    <div class="flex flex-col">
                        <label for="status" class="block font-bold mb-2">حالة التبرع</label>
                        <Select id="status" v-model="item.status" :options="statusOptions" option-label="label" option-value="value" placeholder="اختر الحالة" class="w-full" :invalid="submitted && !item.status" />
                        <small v-if="submitted && !item.status" class="text-red-500">حالة التبرع مطلوبة.</small>
                    </div>

                    <div class="flex flex-col">
                        <label for="payment_method_id" class="block font-bold mb-2">طريقة الدفع</label>
                        <Select id="payment_method_id" v-model="item.payment_method_id" :options="paymentMethods" option-label="name" option-value="id" placeholder="اختر طريقة الدفع" class="w-full" :invalid="submitted && !item.payment_method_id" />
                        <small v-if="submitted && !item.payment_method_id" class="text-red-500">طريقة الدفع مطلوبة.</small>
                    </div>

                    <div class="flex flex-col">
                        <label for="payment_status" class="block font-bold mb-2">حالة الدفع</label>
                        <Select id="payment_status" v-model="item.payment_status" :options="paymentStatusOptions" option-label="label" option-value="value" placeholder="اختر حالة الدفع" class="w-full" :invalid="submitted && !item.payment_status" />
                        <small v-if="submitted && !item.payment_status" class="text-red-500">حالة الدفع مطلوبة.</small>
                    </div>

                    <div class="flex flex-col md:col-span-2">
                        <label for="receipt_url" class="block font-bold mb-2">رابط الإيصال</label>
                        <InputText id="receipt_url" v-model.trim="item.receipt_url" class="w-full" />
                        <small class="text-gray-500">اختياري</small>
                    </div>
                </div>

                <div class="flex justify-end gap-4 mt-6">
                    <Button label="العودة إلى التبرعات" icon="pi pi-arrow-right" text @click="goBack" />
                    <Button label="إعادة تعيين" icon="pi pi-refresh" text @click="resetForm" />
                    <Button type="submit" label="حفظ" icon="pi pi-check" />
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
.p-select {
    width: 100%;
}
.p-select .p-overlay {
    z-index: 1000 !important; /* Ensure overlay is above other elements */
}
</style>
