<script setup>
import request from '@/service/Request';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

onMounted(() => {
    get();
    fetchCategories();
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
const categories = ref([]);
const options = ref({
    page: 1,
    limit: 10,
    col: 'title',
    search: ''
});
const selectedItems = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const submitted = ref(false);
const loading = ref(false);
const imageFile = ref(null);
const docFile = ref(null);

const fetchCategories = async () => {
    const res = await request.get('governance-categories');
    if (res.status) {
        categories.value = res.data;
    }
};

const search = async () => {
    const res = await request.post('governance/search', options.value);
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
        const res = await request.post('governance/paginate', options.value);
        if (res.status) {
            items.value = res.data;
            total.value = res.tot;
        }
        loading.value = false;
    } catch (error) {
        loading.value = false;
    }
};

function openNew() {
    item.value = {};
    imageFile.value = null;
    docFile.value = null;
    item.value.previewImage = null;
    item.value.previewFile = null;
    submitted.value = false;
    itemDialog.value = true;
}

function hideDialog() {
    itemDialog.value = false;
    submitted.value = false;
}

function hideEditDialog() {
    editItemDialog.value = false;
    submitted.value = false;
}

function onSelectImage(event) {
    const file = event.files[0];
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
    }
}

function onSelectFile(event) {
    const file = event.files[0];
    if (file) {
        if (file.size > 5000000) {
            // 5MB limit for files
            toast.add({ severity: 'error', summary: 'خطأ', detail: 'حجم الملف يجب ألا يتجاوز 5 ميغابايت', life: 3000 });
            event.files = [];
            return;
        }
        if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
            toast.add({ severity: 'error', summary: 'خطأ', detail: 'يجب تحميل ملف PDF أو Word فقط', life: 3000 });
            event.files = [];
            return;
        }
        docFile.value = file;
        item.value.previewFile = file.name;
        event.files = [];
    }
}

async function saveItem() {
    submitted.value = true;
    if (!item.value.title || !item.value.title_en) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'العنوان بالعربية والإنجليزية مطلوب', life: 3000 });
        return;
    }

    loading.value = true;
    const formData = new FormData();
    formData.append('title', item.value.title);
    formData.append('title_en', item.value.title_en);
    if (item.value.description) formData.append('description', item.value.description);
    if (item.value.description_en) formData.append('description_en', item.value.description_en);
    if (item.value.category_id) formData.append('category_id', item.value.category_id);
    if (item.value.date) formData.append('date', item.value.date);
    if (imageFile.value) formData.append('image', imageFile.value);
    if (docFile.value) formData.append('file', docFile.value);

    try {
        const res = await request.post('governance', formData);
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم إنشاء سجل الحوكمة', life: 3000 });
            get();
            item.value = {};
            imageFile.value = null;
            docFile.value = null;
            item.value.previewImage = null;
            item.value.previewFile = null;
            hideDialog();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في إنشاء سجل الحوكمة', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في إنشاء سجل الحوكمة', life: 3000 });
    } finally {
        loading.value = false;
    }
}

async function edit() {
    submitted.value = true;
    if (!item.value.title || !item.value.title_en) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'العنوان بالعربية والإنجليزية مطلوب', life: 3000 });
        return;
    }

    loading.value = true;
    const formData = new FormData();
    formData.append('title', item.value.title);
    formData.append('title_en', item.value.title_en);
    if (item.value.description) formData.append('description', item.value.description);
    if (item.value.description_en) formData.append('description_en', item.value.description_en);
    if (item.value.category_id) formData.append('category_id', item.value.category_id);
    if (item.value.date) formData.append('date', item.value.date);
    if (imageFile.value) formData.append('image', imageFile.value);
    if (docFile.value) formData.append('file', docFile.value);

    try {
        const res = await request.put(`governance`, item.value.id, formData);
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم تحديث سجل الحوكمة', life: 3000 });
            get();
            item.value = {};
            imageFile.value = null;
            docFile.value = null;
            item.value.previewImage = null;
            item.value.previewFile = null;
            hideEditDialog();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في تحديث سجل الحوكمة', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في تحديث سجل الحوكمة', life: 3000 });
    } finally {
        loading.value = false;
    }
}

function editItem(prod) {
    item.value = { ...prod };
    imageFile.value = null;
    docFile.value = null;
    item.value.previewImage = null;
    item.value.previewFile = null;
    editItemDialog.value = true;
}

function confirmDeleteItem(prod) {
    item.value = prod;
    deleteItemDialog.value = true;
}

async function deleteItem() {
    loading.value = true;
    try {
        const res = await request.delete(`governance`, item.value?.id);
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف سجل الحوكمة', life: 3000 });
            get();
            deleteItemDialog.value = false;
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في حذف سجل الحوكمة', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في حذف سجل الحوكمة', life: 3000 });
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
        const res = await request.delete('governance/bulk', { ids: items });
        if (res.status) {
            selectedItems.value = null;
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف سجلات الحوكمة', life: 3000 });
            deleteItemsDialog.value = false;
            get();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في حذف سجلات الحوكمة', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في حذف سجلات الحوكمة', life: 3000 });
    } finally {
        loading.value = false;
    }
}

function removeImage() {
    item.value.image_url = null;
    imageFile.value = null;
    item.value.previewImage = null;
}

function removeFile() {
    item.value.file = null;
    docFile.value = null;
    item.value.previewFile = null;
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
                    <h4 class="m-0">إدارة الحوكمة</h4>
                    <IconField>
                        <InputIcon class="pi pi-search" />
                        <InputText v-model="options.search" @change="search" placeholder="بحث..." />
                    </IconField>
                </div>
            </template>

            <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
            <Column field="id" header="المعرف" sortable style="min-width: 8rem"></Column>
            <Column field="title" header="العنوان" sortable style="min-width: 12rem"></Column>
            <Column field="title_en" header="العنوان (إنجليزي)" sortable style="min-width: 12rem"></Column>
            <Column field="category.name_ar" header="الفئة" sortable style="min-width: 12rem">
                <template #body="slotProps">
                    {{ slotProps.data.category ? slotProps.data.category.name_ar : '-' }}
                </template>
            </Column>
            <Column field="date" header="التاريخ" sortable style="min-width: 10rem"></Column>
            <Column field="image_url" header="الصورة" style="min-width: 10rem">
                <template #body="slotProps">
                    <img v-if="slotProps.data.image" :src="slotProps.data.image" alt="Governance Image" style="width: 50px; height: auto" />
                    <span v-else>-</span>
                </template>
            </Column>
            <Column field="file" header="الملف" style="min-width: 10rem">
                <template #body="slotProps">
                    <a v-if="slotProps.data.file" :href="slotProps.data.file" target="_blank">عرض الملف</a>
                    <span v-else>-</span>
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
            currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} سجلات حوكمة"
        ></Paginator>
    </div>

    <Dialog v-model:visible="itemDialog" :style="{ width: '600px' }" header="سجل حوكمة جديد" :modal="true" style="direction: rtl; text-align: right">
        <div class="flex flex-col gap-6">
            <div>
                <label for="title" class="block font-bold mb-2">العنوان</label>
                <InputText id="title" v-model.trim="item.title" required autofocus :invalid="submitted && !item.title" class="w-full" />
                <small v-if="submitted && !item.title" class="text-red-500">العنوان مطلوب.</small>
            </div>
            <div>
                <label for="title_en" class="block font-bold mb-2">العنوان (إنجليزي)</label>
                <InputText id="title_en" v-model.trim="item.title_en" required :invalid="submitted && !item.title_en" class="w-full" />
                <small v-if="submitted && !item.title_en" class="text-red-500">العنوان بالإنجليزية مطلوب.</small>
            </div>
            <div>
                <label for="description" class="block font-bold mb-2">الوصف</label>
                <Textarea id="description" v-model="item.description" rows="4" class="w-full" />
            </div>
            <div>
                <label for="description_en" class="block font-bold mb-2">الوصف (إنجليزي)</label>
                <Textarea id="description_en" v-model="item.description_en" rows="4" class="w-full" />
            </div>
            <div>
                <label for="category_id" class="block font-bold mb-2">الفئة</label>
                <Dropdown id="category_id" v-model="item.category_id" :options="categories" optionLabel="name" optionValue="id" placeholder="اختر فئة" class="w-full" />
            </div>
            <div>
                <label for="date" class="block font-bold mb-2">التاريخ</label>
                <InputText id="date" v-model="item.date" type="date" class="w-full" />
            </div>
            <div>
                <label for="image" class="block font-bold mb-2">الصورة</label>
                <FileUpload name="image" accept="image/*" :maxFileSize="1000000" @select="onSelectImage" chooseLabel="اختيار">
                    <template #empty>
                        <span>اسحب الصورة هنا لرفعها.</span>
                    </template>
                </FileUpload>
                <small v-if="imageFile" class="text-gray-500">{{ imageFile.name }}</small>
                <img v-if="item.previewImage" :src="item.previewImage" alt="Preview" style="width: 100px; height: auto; margin-top: 10px" />
            </div>
            <div>
                <label for="file" class="block font-bold mb-2">الملف</label>
                <FileUpload name="file" accept=".pdf,.doc,.docx" :maxFileSize="5000000" @select="onSelectFile" chooseLabel="اختيار">
                    <template #empty>
                        <span>اسحب الملف (PDF أو Word) هنا لرفعه.</span>
                    </template>
                </FileUpload>
                <small v-if="docFile" class="text-gray-500">{{ docFile.name }}</small>
            </div>
        </div>
        <template #footer>
            <Button label="إلغاء" icon="pi pi-times" text @click="hideDialog" :loading="loading" />
            <Button label="حفظ" icon="pi pi-check" @click="saveItem" :loading="loading" />
        </template>
    </Dialog>

    <Dialog v-model:visible="editItemDialog" :style="{ width: '600px' }" header="تعديل سجل الحوكمة" :modal="true" style="direction: rtl; text-align: right">
        <div class="flex flex-col gap-6">
            <div>
                <label for="title" class="block font-bold mb-2">العنوان</label>
                <InputText id="title" v-model.trim="item.title" required autofocus :invalid="submitted && !item.title" class="w-full" />
                <small v-if="submitted && !item.title" class="text-red-500">العنوان مطلوب.</small>
            </div>
            <div>
                <label for="title_en" class="block font-bold mb-2">العنوان (إنجليزي)</label>
                <InputText id="title_en" v-model.trim="item.title_en" required :invalid="submitted && !item.title_en" class="w-full" />
                <small v-if="submitted && !item.title_en" class="text-red-500">العنوان بالإنجليزية مطلوب.</small>
            </div>
            <div>
                <label for="description" class="block font-bold mb-2">الوصف</label>
                <Textarea id="description" v-model="item.description" rows="4" class="w-full" />
            </div>
            <div>
                <label for="description_en" class="block font-bold mb-2">الوصف (إنجليزي)</label>
                <Textarea id="description_en" v-model="item.description_en" rows="4" class="w-full" />
            </div>
            <div>
                <label for="category_id" class="block font-bold mb-2">الفئة</label>
                <Dropdown id="category_id" v-model="item.category_id" :options="categories" optionLabel="name" optionValue="id" placeholder="اختر فئة" class="w-full" />
            </div>
            <div>
                <label for="date" class="block font-bold mb-2">التاريخ</label>
                <InputText id="date" v-model="item.date" type="date" class="w-full" />
            </div>
            <div>
                <label for="image" class="block font-bold mb-2">الصورة</label>
                <FileUpload name="image" accept="image/*" :maxFileSize="1000000" @select="onSelectImage" chooseLabel="اختيار">
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
                <label for="file" class="block font-bold mb-2">الملف</label>
                <FileUpload name="file" accept=".pdf,.doc,.docx" :maxFileSize="5000000" @select="onSelectFile" chooseLabel="اختيار">
                    <template #empty>
                        <span>اسحب الملف (PDF أو Word) هنا لرفعه.</span>
                    </template>
                </FileUpload>
                <small v-if="docFile || item.file" class="text-gray-500">{{ docFile ? docFile.name : item.file }}</small>
                <Button v-if="item.file || docFile" label="إزالة الملف" icon="pi pi-trash" severity="danger" text @click="removeFile" class="mt-2" />
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
                >هل أنت متأكد من حذف <b>{{ item.title }}</b
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
            <span>هل أنت متأكد من حذف سجلات الحوكمة المحددة؟</span>
        </div>
        <template #footer>
            <Button label="لا" icon="pi pi-times" text @click="deleteItemsDialog = false" :loading="loading" />
            <Button label="نعم" icon="pi pi-check" text @click="deleteSelectedItems" :loading="loading" />
        </template>
    </Dialog>
</template>
