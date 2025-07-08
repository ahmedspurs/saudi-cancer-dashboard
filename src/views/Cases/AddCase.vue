<script setup>
import request from '@/service/Request';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import FileUpload from 'primevue/fileupload';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const toast = useToast();
const router = useRouter();

// Form data for a new case
const item = ref({
    category_id: null,
    title: '',
    description: '',
    target_amount: null,
    status: 'open',
    image: null, // Store the selected file
    is_active: true
});

// Reference data for dropdowns
const categories = ref([]);
const submitted = ref(false);

// Status options for the ENUM field
const statusOptions = ref([
    { label: 'مفتوح', value: 'open' },
    { label: 'مكتمل', value: 'completed' }
]);
const types = ref([
    {
        type: 'major',
        name: 'حالات كبرى'
    },
    {
        type: 'minor',
        name: 'حالات صغرى'
    },
    {
        type: 'urgent',
        name: 'حالات عاجلة'
    }
]);
// Fetch categories on component mount
onMounted(() => {
    getCategories();
});

const getCategories = async () => {
    const res = await request.get('donation-categories');
    if (res.status) {
        categories.value = res.data;
    } else {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في جلب الفئات', life: 3000 });
    }
};

// Handle file selection
const onSelectImage = (event) => {
    const file = event.files && event.files[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            toast.add({ severity: 'error', summary: 'خطأ', detail: 'يرجى اختيار ملف صورة (مثل JPG أو PNG)', life: 3000 });
            item.value.image = null;
            return;
        }
        if (file.size > 1000000) {
            // 1MB limit
            toast.add({ severity: 'error', summary: 'خطأ', detail: 'حجم الصورة يجب ألا يتجاوز 1 ميغابايت', life: 3000 });
            item.value.image = null;
            return;
        }
        item.value.image = file;
    } else {
        item.value.image = null;
    }
};

// Handle file removal
const onFileRemove = () => {
    item.value.image = null;
};

const saveItem = async () => {
    submitted.value = true;

    // Validation
    if (!item.value.title.trim()) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'عنوان الحالة مطلوب', life: 3000 });
        return;
    }
    if (item.value.category_id === null) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'الفئة مطلوبة', life: 3000 });
        return;
    }
    if (item.value.target_amount !== null && (isNaN(item.value.target_amount) || item.value.target_amount <= 0)) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'المبلغ المستهدف يجب أن يكون أكبر من صفر', life: 3000 });
        return;
    }
    if (!item.value.status) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'حالة الحالة مطلوبة', life: 3000 });
        return;
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('category_id', item.value.category_id || '');
    formData.append('type', item.value.type || '');
    formData.append('title', item.value.title);
    formData.append('description', item.value.description || '');
    formData.append('target_amount', item.value.target_amount || '');
    formData.append('status', item.value.status);
    formData.append('is_active', item.value.is_active ? '1' : '0');
    if (item.value.image) {
        formData.append('image_url', item.value.image);
    }

    // Send API request
    const res = await request.post('cases', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (res.status) {
        toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم إضافة الحالة بنجاح', life: 3000 });
        resetForm();
        router.push('/cases');
    } else {
        toast.add({ severity: 'error', summary: 'خطأ', detail: res.error || 'فشل في إضافة الحالة', life: 3000 });
    }
};

const resetForm = () => {
    item.value = {
        category_id: null,
        title: '',
        description: '',
        target_amount: null,
        status: 'open',
        image: null,
        is_active: true
    };
    submitted.value = false;
};

const goBack = () => {
    router.push('/cases');
};

const exportCSV = () => {
    toast.add({ severity: 'info', summary: 'تصدير', detail: 'جاري تصدير بيانات الحالات كملف CSV', life: 3000 });
    // Implement CSV export logic if needed
};
</script>

<template>
    <div dir="rtl" class="p-6 mx-auto max-w-4xl">
        <div class="card bg-white shadow-md rounded-lg p-6">
            <h1 class="text-2xl font-bold mb-6 text-center">إضافة حالة جديدة</h1>
            <form @submit.prevent="saveItem" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Category ID -->
                    <div class="flex flex-col">
                        <label for="category_id" class="block font-bold mb-2">الفئة</label>
                        <Select id="category_id" v-model="item.category_id" :options="categories" option-label="name_ar" option-value="id" placeholder="اختر الفئة" class="w-full" :invalid="submitted && item.category_id === null" />
                        <small v-if="submitted && item.category_id === null" class="text-red-500">الفئة مطلوبة.</small>
                    </div>

                    <div class="flex flex-col">
                        <label for="category_id" class="block font-bold mb-2">النومع</label>
                        <Select id="category_id" v-model="item.type" :options="types" option-label="name" option-value="type" placeholder="اختر الفئة" class="w-full" :invalid="submitted && item.type === null" />
                        <small v-if="submitted && item.type === null" class="text-red-500">الفئة مطلوبة.</small>
                    </div>

                    <!-- Title -->
                    <div class="flex flex-col">
                        <label for="title" class="block font-bold mb-2">عنوان الحالة</label>
                        <InputText id="title" v-model.trim="item.title" required autofocus :invalid="submitted && !item.title.trim()" class="w-full" />
                        <small v-if="submitted && !item.title.trim()" class="text-red-500">عنوان الحالة مطلوب.</small>
                    </div>

                    <!-- Target Amount -->
                    <div class="flex flex-col">
                        <label for="target_amount" class="block font-bold mb-2">المبلغ المستهدف (ر.س)</label>
                        <InputText
                            id="target_amount"
                            v-model.number="item.target_amount"
                            type="number"
                            step="0.01"
                            min="0"
                            :invalid="submitted && item.target_amount !== null && (isNaN(item.target_amount) || item.target_amount <= 0)"
                            class="w-full"
                        />
                        <small v-if="submitted && item.target_amount !== null && (isNaN(item.target_amount) || item.target_amount <= 0)" class="text-red-500">المبلغ المستهدف يجب أن يكون أكبر من صفر.</small>
                        <small class="text-gray-500">اختياري</small>
                    </div>

                    <!-- Status -->
                    <div class="flex flex-col">
                        <label for="status" class="block font-bold mb-2">حالة الحالة</label>
                        <Select id="status" v-model="item.status" :options="statusOptions" option-label="label" option-value="value" placeholder="اختر الحالة" class="w-full" :invalid="submitted && !item.status" />
                        <small v-if="submitted && !item.status" class="text-red-500">حالة الحالة مطلوبة.</small>
                    </div>

                    <!-- Image Upload -->
                    <div class="flex flex-col md:col-span-2">
                        <label for="image" class="block font-bold mb-2">صورة الحالة</label>
                        <FileUpload name="demo[]" accept="image/*" :maxFileSize="5000000" chooseLabel="اختيار" @select="onSelectImage" @remove="onFileRemove" class="w-full">
                            <template #empty>
                                <span>اسحب الصورة هنا لرفعها.</span>
                            </template>
                        </FileUpload>
                        <small class="text-gray-500">اختياري (الصور بصيغة JPG أو PNG، الحد الأقصى 1 ميغابايت)</small>
                    </div>

                    <!-- Description -->
                    <div class="flex flex-col md:col-span-2">
                        <label for="description" class="block font-bold mb-2">الوصف</label>
                        <Textarea id="description" v-model="item.description" rows="4" class="w-full" />
                        <small class="text-gray-500">اختياري</small>
                    </div>

                    <!-- Is Active -->
                    <div class="flex items-center md:col-span-2">
                        <Checkbox id="is_active" v-model="item.is_active" :binary="true" class="mr-2" />
                        <label for="is_active" class="font-bold">نشط</label>
                    </div>
                </div>

                <!-- Form Actions -->
                <div class="flex justify-end gap-4 mt-6">
                    <Button label="العودة إلى الحالات" icon="pi pi-arrow-right" text @click="goBack" />
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
.p-select,
.p-inputtext,
.p-textarea,
.p-fileupload {
    width: 100%;
}
.p-select .p-overlay {
    z-index: 1000 !important;
}
.text-red-500 {
    color: #ef4444;
}
.text-gray-500 {
    color: #6b7280;
}
</style>
