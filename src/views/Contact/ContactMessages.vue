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
const viewItemDialog = ref(false);
const deleteItemDialog = ref(false);
const total = ref(0);
const deleteItemsDialog = ref(false);
const item = ref({});
const options = ref({
    page: 1,
    limit: 10,
    col: 'id',
    search: ''
});
const selectedItems = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const loading = ref(false);

const search = async () => {
    const res = await request.post('contact-messages/search', options.value);
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
        const res = await request.post('contact-messages/paginate', options.value);
        if (res.status) {
            items.value = res.data;
            total.value = res.tot;
        }
        loading.value = false;
    } catch (error) {
        loading.value = false;
    }
};

function viewItem(message) {
    item.value = { ...message };
    viewItemDialog.value = true;
}

function hideViewDialog() {
    viewItemDialog.value = false;
}

function confirmDeleteItem(message) {
    item.value = message;
    deleteItemDialog.value = true;
}

async function deleteItem() {
    loading.value = true;
    try {
        const res = await request.delete(`contact-messages/${item.value?.id}`);
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف الرسالة', life: 3000 });
            get();
            deleteItemDialog.value = false;
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في حذف الرسالة', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في حذف الرسالة', life: 3000 });
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
        const res = await request.delete('contact-messages/bulk', { ids: items });
        if (res.status) {
            selectedItems.value = null;
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف الرسائل', life: 3000 });
            deleteItemsDialog.value = false;
            get();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في حذف الرسائل', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في حذف الرسائل', life: 3000 });
    } finally {
        loading.value = false;
    }
}

function replyToMessage(email) {
    window.location.href = `mailto:${email}`;
}
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

        <DataTable ref="dt" v-model:selection="selectedItems" :value="items" dataKey="id" :rows="options.limit" :filters="filters" :totalRecords="total" :loading="loading">
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">إدارة رسائل التواصل</h4>
                    <IconField>
                        <InputIcon class="pi pi-search" />
                        <InputText v-model="options.search" @input="search" placeholder="بحث..." />
                    </IconField>
                </div>
            </template>

            <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
            <Column field="id" header="المعرف" sortable style="min-width: 8rem"></Column>
            <Column field="name" header="الاسم" sortable style="min-width: 12rem"></Column>
            <Column field="email" header="البريد الإلكتروني" sortable style="min-width: 14rem">
                <template #body="slotProps">
                    <a :href="`mailto:${slotProps.data.email}`" class="text-blue-500 hover:underline">{{ slotProps.data.email }}</a>
                </template>
            </Column>
            <Column field="phone" header="رقم الهاتف" sortable style="min-width: 12rem">
                <template #body="slotProps">
                    {{ slotProps.data.phone || '-' }}
                </template>
            </Column>
            <Column field="message" header="الرسالة" style="min-width: 16rem">
                <template #body="slotProps">
                    {{ slotProps.data.message ? slotProps.data.message.slice(0, 50) + '...' : '-' }}
                </template>
            </Column>
            <Column field="created_at" header="تاريخ الإنشاء" sortable style="min-width: 12rem">
                <template #body="slotProps">
                    {{ new Date(slotProps.data.createdAt).toLocaleDateString('wn-US', { day: '2-digit', month: 'long', year: 'numeric' }) }}
                </template>
            </Column>
            <Column :exportable="false" style="min-width: 10rem">
                <template #body="slotProps">
                    <Button icon="pi pi-eye" outlined rounded class="ml-2" @click="viewItem(slotProps.data)" :loading="loading" />
                    <Button icon="pi pi-envelope" outlined rounded severity="info" class="ml-2" @click="replyToMessage(slotProps.data.email)" :loading="loading" />
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
            currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} رسائل"
        ></Paginator>
    </div>

    <Dialog v-model:visible="viewItemDialog" :style="{ width: '600px' }" header="تفاصيل الرسالة" :modal="true" style="direction: rtl; text-align: right">
        <div class="flex flex-col gap-6">
            <div>
                <label class="block font-bold mb-2">الاسم</label>
                <span>{{ item.name || '-' }}</span>
            </div>
            <div>
                <label class="block font-bold mb-2">البريد الإلكتروني</label>
                <a :href="`mailto:${item.email}`" class="text-blue-500 hover:underline">{{ item.email || '-' }}</a>
            </div>
            <div>
                <label class="block font-bold mb-2">رقم الهاتف</label>
                <span>{{ item.phone || '-' }}</span>
            </div>
            <div>
                <label class="block font-bold mb-2">الرسالة</label>
                <p class="whitespace-pre-wrap">{{ item.message || '-' }}</p>
            </div>
            <div>
                <label class="block font-bold mb-2">تاريخ الإنشاء</label>
                <span>{{ item.createdAt ? new Date(item.createdAt).toLocaleString('ar-EG') : '-' }}</span>
            </div>
        </div>
        <template #footer>
            <Button label="إغلاق" icon="pi pi-times" text @click="hideViewDialog" :loading="loading" />
            <Button label="رد" icon="pi pi-envelope" severity="info" @click="replyToMessage(item.email)" :loading="loading" />
        </template>
    </Dialog>

    <Dialog v-model:visible="deleteItemDialog" :style="{ width: '450px' }" header="تأكيد الحذف" :modal="true" style="direction: rtl; text-align: right">
        <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle !text-3xl" />
            <span v-if="item">هل أنت متأكد من حذف الرسالة؟</span>
        </div>
        <template #footer>
            <Button label="لا" icon="pi pi-times" text @click="deleteItemDialog = false" :loading="loading" />
            <Button label="نعم" icon="pi pi-check" @click="deleteItem" :loading="loading" />
        </template>
    </Dialog>

    <Dialog v-model:visible="deleteItemsDialog" :style="{ width: '450px' }" header="تأكيد الحذف" :modal="true" style="direction: rtl; text-align: right">
        <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle !text-3xl" />
            <span>هل أنت متأكد من حذف الرسائل المحددة؟</span>
        </div>
        <template #footer>
            <Button label="لا" icon="pi pi-times" text @click="deleteItemsDialog = false" :loading="loading" />
            <Button label="نعم" icon="pi pi-check" text @click="deleteSelectedItems" :loading="loading" />
        </template>
    </Dialog>
</template>
