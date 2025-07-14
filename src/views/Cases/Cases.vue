<script setup>
import request from '@/service/Request';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const dt = ref();
const items = ref([]);
const editItemDialog = ref(false);
const deleteItemDialog = ref(false);
const deleteItemsDialog = ref(false);
const item = ref({});
const categories = ref([]);
const selectedItems = ref();
const submitted = ref(false);
const loading = ref(false);
const imageFile = ref(null);
const total = ref(0);
const authUserId = ref(1); // Placeholder: Replace with actual authenticated user ID
const viewMode = ref('all'); // 'all' or 'my'
const selectedCategory = ref(null);

const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const options = ref({
    page: 1,
    limit: 10,
    col: 'name',
    search: '',
    category_id: null,
    user_id: null
});

const statusOptions = ref([
    { name: 'مفتوح', value: 'open' },
    { name: 'مكتمل', value: 'completed' }
]);

const viewOptions = ref([
    { name: 'جميع الحالات', value: 'all' },
    { name: 'حالاتي', value: 'my' }
]);

const types = ref([
    { name: 'جميع الحالات', value: '' },

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

onMounted(() => {
    getCategories();
    get();
});

const getCategories = async () => {
    const res = await request.get('donation-categories');
    if (res.status) {
        categories.value = [{ id: null, name_ar: 'جميع الفئات' }, ...res.data];
    } else {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في جلب الفئات', life: 3000 });
    }
};

const get = async (e) => {
    loading.value = true;
    if (e) {
        options.value.page = e.page + 1;
        options.value.limit = e.rows;
    }
    options.value.category_id = selectedCategory.value;
    options.value.user_id = viewMode.value === 'my' ? authUserId.value : null;

    try {
        const res = await request.post('cases/paginate/filtered', options.value);
        if (res.status) {
            items.value = res.data;
            total.value = res.tot;
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في جلب الحالات', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في جلب الحالات', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const onSelectImage = (event) => {
    const file = event.files && event.files[0];
    if (file) {
        if (!file.type.startsWith('image/')) {
            toast.add({ severity: 'error', summary: 'خطأ', detail: 'يرجى اختيار ملف صورة (مثل JPG أو PNG)', life: 3000 });
            event.files = [];
            imageFile.value = null;
            return;
        }
        if (file.size > 1000000) {
            toast.add({ severity: 'error', summary: 'خطأ', detail: 'حجم الصورة يجب ألا يتجاوز 1 ميغابايت', life: 3000 });
            event.files = [];
            imageFile.value = null;
            return;
        }
        imageFile.value = file;
        item.value.previewImage = URL.createObjectURL(file);
        event.files = [];
    } else {
        imageFile.value = null;
        item.value.previewImage = null;
    }
};

const removeImage = () => {
    item.value.image_url = null;
    imageFile.value = null;
    item.value.previewImage = null;
};

const editItem = (caseItem) => {
    item.value = { ...caseItem, previewImage: caseItem.image_url };
    imageFile.value = null;
    editItemDialog.value = true;
};

const hideEditDialog = () => {
    editItemDialog.value = false;
    submitted.value = false;
    item.value = {};
    imageFile.value = null;
};

const edit = async () => {
    submitted.value = true;
    if (!item.value.title?.trim() || !item.value.category_id || !item.value.status) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'جميع الحقول المطلوبة يجب ملؤها', life: 3000 });
        return;
    }
    if (item.value.target_amount !== null && (isNaN(item.value.target_amount) || item.value.target_amount <= 0)) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'المبلغ المستهدف يجب أن يكون أكبر من صفر', life: 3000 });
        return;
    }

    loading.value = true;
    const formData = new FormData();
    formData.append('category_id', item.value.category_id || '');
    formData.append('type', item.value.type || '');
    formData.append('title', item.value.title);
    formData.append('description', item.value.description || '');
    formData.append('target_amount', item.value.target_amount || '');
    formData.append('status', item.value.status);
    formData.append('is_active', item.value.is_active ? '1' : '0');
    if (imageFile.value) {
        formData.append('image_url', imageFile.value);
        formData.append('demo[]', imageFile.value);
    }

    try {
        const res = await request.put(`cases/`, item.value.id, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم تحديث الحالة', life: 3000 });
            get();
            hideEditDialog();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في تحديث الحالة', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في تحديث الحالة', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const toggleStatus = async (caseItem) => {
    const newStatus = caseItem.status === 'open' ? 'completed' : 'open';
    loading.value = true;
    try {
        const res = await request.put(`cases/`, caseItem.id, { status: newStatus });
        if (res.status) {
            toast.add({
                severity: 'success',
                summary: 'نجاح',
                detail: `تم تغيير الحالة إلى ${newStatus === 'open' ? 'مفتوح' : 'مكتمل'}`,
                life: 3000
            });
            get();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في تغيير الحالة', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في تغيير الحالة', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const confirmDeleteItem = (caseItem) => {
    item.value = caseItem;
    deleteItemDialog.value = true;
};

const deleteItem = async () => {
    loading.value = true;
    try {
        const res = await request.delete(`cases/`, item.value.id);
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف الحالة', life: 3000 });
            get();
            deleteItemDialog.value = false;
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في حذف الحالة', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في حذف الحالة', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const confirmDeleteSelected = () => {
    if (!selectedItems.value || !selectedItems.value.length) {
        toast.add({ severity: 'warn', summary: 'تحذير', detail: 'يرجى تحديد حالة واحدة على الأقل', life: 3000 });
        return;
    }
    deleteItemsDialog.value = true;
};

const deleteSelectedItems = async () => {
    const ids = selectedItems.value.map((item) => item.id);
    loading.value = true;
    try {
        const res = await request.delete('cases/bulk', { data: { ids } });
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف الحالات', life: 3000 });
            selectedItems.value = null;
            deleteItemsDialog.value = false;
            get();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في حذف الحالات', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في حذف الحالات', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const exportCSV = () => {
    dt.value.exportCSV();
};

const onViewModeChange = () => {
    options.value.page = 1;
    get();
};

const onCategoryChange = () => {
    options.value.page = 1;
    get();
};
</script>

<template>
    <div class="card" style="direction: rtl; text-align: right">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="حذف" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="loading || !selectedItems || !selectedItems.length" />
            </template>
            <template #end>
                <Button label="تصدير" icon="pi pi-upload" severity="secondary" @click="exportCSV" :loading="loading" />
            </template>
        </Toolbar>

        <div class="flex flex-wrap gap-4 items-center justify-between mb-4">
            <h4 class="m-0">إدارة الحالات</h4>
            <div class="flex gap-4">
                <Dropdown v-model="viewMode" :options="viewOptions" optionLabel="name" optionValue="value" placeholder="اختر العرض" class="w-48" @change="onViewModeChange" />
                <Dropdown v-model="selectedCategory" :options="types" optionLabel="name" optionValue="type" placeholder="اختر الفئة" class="w-48" @change="onCategoryChange" />
                <IconField>
                    <InputIcon class="pi pi-search" />
                    <InputText v-model="options.search" @input="onCategoryChange" placeholder="بحث..." />
                </IconField>
            </div>
        </div>

        <DataTable paginatorPosition="both" ref="dt" v-model:selection="selectedItems" :value="items" dataKey="id" :rows="options.limit" :filters="filters" :totalRecords="total" :loading="loading">
            <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
            <Column field="id" header="المعرف" sortable style="min-width: 8rem"></Column>
            <Column field="title" header="العنوان" sortable style="min-width: 12rem"></Column>
            <Column field="user.name" header="الناشر" sortable style="min-width: 12rem"></Column>
            <Column field="category_id" header="الفئة" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    {{ categories.find((c) => c.id === slotProps.data.category_id)?.name_ar || '-' }}
                </template>
            </Column>
            <Column field="description" header="الوصف" style="min-width: 16rem">
                <template #body="slotProps">
                    {{ slotProps.data.description ? slotProps.data.description.slice(0, 50) + '...' : '-' }}
                </template>
            </Column>

            <Column field="target_amount" header="المبلغ المستهدف (ر.س)" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    {{ slotProps.data.target_amount ? parseFloat(slotProps.data?.target_amount)?.toFixed(2) : '-' }}
                </template>
            </Column>
            <Column field="progress" header="التقدم (%)" sortable style="min-width: 8rem">
                <template #body="slotProps"> {{ slotProps.data.progress ? parseFloat(slotProps.data.progress).toFixed(2) : '0.00' }} % </template>
            </Column>
            <Column field="status" header="الحالة" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    {{ statusOptions.find((s) => s.value === slotProps.data.status)?.name || '-' }}
                </template>
            </Column>
            <Column field="donation_cases" header="عدد التبرعات">
                <template #body="slotProps">
                    {{ slotProps.data.donation_cases?.length }}
                </template>
            </Column>
            <Column field="image_url" header="الصورة" style="min-width: 10rem">
                <template #body="slotProps">
                    <img v-if="slotProps.data.image_url" :src="$imageService.getImageUrl(slotProps.data.image_url)" alt="Case Image" style="width: 80px; height: auto" />
                    <span v-else>-</span>
                </template>
            </Column>
            <Column field="created_at" header="تاريخ الإنشاء" sortable style="min-width: 12rem">
                <template #body="slotProps">
                    {{ new Date(slotProps.data.createdAt).toLocaleDateString('wn-US', { day: '2-digit', month: 'long', year: 'numeric' }) }}
                </template>
            </Column>
            <Column :exportable="false" style="min-width: 12rem">
                <template #body="slotProps">
                    <div class="flex">
                        <Button icon="pi pi-pencil" outlined rounded class="ml-2" @click="editItem(slotProps.data)" :loading="loading" />
                        <Button
                            :icon="slotProps.data.status === 'open' ? 'pi pi-check-circle' : 'pi pi-refresh'"
                            :label="slotProps.data.status === 'open' ? 'إكمال' : 'فتح'"
                            outlined
                            rounded
                            :severity="slotProps.data.status === 'open' ? 'success' : 'warning'"
                            class="ml-2"
                            @click="toggleStatus(slotProps.data)"
                            :loading="loading"
                        />
                        <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteItem(slotProps.data)" :loading="loading" />
                    </div>
                </template>
            </Column>
        </DataTable>
        <Paginator
            :rows="options.limit"
            :totalRecords="total"
            :currentPage="options.page"
            @page="get"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} حالات"
        ></Paginator>

        <Dialog v-model:visible="editItemDialog" :style="{ width: '600px' }" header="تعديل الحالة" :modal="true" style="direction: rtl; text-align: right">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="category_id" class="block font-bold mb-2">الفئة</label>
                    <Dropdown id="category_id" v-model="item.category_id" :options="categories" optionLabel="name_ar" optionValue="id" placeholder="اختر الفئة" :invalid="submitted && !item.category_id" class="w-full" />
                    <small v-if="submitted && !item.category_id" class="text-red-500">الفئة مطلوبة.</small>
                </div>
                <div>
                    <label for="category_id" class="block font-bold mb-2">النوع</label>
                    <Dropdown id="category_id" v-model="item.type" :options="types" optionLabel="name" optionValue="type" placeholder="اختر الفئة" :invalid="submitted && !item.type" class="w-full" />
                    <small v-if="submitted && !item.type" class="text-red-500">الفئة مطلوبة.</small>
                </div>
                <div>
                    <label for="title" class="block font-bold mb-2">العنوان</label>
                    <InputText id="title" v-model.trim="item.title" required :invalid="submitted && !item.title?.trim()" class="w-full" />
                    <small v-if="submitted && !item.title?.trim()" class="text-red-500">العنوان مطلوب.</small>
                </div>
                <div>
                    <label for="target_amount" class="block font-bold mb-2">المبلغ المستهدف (ر.س)</label>
                    <InputText id="target_amount" v-model.number="item.target_amount" type="number" step="0.01" min="0" :invalid="submitted && item.target_amount !== null && (isNaN(item.target_amount) || item.target_amount <= 0)" class="w-full" />
                    <small v-if="submitted && item.target_amount !== null && (isNaN(item.target_amount) || item.target_amount <= 0)" class="text-red-500">المبلغ المستهدف يجب أن يكون أكبر من صفر.</small>
                    <small class="text-gray-500">اختياري</small>
                </div>
                <div>
                    <label for="status" class="block font-bold mb-2">الحالة</label>
                    <Dropdown id="status" v-model="item.status" :options="statusOptions" optionLabel="name" optionValue="value" placeholder="اختر الحالة" :invalid="submitted && !item.status" class="w-full" />
                    <small v-if="submitted && !item.status" class="text-red-500">الحالة مطلوبة.</small>
                </div>
                <div>
                    <label for="image" class="block font-bold mb-2">الصورة</label>
                    <FileUpload name="demo[]" accept="image/*" :maxFileSize="1000000" chooseLabel="اختيار" @select="onSelectImage" @remove="onFileRemove" class="w-full">
                        <template #empty>
                            <span>اسحب الصورة هنا لرفعها.</span>
                        </template>
                    </FileUpload>
                    <small v-if="imageFile" class="text-gray-500">{{ imageFile.name }}</small>
                    <div v-if="item.previewImage || item.image_url" class="mt-2">
                        <img :src="item.previewImage || item.image_url" alt="Image" style="width: 100px; height: auto" />
                        <Button label="إزالة الصورة" icon="pi pi-trash" severity="danger" text @click="removeImage" class="mt-2" />
                    </div>
                    <small class="text-gray-500">اختياري (الصور بصيغة JPG أو PNG، الحد الأقصى 1 ميغابايت)</small>
                </div>
                <div>
                    <label for="description" class="block font-bold mb-2">الوصف</label>
                    <Textarea id="description" v-model="item.description" rows="4" class="w-full" />
                    <small class="text-gray-500">اختياري</small>
                </div>
                <div class="flex items-center">
                    <Checkbox id="is_active" v-model="item.is_active" :binary="true" class="mr-2" />
                    <label for="is_active" class="font-bold">نشط</label>
                </div>
            </div>
            <template #footer>
                <Button label="إلغاء" icon="pi pi-times" text @click="hideEditDialog" :loading="loading" />
                <Button label="حفظ" icon="pi pi-check" @click="edit" :loading="loading" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteItemDialog" :style="{ width: '450px' }" header="تأكيد الحذف" :modal="true" style="direction: rtl; text-align: right">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span>هل أنت متأكد من حذف الحالة؟</span>
            </div>
            <template #footer>
                <Button label="لا" icon="pi pi-times" text @click="deleteItemDialog = false" :loading="loading" />
                <Button label="نعم" icon="pi pi-check" @click="deleteItem" :loading="loading" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteItemsDialog" :style="{ width: '450px' }" header="تأكيد الحذف" :modal="true" style="direction: rtl; text-align: right">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span>هل أنت متأكد من حذف الحالات المحددة؟</span>
            </div>
            <template #footer>
                <Button label="لا" icon="pi pi-times" text @click="deleteItemsDialog = false" :loading="loading" />
                <Button label="نعم" icon="pi pi-check" text @click="deleteSelectedItems" :loading="loading" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.card {
    background-color: #ffffff;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
}
.p-datatable,
.p-inputtext,
.p-dropdown,
.p-textarea,
.p-fileupload {
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
