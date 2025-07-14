<script setup>
import request from '@/service/Request';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

onMounted(() => {
    get();
});

const toast = useToast();
const dt = ref();
const items = ref([]);
const itemDialog = ref(false);
const editItemDialog = ref(false);
const deleteItemDialog = ref(false);
const total = ref(0);
const deleteItemsDialog = ref(false);
const item = ref({});
const options = ref({
    page: 1,
    limit: 10,
    col: 'name_ar',
    search: ''
});
const selectedItems = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const submitted = ref(false);
const loading = ref(false);
const documentFile = ref(null);
const imageFile = ref(null);

const search = async () => {
    const res = await request.post('comprehensive-documents/search', options.value);
    if (res.status) {
        items.value = res.data;
        total.value = res.tot;
    }
};

const get = async (e) => {
    loading.value = true;
    if (e) {
        options.value.page = e.page + 1;
        options.value.limit = e.rows;
    }
    try {
        const res = await request.post('comprehensive-documents/paginate', options.value);
        if (res.status) {
            items.value = res.data;
            total.value = res.tot;
        }
        loading.value = false;
    } catch (error) {
        loading.value = false;
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في جلب البيانات', life: 3000 });
    }
};

function openNew() {
    item.value = { is_active: true, sort_order: 0 };
    documentFile.value = null;
    imageFile.value = null;
    item.value.previewImage = null;
    submitted.value = false;
    itemDialog.value = true;
}

function hideDialog() {
    itemDialog.value = false;
    submitted.value = false;
    documentFile.value = null;
    imageFile.value = null;
    item.value.previewImage = null;
}

function hideEditDialog() {
    editItemDialog.value = false;
    submitted.value = false;
    documentFile.value = null;
    imageFile.value = null;
    item.value.previewImage = null;
}

function onSelectDocument(event) {
    const file = event.files?.[0];
    if (file) {
        if (file.size > 5000000) {
            toast.add({ severity: 'error', summary: 'خطأ', detail: 'حجم الملف يجب ألا يتجاوز 5 ميغابايت', life: 3000 });
            event.files = [];
            return;
        }
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
            toast.add({ severity: 'error', summary: 'خطأ', detail: 'يجب تحميل ملف PDF أو Word فقط', life: 3000 });
            event.files = [];
            return;
        }
        documentFile.value = file;
        event.files = [];
    } else {
        documentFile.value = null;
    }
}

function onSelectImage(event) {
    const file = event.files?.[0];
    if (file) {
        if (file.size > 1000000) {
            toast.add({ severity: 'error', summary: 'خطأ', detail: 'حجم الصورة يجب ألا يتجاوز 1 ميغابايت', life: 3000 });
            event.files = [];
            return;
        }
        if (!file.type.startsWith('image/')) {
            toast.add({ severity: 'error', summary: 'خطأ', detail: 'يجب تحميل صورة فقط', life: 3000 });
            event.files = [];
            return;
        }
        imageFile.value = file;
        item.value.previewImage = URL.createObjectURL(file);
        event.files = [];
    } else {
        imageFile.value = null;
        item.value.previewImage = null;
    }
}

async function saveItem() {
    submitted.value = true;
    if (!item.value.name_ar || !documentFile.value) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'الاسم العربي والملف مطلوبان', life: 3000 });
        return;
    }

    loading.value = true;
    const formData = new FormData();
    formData.append('name_ar', item.value.name_ar || '');
    if (item.value.name_en) formData.append('name_en', item.value.name_en);
    if (item.value.description_ar) formData.append('description_ar', item.value.description_ar);
    if (item.value.description_en) formData.append('description_en', item.value.description_en);
    if (documentFile.value instanceof File) {
        formData.append('file_url', documentFile.value);
    } else {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'الملف غير صالح', life: 3000 });
        loading.value = false;
        return;
    }
    if (imageFile.value instanceof File) {
        formData.append('image_url', imageFile.value);
    }
    formData.append('is_active', item.value.is_active ? '1' : '0');
    formData.append('sort_order', item.value.sort_order?.toString() || '0');

    // Optional: Debug FormData contents
    // for (const pair of formData.entries()) {
    //     console.log(`${pair[0]}: ${pair[1]}`);
    // }

    try {
        const res = await request.post('comprehensive-documents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم إنشاء المستند', life: 3000 });
            get();
            hideDialog();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في إنشاء المستند', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في إنشاء المستند', life: 3000 });
    } finally {
        loading.value = false;
    }
}

async function edit() {
    submitted.value = true;
    if (!item.value.name_ar) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'الاسم العربي مطلوب', life: 3000 });
        return;
    }

    loading.value = true;
    const formData = new FormData();
    formData.append('name_ar', item.value.name_ar || '');
    if (item.value.name_en) formData.append('name_en', item.value.name_en);
    if (item.value.description_ar) formData.append('description_ar', item.value.description_ar);
    if (item.value.description_en) formData.append('description_en', item.value.description_en);
    if (documentFile.value instanceof File) {
        formData.append('file_url', documentFile.value);
    }
    if (imageFile.value instanceof File) {
        formData.append('image_url', imageFile.value);
    }
    formData.append('is_active', item.value.is_active ? '1' : '0');
    formData.append('sort_order', item.value.sort_order?.toString() || '0');

    // Optional: Debug FormData contents
    // for (const pair of formData.entries()) {
    //     console.log(`${pair[0]}: ${pair[1]}`);
    // }

    try {
        const res = await request.put(`comprehensive-documents/`, item.value.id, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم تحديث المستند', life: 3000 });
            get();
            hideEditDialog();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في تحديث المستند', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في تحديث المستند', life: 3000 });
    } finally {
        loading.value = false;
    }
}

function editItem(document) {
    item.value = { ...document, sort_order: document.sort_order || 0 };
    documentFile.value = null;
    imageFile.value = null;
    item.value.previewImage = null;
    editItemDialog.value = true;
}

function confirmDeleteItem(document) {
    item.value = document;
    deleteItemDialog.value = true;
}

async function deleteItem() {
    loading.value = true;
    try {
        const res = await request.delete(`comprehensive-documents/`, item.value?.id);
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف المستند', life: 3000 });
            get();
            deleteItemDialog.value = false;
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في حذف المستند', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في حذف المستند', life: 3000 });
    } finally {
        loading.value = false;
    }
}

function exportCSV() {
    dt.value.exportCSV();
}

function confirmDeleteSelected() {
    deleteItemsDialog.value = true;
}

async function deleteSelectedItems() {
    const items = selectedItems.value.map((item) => item.id);
    loading.value = true;
    try {
        const res = await request.delete('comprehensive-documents/bulk', { ids: items });
        if (res.status) {
            selectedItems.value = null;
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف المستندات', life: 3000 });
            deleteItemsDialog.value = false;
            get();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في حذف المستندات', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في حذف المستندات', life: 3000 });
    } finally {
        loading.value = false;
    }
}

function removeDocument() {
    documentFile.value = null;
}

function removeImage() {
    imageFile.value = null;
    item.value.previewImage = null;
}
</script>

<template>
    <div class="card" style="direction: rtl; text-align: right">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="جديد" icon="pi pi-plus" severity="primary" class="ml-2" @click="openNew" :loading="loading" />
                <Button label="حذف" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="loading || !selectedItems || !selectedItems.length" />
            </template>
            <template #end>
                <Button label="تصدير" icon="pi pi-upload" severity="secondary" @click="exportCSV" :loading="loading" />
            </template>
        </Toolbar>

        <DataTable ref="dt" v-model:selection="selectedItems" :value="items" dataKey="id" :rows="options.limit" :filters="filters" :totalRecords="total" :loading="loading">
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">إدارة المستندات الشاملة</h4>
                    <IconField>
                        <InputIcon class="pi pi-search" />
                        <InputText v-model="options.search" @change="search" placeholder="بحث..." />
                    </IconField>
                </div>
            </template>

            <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
            <Column field="id" header="المعرف" sortable style="min-width: 8rem"></Column>
            <Column field="name_ar" header="الاسم (عربي)" sortable style="min-width: 12rem"></Column>
            <Column field="name_en" header="الاسم (إنجليزي)" sortable style="min-width: 12rem"></Column>
            <Column field="file_url" header="رابط الملف" sortable style="min-width: 12rem">
                <template #body="slotProps">
                    <a :href="$imageService.getImageUrl(slotProps.data.file_url)" target="_blank" v-if="slotProps.data.file_url">عرض الملف</a>
                    <span v-else>-</span>
                </template>
            </Column>
            <Column field="image_url" header="الصورة" style="min-width: 10rem">
                <template #body="slotProps">
                    <img v-if="slotProps.data.image_url" :src="$imageService.getImageUrl(slotProps.data.image_url)" alt="Post Image" style="width: 50px; height: auto" />
                    <span v-else>-</span>
                </template>
            </Column>
            <Column field="is_active" header="نشط" sortable style="min-width: 8rem">
                <template #body="slotProps">
                    <i :class="slotProps.data.is_active ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'"></i>
                </template>
            </Column>
            <Column :exportable="false" style="min-width: 8rem">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" outlined rounded class="ml-2" @click="editItem(slotProps.data)" :loading="loading" />
                    <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteItem(slotProps.data)" :loading="loading" />
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
            currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} مستندات"
        ></Paginator>
    </div>

    <Dialog v-model:visible="itemDialog" :style="{ width: '600px' }" header="مستند جديد" :modal="true" style="direction: rtl; text-align: right">
        <div class="flex flex-col gap-6">
            <div>
                <label for="name_ar" class="block font-bold mb-2">الاسم (عربي)</label>
                <InputText id="name_ar" v-model.trim="item.name_ar" required autofocus :invalid="submitted && !item.name_ar" class="w-full" />
                <small v-if="submitted && !item.name_ar" class="text-red-500">الاسم العربي مطلوب.</small>
            </div>
            <div>
                <label for="name_en" class="block font-bold mb-2">الاسم (إنجليزي)</label>
                <InputText id="name_en" v-model.trim="item.name_en" class="w-full" />
            </div>
            <div>
                <label for="description_ar" class="block font-bold mb-2">الوصف (عربي)</label>
                <Textarea id="description_ar" v-model="item.description_ar" rows="4" class="w-full" />
            </div>
            <div>
                <label for="description_en" class="block font-bold mb-2">الوصف (إنجليزي)</label>
                <Textarea id="description_en" v-model="item.description_en" rows="4" class="w-full" />
            </div>
            <div>
                <label for="document" class="block font-bold mb-2">الملف</label>
                <FileUpload name="document[]" accept=".pdf,.doc,.docx" :maxFileSize="5000000" @select="onSelectDocument" chooseLabel="اختيار">
                    <template #empty>
                        <span>اسحب الملف هنا لرفعه.</span>
                    </template>
                </FileUpload>
                <small v-if="documentFile" class="text-gray-500">{{ documentFile.name }}</small>
                <small v-if="submitted && !documentFile" class="text-red-500">الملف مطلوب.</small>
            </div>
            <div>
                <label for="image" class="block font-bold mb-2">الصورة</label>
                <FileUpload name="image[]" accept="image/*" :maxFileSize="1000000" @select="onSelectImage" chooseLabel="اختيار">
                    <template #empty>
                        <span>اسحب الصورة هنا لرفعها.</span>
                    </template>
                </FileUpload>
                <small v-if="imageFile" class="text-gray-500">{{ imageFile.name }}</small>
                <img v-if="item.previewImage" :src="item.previewImage" alt="Preview" style="width: 100px; height: auto; margin-top: 10px" />
            </div>
            <div>
                <label for="sort_order" class="block font-bold mb-2">ترتيب العرض</label>
                <InputNumber id="sort_order" v-model="item.sort_order" class="w-full" />
            </div>
            <div>
                <label for="is_active" class="block font-bold mb-2">نشط</label>
                <InputSwitch id="is_active" v-model="item.is_active" />
            </div>
        </div>
        <template #footer>
            <Button label="إلغاء" icon="pi pi-times" text @click="hideDialog" :loading="loading" />
            <Button label="حفظ" icon="pi pi-check" @click="saveItem" :loading="loading" />
        </template>
    </Dialog>

    <Dialog v-model:visible="editItemDialog" :style="{ width: '600px' }" header="تعديل المستند" :modal="true" style="direction: rtl; text-align: right">
        <div class="flex flex-col gap-6">
            <div>
                <label for="name_ar" class="block font-bold mb-2">الاسم (عربي)</label>
                <InputText id="name_ar" v-model.trim="item.name_ar" required autofocus :invalid="submitted && !item.name_ar" class="w-full" />
                <small v-if="submitted && !item.name_ar" class="text-red-500">الاسم العربي مطلوب.</small>
            </div>
            <div>
                <label for="name_en" class="block font-bold mb-2">الاسم (إنجليزي)</label>
                <InputText id="name_en" v-model.trim="item.name_en" class="w-full" />
            </div>
            <div>
                <label for="description_ar" class="block font-bold mb-2">الوصف (عربي)</label>
                <Textarea id="description_ar" v-model="item.description_ar" rows="4" class="w-full" />
            </div>
            <div>
                <label for="description_en" class="block font-bold mb-2">الوصف (إنجليزي)</label>
                <Textarea id="description_en" v-model="item.description_en" rows="4" class="w-full" />
            </div>
            <div>
                <label for="document" class="block font-bold mb-2">الملف</label>
                <FileUpload name="document[]" accept=".pdf,.doc,.docx" :maxFileSize="5000000" @select="onSelectDocument" chooseLabel="اختيار">
                    <template #empty>
                        <span>اسحب الملف هنا لرفعه.</span>
                    </template>
                </FileUpload>
                <small v-if="documentFile" class="text-gray-500">{{ documentFile.name }}</small>
                <div v-if="item.file_url" class="mt-2">
                    <a :href="item.file_url" target="_blank">عرض الملف الحالي</a>
                    <Button label="إزالة الملف" icon="pi pi-trash" severity="danger" text @click="removeDocument" class="mt-2" />
                </div>
            </div>
            <div>
                <label for="image" class="block font-bold mb-2">الصورة</label>
                <FileUpload name="image[]" accept="image/*" :maxFileSize="1000000" @select="onSelectImage" chooseLabel="اختيار">
                    <template #empty>
                        <span>اسحب الصورة هنا لرفعها.</span>
                    </template>
                </FileUpload>
                <small v-if="imageFile" class="text-gray-500">{{ imageFile.name }}</small>
                <div v-if="item.previewImage || item.image_url" class="mt-2">
                    <img :src="item.previewImage || item.image_url" alt="Image" style="width: 100px; height: auto" />
                    <Button label="إزالة الصورة" icon="pi pi-trash" severity="danger" text @click="removeImage" class="mt-2" />
                </div>
            </div>
            <div>
                <label for="sort_order" class="block font-bold mb-2">ترتيب العرض</label>
                <InputNumber id="sort_order" v-model="item.sort_order" class="w-full" />
            </div>
            <div>
                <label for="is_active" class="block font-bold mb-2">نشط</label>
                <InputSwitch id="is_active" v-model="item.is_active" />
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
            <span v-if="item"
                >هل أنت متأكد من حذف <b>{{ item.name_ar }}</b
                >؟</span
            >
        </div>
        <template #footer>
            <Button label="لا" icon="pi pi-times" text @click="deleteItemDialog = false" :loading="loading" />
            <Button label="نعم" icon="pi pi-check" @click="deleteItem" :loading="loading" />
        </template>
    </Dialog>

    <Dialog v-model:visible="deleteItemsDialog" :style="{ width: '450px' }" header="تأكيد الحذف" :modal="true" style="direction: rtl; text-align: right">
        <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle !text-3xl" />
            <span>هل أنت متأكد من حذف المستندات المحددة؟</span>
        </div>
        <template #footer>
            <Button label="لا" icon="pi pi-times" text @click="deleteItemsDialog = false" :loading="loading" />
            <Button label="نعم" icon="pi pi-check" text @click="deleteSelectedItems" :loading="loading" />
        </template>
    </Dialog>
</template>
