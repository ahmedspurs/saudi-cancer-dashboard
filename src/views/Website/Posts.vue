<script setup>
import request from '@/service/Request';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

onMounted(() => {
    get();
});

const toast = useToast();
const router = useRouter();
const dt = ref();
const items = ref([]);
const total = ref(0);
const deleteItemDialog = ref(false);
const deleteItemsDialog = ref(false);
const item = ref({});
const options = ref({
    page: 1,
    limit: 10,
    col: 'title_ar',
    search: '',
    type: '' // Added for type filter
});
const selectedItems = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const loading = ref(false);
const typeOptions = ref([
    { label: 'الكل', value: '' },
    { label: 'أخبار', value: 'news' },
    { label: 'معرض الصور', value: 'gallery' }
]);

const search = async () => {
    loading.value = true;
    try {
        const res = await request.post('posts/search', options.value);
        if (res.status) {
            items.value = res.data;
            total.value = res.tot;
        }
        loading.value = false;
    } catch (error) {
        loading.value = false;
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في البحث', life: 3000 });
    }
};

const get = async (e) => {
    loading.value = true;
    if (e) {
        options.value.page = e.page + 1;
        options.value.limit = e.rows;
    }
    try {
        const res = await request.post('posts/search', options.value);
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

function confirmDeleteItem(prod) {
    item.value = prod;
    deleteItemDialog.value = true;
}

async function deleteItem() {
    loading.value = true;
    try {
        const res = await request.delete(`posts`, item.value?.id);
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف المنشور', life: 3000 });
            get();
            deleteItemDialog.value = false;
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في حذف المنشور', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في حذف المنشور', life: 3000 });
    } finally {
        loading.value = false;
    }
}

function confirmDeleteSelected() {
    deleteItemsDialog.value = true;
}

async function deleteSelectedItems() {
    const items = selectedItems.value.map((item) => item.id);
    loading.value = true;
    try {
        const res = await request.delete('posts/bulk', { ids: items });
        if (res.status) {
            selectedItems.value = null;
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف المنشورات', life: 3000 });
            deleteItemsDialog.value = false;
            get();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في حذف المنشورات', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في حذف المنشورات', life: 3000 });
    } finally {
        loading.value = false;
    }
}

function exportCSV() {
    dt.value.exportCSV();
}

function navigateToAdd() {
    router.push('/posts/add');
}

function navigateToEdit(id) {
    router.push(`/posts/edit/${id}`);
}
</script>

<template>
    <div class="card" style="direction: rtl; text-align: right">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="إضافة منشور" icon="pi pi-plus" severity="primary" class="ml-2" @click="navigateToAdd" :loading="loading" />
                <Button label="حذف" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="loading || !selectedItems || !selectedItems.length" />
            </template>
            <template #end>
                <Button label="تصدير" icon="pi pi-upload" severity="secondary" @click="exportCSV" :loading="loading" />
            </template>
        </Toolbar>

        <DataTable ref="dt" v-model:selection="selectedItems" :value="items" dataKey="id" :rows="options.limit" :filters="filters" :totalRecords="total" :loading="loading">
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">إدارة المنشورات</h4>
                    <div class="flex gap-2">
                        <Dropdown v-model="options.type" :options="typeOptions" optionLabel="label" optionValue="value" placeholder="اختر نوع المنشور" class="w-48" @change="get" />
                        <IconField>
                            <InputIcon class="pi pi-search" />
                            <InputText v-model="options.search" @change="search" placeholder="بحث..." />
                        </IconField>
                    </div>
                </div>
            </template>

            <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
            <Column field="id" header="المعرف" sortable style="min-width: 8rem"></Column>
            <Column field="type" header="النوع" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    {{ slotProps.data.type === 'news' ? 'أخبار' : 'معرض الصور' }}
                </template>
            </Column>
            <Column field="title_ar" header="العنوان (عربي)" sortable style="min-width: 12rem"></Column>
            <Column field="title_en" header="العنوان (إنجليزي)" sortable style="min-width: 12rem"></Column>
            <Column field="image_url" header="الصورة" style="min-width: 10rem">
                <template #body="slotProps">
                    <img v-if="slotProps.data.image_url" :src="slotProps.data.image_url" alt="Post Image" style="width: 50px; height: auto" />
                    <span v-else>-</span>
                </template>
            </Column>
            <Column field="is_active" header="نشط" sortable style="min-width: 8rem">
                <template #body="slotProps">
                    <i :class="slotProps.data.is_active ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'"></i>
                </template>
            </Column>
            <Column field="is_featured" header="مميز" sortable style="min-width: 8rem">
                <template #body="slotProps">
                    <i :class="slotProps.data.is_featured ? 'pi pi-star text-yellow-500' : 'pi pi-star-fill text-gray-500'"></i>
                </template>
            </Column>
            <Column :exportable="false" style="min-width: 8rem">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" outlined rounded class="ml-2" @click="navigateToEdit(slotProps.data.id)" :loading="loading" />
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
            currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} منشورات"
        ></Paginator>
    </div>

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
            <span>هل أنت متأكد من حذف المنشورات المحددة؟</span>
        </div>
        <template #footer>
            <Button label="لا" icon="pi pi-times" text @click="deleteItemsDialog = false" :loading="loading" />
            <Button label="نعم" icon="pi pi-check" text @click="deleteSelectedItems" :loading="loading" />
        </template>
    </Dialog>
</template>
