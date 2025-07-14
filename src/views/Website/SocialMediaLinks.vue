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
    col: 'platform',
    search: ''
});
const selectedItems = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const submitted = ref(false);
const loading = ref(false);

// Define platform options
const platformOptions = ref([
    { label: 'Facebook', value: 'facebook' },
    { label: 'Twitter', value: 'twitter' },
    { label: 'Instagram', value: 'instagram' },
    { label: 'LinkedIn', value: 'linkedin' },
    { label: 'YouTube', value: 'youtube' },
    { label: 'TikTok', value: 'tiktok' },
    { label: 'Snapchat', value: 'snapchat' },
    { label: 'Threads', value: 'threads' },
    { label: 'WhatsApp', value: 'whatsapp' },
    { label: 'Other', value: 'other' }
]);

const search = async () => {
    const res = await request.post('social-media-links/search', options.value);
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
        const res = await request.post('social-media-links/paginate', options.value);
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

async function saveItem() {
    submitted.value = true;
    if (!item.value.platform || !item.value.url) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'اسم المنصة والرابط مطلوبان', life: 3000 });
        return;
    }

    loading.value = true;
    const data = {
        platform: item.value.platform,
        url: item.value.url,
        is_active: item.value.is_active ? 1 : 0,
        sort_order: item.value.sort_order || 0
    };

    try {
        const res = await request.post('social-media-links', data);
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم إنشاء الرابط', life: 3000 });
            get();
            item.value = {};
            hideDialog();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في إنشاء الرابط', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في إنشاء الرابط', life: 3000 });
    } finally {
        loading.value = false;
    }
}

async function edit() {
    submitted.value = true;
    if (!item.value.platform || !item.value.url) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'اسم المنصة والرابط مطلوبان', life: 3000 });
        return;
    }

    loading.value = true;
    const data = {
        platform: item.value.platform,
        url: item.value.url,
        is_active: item.value.is_active ? 1 : 0,
        sort_order: item.value.sort_order || 0
    };

    try {
        const res = await request.put(`social-media-links`, item.value.id, data);
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم تحديث الرابط', life: 3000 });
            get();
            item.value = {};
            hideEditDialog();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في تحديث الرابط', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في تحديث الرابط', life: 3000 });
    } finally {
        loading.value = false;
    }
}

function editItem(link) {
    item.value = { ...link, sort_order: link.sort_order || 0 };
    editItemDialog.value = true;
}

function confirmDeleteItem(link) {
    item.value = link;
    deleteItemDialog.value = true;
}

async function deleteItem() {
    loading.value = true;
    try {
        const res = await request.delete(`social-media-links`, item.value?.id);
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف الرابط', life: 3000 });
            get();
            deleteItemDialog.value = false;
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في حذف الرابط', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في حذف الرابط', life: 3000 });
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
        const res = await request.delete('social-media-links/bulk', { ids: items });
        if (res.status) {
            selectedItems.value = null;
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف الروابط', life: 3000 });
            deleteItemsDialog.value = false;
            get();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في حذف الروابط', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في حذف الروابط', life: 3000 });
    } finally {
        loading.value = false;
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

        <DataTable paginatorPosition="both" ref="dt" v-model:selection="selectedItems" :value="items" dataKey="id" :rows="options.limit" :filters="filters" :totalRecords="total" :loading="loading">
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">إدارة روابط التواصل الاجتماعي</h4>
                    <IconField>
                        <InputIcon class="pi pi-search" />
                        <InputText v-model="options.search" @change="search" placeholder="بحث..." />
                    </IconField>
                </div>
            </template>

            <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
            <Column field="id" header="المعرف" sortable style="min-width: 8rem"></Column>
            <Column field="platform" header="المنصة" sortable style="min-width: 12rem"></Column>
            <Column field="url" header="الرابط" sortable style="min-width: 12rem">
                <template #body="slotProps">
                    <a :href="slotProps.data.url" target="_blank" v-if="slotProps.data.url">{{ slotProps.data.url }}</a>
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
            currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} روابط"
        ></Paginator>
    </div>

    <Dialog v-model:visible="itemDialog" :style="{ width: '600px' }" header="رابط جديد" :modal="true" style="direction: rtl; text-align: right">
        <div class="flex flex-col gap-6">
            <div>
                <label for="platform" class="block font-bold mb-2">المنصة</label>
                <Dropdown id="platform" v-model="item.platform" :options="platformOptions" optionLabel="label" optionValue="value" required autofocus :invalid="submitted && !item.platform" class="w-full" />
                <small v-if="submitted && !item.platform" class="text-red-500">اسم المنصة مطلوب.</small>
            </div>
            <div>
                <label for="url" class="block font-bold mb-2">الرابط</label>
                <InputText id="url" v-model.trim="item.url" required :invalid="submitted && !item.url" class="w-full" />
                <small v-if="submitted && !item.url" class="text-red-500">الرابط مطلوب.</small>
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

    <Dialog v-model:visible="editItemDialog" :style="{ width: '600px' }" header="تعديل الرابط" :modal="true" style="direction: rtl; text-align: right">
        <div class="flex flex-col gap-6">
            <div>
                <label for="platform" class="block font-bold mb-2">المنصة</label>
                <Dropdown id="platform" v-model="item.platform" :options="platformOptions" optionLabel="label" optionValue="value" required autofocus :invalid="submitted && !item.platform" class="w-full" />
                <small v-if="submitted && !item.platform" class="text-red-500">اسم المنصة مطلوب.</small>
            </div>
            <div>
                <label for="url" class="block font-bold mb-2">الرابط</label>
                <InputText id="url" v-model.trim="item.url" required :invalid="submitted && !item.url" class="w-full" />
                <small v-if="submitted && !item.url" class="text-red-500">الرابط مطلوب.</small>
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
                >هل أنت متأكد من حذف <b>{{ item.platform }}</b
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
            <span>هل أنت متأكد من حذف الروابط المحددة؟</span>
        </div>
        <template #footer>
            <Button label="لا" icon="pi pi-times" text @click="deleteItemsDialog = false" :loading="loading" />
            <Button label="نعم" icon="pi pi-check" text @click="deleteSelectedItems" :loading="loading" />
        </template>
    </Dialog>
</template>
