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
const loading = ref(false);
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

const search = async () => {
    try {
        const res = await request.post('donation-categories/search', options.value);
        if (res.status) {
            items.value = res.data;
            total.value = res.tot;
        }
    } catch (error) {}
};

const get = async (e) => {
    loading.value = true;

    if (e) {
        options.value.page = e.page + 1;
        options.value.limit = e.rows;
    }
    try {
        const res = await request.post('donation-categories/paginate', options.value);
        if (res.status) {
            items.value = res.data;
            total.value = res.tot;
        }
        loading.value = false;
    } catch (error) {
        loading.value = false;
    }
};

const submitted = ref(false);

function openNew() {
    item.value = { is_active: true };
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
    if (!item.value.name_ar || !item.value.name_en) return;

    const formData = new FormData();
    for (var key in item.value) {
        formData.append(key, item.value[key]);
    }

    const res = await request.post('donation-categories', formData);
    if (res.status) {
        toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم إنشاء الفئة', life: 3000 });
        get();
        item.value = {};
        hideDialog();
    } else {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في إنشاء الفئة', life: 3000 });
    }
}

async function edit() {
    submitted.value = true;
    if (!item.value.name_ar || !item.value.name_en) return;

    const formData = new FormData();
    for (var key in item.value) {
        formData.append(key, item.value[key]);
    }

    const res = await request.put(`donation-categories`, item.value.id, formData);
    if (res.status) {
        toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم تحديث الفئة', life: 3000 });
        get();
        item.value = {};
        hideEditDialog();
    } else {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في تحديث الفئة', life: 3000 });
    }
}

function editItem(prod) {
    item.value = { ...prod };
    editItemDialog.value = true;
}

function confirmDeleteItem(prod) {
    console.log({ prod });

    item.value = prod;
    deleteItemDialog.value = true;
}

async function deleteItem() {
    const res = await request.delete(`donation-categories`, item.value?.id);
    if (res.status) {
        toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف الفئة', life: 3000 });
        get();
        deleteItemDialog.value = false;
    } else {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في حذف الفئة', life: 3000 });
        deleteItemDialog.value = false;
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
    try {
        const res = await request.delete('donation-categories/bulk', items);
        if (res.status) {
            selectedItems.value = null;
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف الفئات', life: 3000 });
            deleteItemsDialog.value = false;
            get();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في حذف الفئات', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في حذف الفئات', life: 3000 });
    }
}
</script>

<template>
    <div class="card" style="direction: rtl; text-align: right">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="جديد" icon="pi pi-plus" severity="primary" class="ml-2" @click="openNew" />
                <Button label="حذف" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedItems || !selectedItems.length" />
            </template>
            <template #end>
                <Button label="تصدير" icon="pi pi-upload" severity="secondary" @click="exportCSV" />
            </template>
        </Toolbar>

        <DataTable ref="dt" v-model:selection="selectedItems" :value="items" dataKey="id" :rows="options.limit" :filters="filters" :totalRecords="total" :loading="loading">
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">إدارة فئات التبرعات</h4>
                    <IconField>
                        <InputIcon>
                            <i class="pi pi-search" />
                        </InputIcon>
                        <InputText v-model="options.search" @input="search" placeholder="بحث..." />
                    </IconField>
                </div>
            </template>

            <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
            <Column field="id" header="المعرف" sortable style="min-width: 8rem"></Column>
            <Column field="name_ar" header="الاسم (عربي)" sortable style="min-width: 12rem"></Column>
            <Column field="name_en" header="الاسم (إنجليزي)" sortable style="min-width: 12rem"></Column>
            <Column field="is_active" header="نشط" sortable style="min-width: 8rem">
                <template #body="slotProps">
                    <i :class="slotProps.data.is_active ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'"></i>
                </template>
            </Column>
            <Column :exportable="false" style="min-width: 8rem">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" outlined rounded class="ml-2" @click="editItem(slotProps.data)" />

                    <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteItem(slotProps.data)" />
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

    <Dialog v-model:visible="itemDialog" :style="{ width: '450px' }" header="فئة تبرع جديدة" :modal="true" style="direction: rtl; text-align: right">
        <div class="flex flex-col gap-6">
            <div>
                <label for="name_ar" class="block font-bold mb-2">الاسم (عربي)</label>
                <InputText id="name_ar" v-model.trim="item.name_ar" required autofocus :invalid="submitted && !item.name_ar" class="w-full" />
                <small v-if="submitted && !item.name_ar" class="text-red-500">الاسم بالعربية مطلوب.</small>
            </div>
            <div>
                <label for="name_en" class="block font-bold mb-2">الاسم (إنجليزي)</label>
                <InputText id="name_en" v-model.trim="item.name_en" required autofocus :invalid="submitted && !item.name_en" class="w-full" />
                <small v-if="submitted && !item.name_en" class="text-red-500">الاسم بالإنجليزية مطلوب.</small>
            </div>
            <div>
                <label for="is_active" class="block font-bold mb-2">نشط</label>
                <InputSwitch id="is_active" v-model="item.is_active" />
            </div>
        </div>
        <template #footer>
            <Button label="إلغاء" icon="pi pi-times" text @click="hideDialog" />
            <Button label="حفظ" icon="pi pi-check" @click="saveItem" />
        </template>
    </Dialog>

    <Dialog v-model:visible="editItemDialog" :style="{ width: '450px' }" header="تعديل فئة التبرع" :modal="true" style="direction: rtl; text-align: right">
        <div class="flex flex-col gap-6">
            <div>
                <label for="name_ar" class="block font-bold mb-2">الاسم (عربي)</label>
                <InputText id="name_ar" v-model.trim="item.name_ar" required autofocus :invalid="submitted && !item.name_ar" class="w-full" />
                <small v-if="submitted && !item.name_ar" class="text-red-500">الاسم بالعربية مطلوب.</small>
            </div>
            <div>
                <label for="name_en" class="block font-bold mb-2">الاسم (إنجليزي)</label>
                <InputText id="name_en" v-model.trim="item.name_en" required autofocus :invalid="submitted && !item.name_en" class="w-full" />
                <small v-if="submitted && !item.name_en" class="text-red-500">الاسم بالإنجليزية مطلوب.</small>
            </div>
            <div>
                <label for="is_active" class="block font-bold mb-2">نشط</label>
                <InputSwitch id="is_active" v-model="item.is_active" />
            </div>
        </div>
        <template #footer>
            <Button label="إلغاء" icon="pi pi-times" text @click="hideEditDialog" />
            <Button label="حفظ" icon="pi pi-check" @click="edit" />
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
            <Button label="لا" icon="pi pi-times" text @click="deleteItemDialog = false" />
            <Button label="نعم" icon="pi pi-check" @click="deleteItem()" />
        </template>
    </Dialog>

    <Dialog v-model:visible="deleteItemsDialog" :style="{ width: '450px' }" header="تأكيد الحذف" :modal="true" style="direction: rtl; text-align: right">
        <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle !text-3xl" />
            <span>هل أنت متأكد من حذف الفئات المحددة؟</span>
        </div>
        <template #footer>
            <Button label="لا" icon="pi pi-times" text @click="deleteItemsDialog = false" />
            <Button label="نعم" icon="pi pi-check" text @click="deleteSelectedItems" />
        </template>
    </Dialog>
</template>
