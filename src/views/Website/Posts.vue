<script setup>
import request from '@/service/Request';
import { FilterMatchMode } from '@primevue/core/api';
import { debounce } from 'lodash'; // Ensure lodash is installed
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

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
    type_id: ''
});
const selectedItems = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const loading = ref(false);
const typeOptions = ref();

// Debounce the get function
const debouncedGet = debounce(() => {
    get();
}, 300);

onMounted(() => {
    getPostTypes();
    get();
});

const getPostTypes = async () => {
    try {
        const res = await request.get('post-types');
        typeOptions.value = res.data;
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في جلب أنواع المنشورات', life: 3000 });
    }
};

const get = async (event) => {
    if (loading.value) return;
    loading.value = true;
    try {
        if (event) {
            options.value.page = event.page + 1;
            options.value.limit = event.rows;
        }
        console.log('Fetching with options:', options.value); // Debug options
        const res = await request.post('posts/search', {
            ...options.value,
            search: options.value.search || ''
        });
        console.log('Response:', res); // Debug response
        if (res.status) {
            items.value = res.data;
            total.value = res.tot || 0;
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في جلب البيانات', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في جلب البيانات', life: 3000 });
    } finally {
        loading.value = false;
    }
};
// Watch for search input changes
watch(
    () => filters.value.global.value,
    (newVal) => {
        options.value.search = newVal || '';
        options.value.page = 1;
        debouncedGet();
    }
);

// Watch for type_id changes
watch(
    () => options.value.type_id,
    () => {
        options.value.page = 1;
        debouncedGet();
    }
);

// Handle page and rows per page changes
const onPageChange = (event) => {
    options.value.page = event.page + 1;
    options.value.limit = event.rows; // Ensure limit is updated
    get(event); // Call get directly to avoid debounce for pagination
};

const confirmDeleteItem = (prod) => {
    item.value = prod;
    deleteItemDialog.value = true;
};

const deleteItem = async () => {
    loading.value = true;
    try {
        const res = await request.delete(`posts`, item.value?.id);
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف المنشور', life: 3000 });
            await get();
            deleteItemDialog.value = false;
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في حذف المنشور', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في حذف المنشور', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const confirmDeleteSelected = () => {
    if (selectedItems.value?.length) {
        deleteItemsDialog.value = true;
    }
};

const deleteSelectedItems = async () => {
    loading.value = true;
    try {
        const items = selectedItems.value.map((item) => item.id);
        const res = await request.delete('posts/bulk', { data: { ids: items } });
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف المنشورات', life: 3000 });
            deleteItemsDialog.value = false;
            selectedItems.value = null;
            await get();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في حذف المنشورات', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في حذف المنشورات', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const exportCSV = () => {
    dt.value.exportCSV();
};

const navigateToAdd = () => {
    router.push('/add-post');
};

const navigateToEdit = (id) => {
    router.push(`/edit-post/${id}`);
};
</script>

<template>
    <div class="card" style="direction: rtl; text-align: right">
        <Toolbar class="mb-6">
            <template #start>
                <Button label="إضافة منشور" icon="pi pi-plus" severity="primary" class="ml-2" @click="navigateToAdd" :loading="loading" />
                <Button label="حذف" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedItems?.length || loading" />
            </template>
            <template #end>
                <Button label="تصدير" icon="pi pi-upload" severity="secondary" @click="exportCSV" :loading="loading" />
            </template>
        </Toolbar>

        {{ total }}
        {{ options.limit }}
        <DataTable
            ref="dt"
            v-model:selection="selectedItems"
            v-model:filters="filters"
            :value="items"
            dataKey="id"
            :loading="loading"
            @page="onPageChange"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} منشورات"
        >
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">إدارة المنشورات</h4>
                    <div class="flex gap-2">
                        <Dropdown v-model="options.type_id" :options="typeOptions" optionLabel="name" optionValue="id" placeholder="اختر نوع المنشور" class="w-48" />
                        <IconField>
                            <InputIcon class="pi pi-search" />
                            <InputText v-model="filters.global.value" placeholder="بحث..." />
                        </IconField>
                    </div>
                </div>
            </template>

            <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
            <Column field="id" header="المعرف" sortable style="min-width: 8rem"></Column>
            <Column field="type" header="النوع" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    {{ slotProps.data?.type?.name || 'غير محدد' }}
                </template>
            </Column>
            <Column field="title_ar" header="العنوان (عربي)" sortable style="min-width: 12rem"></Column>
            <Column field="title_en" header="العنوان (إنجليزي)" sortable style="min-width: 12rem"></Column>
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
            currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} أعضاء"
        ></Paginator>
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
    </div>
</template>
