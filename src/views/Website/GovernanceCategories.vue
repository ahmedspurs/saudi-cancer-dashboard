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
    col: 'name',
    search: ''
});
const selectedItems = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const submitted = ref(false);
const loading = ref(false);

const search = async () => {
    const res = await request.post('governance-categories/search', options.value);
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
        const res = await request.post('governance-categories/paginate', options.value);
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
    item.value = {};
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
    if (!item.value.name) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'الاسم مطلوب', life: 3000 });
        return;
    }

    loading.value = true;
    const data = {
        name: item.value.name,
        name_en: item.value.name_en || null
    };

    try {
        const res = await request.post('governance-categories', data);
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم إنشاء الفئة', life: 3000 });
            get();
            item.value = {};
            hideDialog();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في إنشاء الفئة', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في إنشاء الفئة', life: 3000 });
    } finally {
        loading.value = false;
    }
}

async function edit() {
    submitted.value = true;
    if (!item.value.name) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'الاسم مطلوب', life: 3000 });
        return;
    }

    loading.value = true;
    const data = {
        name: item.value.name,
        name_en: item.value.name_en || null
    };

    try {
        const res = await request.put(`governance-categories`, item.value.id, data);
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم تحديث الفئة', life: 3000 });
            get();
            item.value = {};
            hideEditDialog();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في تحديث الفئة', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في تحديث الفئة', life: 3000 });
    } finally {
        loading.value = false;
    }
}

function editItem(category) {
    item.value = { ...category };
    editItemDialog.value = true;
}

function confirmDeleteItem(category) {
    item.value = category;
    deleteItemDialog.value = true;
}

async function deleteItem() {
    loading.value = true;
    try {
        const res = await request.delete(`governance-categories`, item.value?.id);
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف الفئة', life: 3000 });
            get();
            deleteItemDialog.value = false;
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في حذف الفئة', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في حذف الفئة', life: 3000 });
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
        const res = await request.delete('governance-categories/bulk', { ids: items });
        if (res.status) {
            selectedItems.value = null;
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف الفئات', life: 3000 });
            deleteItemsDialog.value = false;
            get();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في حذف الفئات', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في حذف الفئات', life: 3000 });
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

        <DataTable ref="dt" v-model:selection="selectedItems" :value="items" dataKey="id" :rows="options.limit" :filters="filters" :totalRecords="total" :loading="loading">
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">إدارة فئات الحوكمة</h4>
                    <IconField>
                        <InputIcon class="pi pi-search" />
                        <InputText v-model="options.search" @change="search" placeholder="بحث..." />
                    </IconField>
                </div>
            </template>

            <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
            <Column field="id" header="المعرف" sortable style="min-width: 8rem"></Column>
            <Column field="name" header="الاسم" sortable style="min-width: 12rem"></Column>
            <Column field="name_en" header="الاسم (إنجليزي)" sortable style="min-width: 12rem"></Column>
            <Column field="created" header="تاريخ الإنشاء" sortable style="min-width: 12rem"></Column>
            <Column field="updated" header="تاريخ التحديث" sortable style="min-width: 12rem"></Column>
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
            currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} فئات"
        ></Paginator>
    </div>

    <Dialog v-model:visible="itemDialog" :style="{ width: '600px' }" header="فئة جديدة" :modal="true" style="direction: rtl; text-align: right">
        <div class="flex flex-col gap-6">
            <div>
                <label for="name" class="block font-bold mb-2">الاسم</label>
                <InputText id="name" v-model.trim="item.name" required autofocus :invalid="submitted && !item.name" class="w-full" />
                <small v-if="submitted && !item.name" class="text-red-500">الاسم مطلوب.</small>
            </div>
            <div>
                <label for="name_en" class="block font-bold mb-2">الاسم (إنجليزي)</label>
                <InputText id="name_en" v-model.trim="item.name_en" class="w-full" />
            </div>
        </div>
        <template #footer>
            <Button label="إلغاء" icon="pi pi-times" text @click="hideDialog" :loading="loading" />
            <Button label="حفظ" icon="pi pi-check" @click="saveItem" :loading="loading" />
        </template>
    </Dialog>

    <Dialog v-model:visible="editItemDialog" :style="{ width: '600px' }" header="تعديل الفئة" :modal="true" style="direction: rtl; text-align: right">
        <div class="flex flex-col gap-6">
            <div>
                <label for="name" class="block font-bold mb-2">الاسم</label>
                <InputText id="name" v-model.trim="item.name" required autofocus :invalid="submitted && !item.name" class="w-full" />
                <small v-if="submitted && !item.name" class="text-red-500">الاسم مطلوب.</small>
            </div>
            <div>
                <label for="name_en" class="block font-bold mb-2">الاسم (إنجليزي)</label>
                <InputText id="name_en" v-model.trim="item.name_en" class="w-full" />
            </div>
            <div>
                <label for="created" class="block font-bold mb-2">تاريخ الإنشاء</label>
                <InputText id="created" v-model="item.created" disabled class="w-full" />
            </div>
            <div>
                <label for="updated" class="block font-bold mb-2">تاريخ التحديث</label>
                <InputText id="updated" v-model="item.updated" disabled class="w-full" />
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
                >هل أنت متأكد من حذف <b>{{ item.name }}</b
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
            <span>هل أنت متأكد من حذف الفئات المحددة؟</span>
        </div>
        <template #footer>
            <Button label="لا" icon="pi pi-times" text @click="deleteItemsDialog = false" :loading="loading" />
            <Button label="نعم" icon="pi pi-check" text @click="deleteSelectedItems" :loading="loading" />
        </template>
    </Dialog>
</template>
