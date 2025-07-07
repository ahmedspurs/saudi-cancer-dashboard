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
    col: 'title_ar',
    search: ''
});
const selectedItems = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const submitted = ref(false);
const loading = ref(false);
const imageFile = ref(null);

const search = async () => {
    const res = await request.post('static-sections/search', options.value);
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
        const res = await request.post('static-sections/paginate', options.value);
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
    imageFile.value = null;
    item.value.previewImage = null;
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

function generateSlug(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

async function saveItem() {
    submitted.value = true;
    if (!item.value.title_ar || !item.value.slug) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'العنوان العربي والرابط مطلوبان', life: 3000 });
        return;
    }

    loading.value = true;
    const formData = new FormData();
    formData.append('title_ar', item.value.title_ar);
    if (item.value.title_en) formData.append('title_en', item.value.title_en);
    formData.append('slug', item.value.slug);
    if (item.value.content_ar) formData.append('content_ar', item.value.content_ar);
    if (item.value.content_en) formData.append('content_en', item.value.content_en);
    if (item.value.meta_title_ar) formData.append('meta_title_ar', item.value.meta_title_ar);
    if (item.value.meta_title_en) formData.append('meta_title_en', item.value.meta_title_en);
    if (item.value.meta_description_ar) formData.append('meta_description_ar', item.value.meta_description_ar);
    if (item.value.meta_description_en) formData.append('meta_description_en', item.value.meta_description_en);
    formData.append('is_active', item.value.is_active ? '1' : '0');
    formData.append('sort_order', item.value.sort_order || 0);
    if (imageFile.value) {
        formData.append('image_url', imageFile.value);
    }

    try {
        const res = await request.post('static-sections', formData);
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم إنشاء القسم', life: 3000 });
            get();
            item.value = {};
            imageFile.value = null;
            item.value.previewImage = null;
            hideDialog();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في إنشاء القسم', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في إنشاء القسم', life: 3000 });
    } finally {
        loading.value = false;
    }
}

async function edit() {
    submitted.value = true;
    if (!item.value.title_ar || !item.value.slug) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'العنوان العربي والرابط مطلوبان', life: 3000 });
        return;
    }

    loading.value = true;
    const formData = new FormData();
    formData.append('title_ar', item.value.title_ar);
    if (item.value.title_en) formData.append('title_en', item.value.title_en);
    formData.append('slug', item.value.slug);
    if (item.value.content_ar) formData.append('content_ar', item.value.content_ar);
    if (item.value.content_en) formData.append('content_en', item.value.content_en);
    if (item.value.meta_title_ar) formData.append('meta_title_ar', item.value.meta_title_ar);
    if (item.value.meta_title_en) formData.append('meta_title_en', item.value.meta_title_en);
    if (item.value.meta_description_ar) formData.append('meta_description_ar', item.value.meta_description_ar);
    if (item.value.meta_description_en) formData.append('meta_description_en', item.value.meta_description_en);
    formData.append('is_active', item.value.is_active ? '1' : '0');
    formData.append('sort_order', item.value.sort_order || 0);
    if (imageFile.value) {
        formData.append('image_url', imageFile.value);
    }

    try {
        const res = await request.put(`static-sections`, item.value.id, formData);
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم تحديث القسم', life: 3000 });
            get();
            item.value = {};
            imageFile.value = null;
            item.value.previewImage = null;
            hideEditDialog();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في تحديث القسم', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في تحديث القسم', life: 3000 });
    } finally {
        loading.value = false;
    }
}

function editItem(section) {
    item.value = { ...section, sort_order: section.sort_order || 0 };
    imageFile.value = null;
    item.value.previewImage = null;
    editItemDialog.value = true;
}

function confirmDeleteItem(section) {
    item.value = section;
    deleteItemDialog.value = true;
}

async function deleteItem() {
    loading.value = true;
    try {
        const res = await request.delete(`static-sections`, item.value?.id);
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف القسم', life: 3000 });
            get();
            deleteItemDialog.value = false;
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في حذف القسم', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في حذف القسم', life: 3000 });
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
        const res = await request.delete('static-sections/bulk', { ids: items });
        if (res.status) {
            selectedItems.value = null;
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف الأقسام', life: 3000 });
            deleteItemsDialog.value = false;
            get();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في حذف الأقسام', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في حذف الأقسام', life: 3000 });
    } finally {
        loading.value = false;
    }
}

function removeImage() {
    item.value.image_url = null;
    imageFile.value = null;
    item.value.previewImage = null;
}

function updateSlug() {
    if (item.value.title_ar) {
        item.value.slug = generateSlug(item.value.title_ar);
    } else if (item.value.title_en) {
        item.value.slug = generateSlug(item.value.title_en);
    }
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
                    <h4 class="m-0">إدارة الأقسام الثابتة</h4>
                    <IconField>
                        <InputIcon class="pi pi-search" />
                        <InputText v-model="options.search" @change="search" placeholder="بحث..." />
                    </IconField>
                </div>
            </template>

            <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
            <Column field="id" header="المعرف" sortable style="min-width: 8rem"></Column>
            <Column field="title_ar" header="العنوان (عربي)" sortable style="min-width: 12rem"></Column>
            <Column field="title_en" header="العنوان (إنجليزي)" sortable style="min-width: 12rem"></Column>
            <Column field="slug" header="الرابط" sortable style="min-width: 12rem"></Column>
            <Column field="is_active" header="نشط" sortable style="min-width: 8rem">
                <template #body="slotProps">
                    <i :class="slotProps.data.is_active ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'"></i>
                </template>
            </Column>
            <Column field="image_url" header="الصورة" style="min-width: 10rem">
                <template #body="slotProps">
                    <img v-if="slotProps.data.image_url" :src="slotProps.data.image_url" alt="Section Image" style="width: 50px; height: auto" />
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
            currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} أقسام"
        ></Paginator>
    </div>

    <Dialog v-model:visible="itemDialog" :style="{ width: '600px' }" header="قسم ثابت جديد" :modal="true" style="direction: rtl; text-align: right">
        <div class="flex flex-col gap-6">
            <div>
                <label for="title_ar" class="block font-bold mb-2">العنوان (عربي)</label>
                <InputText id="title_ar" v-model.trim="item.title_ar" required autofocus :invalid="submitted && !item.title_ar" class="w-full" @input="updateSlug" />
                <small v-if="submitted && !item.title_ar" class="text-red-500">العنوان العربي مطلوب.</small>
            </div>
            <div>
                <label for="title_en" class="block font-bold mb-2">العنوان (إنجليزي)</label>
                <InputText id="title_en" v-model.trim="item.title_en" class="w-full" @input="updateSlug" />
            </div>
            <div>
                <label for="slug" class="block font-bold mb-2">الرابط</label>
                <InputText id="slug" v-model.trim="item.slug" required :invalid="submitted && !item.slug" class="w-full" />
                <small v-if="submitted && !item.slug" class="text-red-500">الرابط مطلوب.</small>
            </div>
            <div>
                <label for="content_ar" class="block font-bold mb-2">المحتوى (عربي)</label>
                <Editor id="content_ar" v-model="item.content_ar" editorStyle="height: 200px" class="w-full" />
            </div>
            <div>
                <label for="content_en" class="block font-bold mb-2">المحتوى (إنجليزي)</label>
                <Editor id="content_en" v-model="item.content_en" editorStyle="height: 200px" class="w-full" />
            </div>
            <div>
                <label for="meta_title_ar" class="block font-bold mb-2">عنوان الـ SEO (عربي)</label>
                <InputText id="meta_title_ar" v-model.trim="item.meta_title_ar" class="w-full" />
            </div>
            <div>
                <label for="meta_title_en" class="block font-bold mb-2">عنوان الـ SEO (إنجليزي)</label>
                <InputText id="meta_title_en" v-model.trim="item.meta_title_en" class="w-full" />
            </div>
            <div>
                <label for="meta_description_ar" class="block font-bold mb-2">وصف الـ SEO (عربي)</label>
                <Textarea id="meta_description_ar" v-model="item.meta_description_ar" rows="4" class="w-full" />
            </div>
            <div>
                <label for="meta_description_en" class="block font-bold mb-2">وصف الـ SEO (إنجليزي)</label>
                <Textarea id="meta_description_en" v-model="item.meta_description_en" rows="4" class="w-full" />
            </div>
            <div>
                <label for="image" class="block font-bold mb-2">الصورة</label>
                <FileUpload name="demo[]" accept="image/*" :maxFileSize="1000000" @select="onSelectImage" chooseLabel="اختيار">
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

    <Dialog v-model:visible="editItemDialog" :style="{ width: '600px' }" header="تعديل القسم الثابت" :modal="true" style="direction: rtl; text-align: right">
        <div class="flex flex-col gap-6">
            <div>
                <label for="title_ar" class="block font-bold mb-2">العنوان (عربي)</label>
                <InputText id="title_ar" v-model.trim="item.title_ar" required autofocus :invalid="submitted && !item.title_ar" class="w-full" @input="updateSlug" />
                <small v-if="submitted && !item.title_ar" class="text-red-500">العنوان العربي مطلوب.</small>
            </div>
            <div>
                <label for="title_en" class="block font-bold mb-2">العنوان (إنجليزي)</label>
                <InputText id="title_en" v-model.trim="item.title_en" class="w-full" @input="updateSlug" />
            </div>
            <div>
                <label for="slug" class="block font-bold mb-2">الرابط</label>
                <InputText id="slug" v-model.trim="item.slug" required :invalid="submitted && !item.slug" class="w-full" />
                <small v-if="submitted && !item.slug" class="text-red-500">الرابط مطلوب.</small>
            </div>
            <div>
                <label for="content_ar" class="block font-bold mb-2">المحتوى (عربي)</label>
                <Editor id="content_ar" v-model="item.content_ar" editorStyle="height: 200px" class="w-full" />
            </div>
            <div>
                <label for="content_en" class="block font-bold mb-2">المحتوى (إنجليزي)</label>
                <Editor id="content_en" v-model="item.content_en" editorStyle="height: 200px" class="w-full" />
            </div>
            <div>
                <label for="meta_title_ar" class="block font-bold mb-2">عنوان الـ SEO (عربي)</label>
                <InputText id="meta_title_ar" v-model.trim="item.meta_title_ar" class="w-full" />
            </div>
            <div>
                <label for="meta_title_en" class="block font-bold mb-2">عنوان الـ SEO (إنجليزي)</label>
                <InputText id="meta_title_en" v-model.trim="item.meta_title_en" class="w-full" />
            </div>
            <div>
                <label for="meta_description_ar" class="block font-bold mb-2">وصف الـ SEO (عربي)</label>
                <Textarea id="meta_description_ar" v-model="item.meta_description_ar" rows="4" class="w-full" />
            </div>
            <div>
                <label for="meta_description_en" class="block font-bold mb-2">وصف الـ SEO (إنجليزي)</label>
                <Textarea id="meta_description_en" v-model="item.meta_description_en" rows="4" class="w-full" />
            </div>
            <div>
                <label for="image" class="block font-bold mb-2">الصورة</label>
                <FileUpload name="demo[]" accept="image/*" :maxFileSize="1000000" @select="onSelectImage" chooseLabel="اختيار">
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
                >هل أنت متأكد من حذف <b>{{ item.title_ar }}</b
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
            <span>هل أنت متأكد من حذف الأقسام المحددة؟</span>
        </div>
        <template #footer>
            <Button label="لا" icon="pi pi-times" text @click="deleteItemsDialog = false" :loading="loading" />
            <Button label="نعم" icon="pi pi-check" text @click="deleteSelectedItems" :loading="loading" />
        </template>
    </Dialog>
</template>
