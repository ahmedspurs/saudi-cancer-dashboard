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
const total = ref(0);
const options = ref({
    page: 1,
    limit: 10,
    col: 'name',
    search: ''
});
const selectedItems = ref();
const loading = ref(false);
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const search = async () => {
    const res = await request.post('donations-common/search', options.value);
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
        const res = await request.post('donations-common/paginate', options.value);
        if (res.status) {
            items.value = res.data;
            total.value = res.tot;
        }
        loading.value = false;
    } catch (error) {
        loading.value = false;
    }
};

function exportCSV() {
    dt.value.exportCSV();
}
</script>

<template>
    <div dir="rtl">
        <div class="card">
            <Toolbar class="mb-6">
                <template #end>
                    <Button label="تصدير" icon="pi pi-upload" severity="secondary" @click="exportCSV($event)" />
                </template>
            </Toolbar>

            <DataTable paginatorPosition="both" ref="dt" v-model:selection="selectedItems" :value="items" dataKey="id" :rows="options.limit" :filters="filters" :totalRecords="total" :loading="loading">
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">إدارة التبرعات</h4>
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
                <Column field="user.name" header="اسم المتبرع" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        {{ slotProps.data.user?.name || slotProps.data?.user_name || 'مجهول' }}
                    </template>
                </Column>

                <Column field="user_phone" header="رقم هاتف المتبرع" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        {{ slotProps.data.user_phone || '-' }}
                    </template>
                </Column>

                <Column field="category.name_ar" header="الفئة" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        {{ slotProps.data.category?.name_ar || slotProps.data.category?.name_en || 'غير محدد' }}
                    </template>
                </Column>

                <Column field="case.title" header="حالة التبرع" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <span v-if="slotProps.data.case">
                            {{ slotProps.data.case?.title || '-' }}
                        </span>

                        <span v-if="slotProps.data.gift">
                            اهداء الى
                            {{ slotProps.data.gift?.receiver_name || '-' }}
                        </span>
                    </template>
                </Column>
                <Column field="amount" header="المبلغ" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        {{ slotProps.data.amount ? `ر.س ${slotProps.data.amount}` : 'غير محدد' }}
                    </template>
                </Column>
                <Column field="status" header="الحالة" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        {{ slotProps.data.status == 'paid' ? 'مدفوع' : 'معلق' }}
                    </template>
                </Column>

                <Column field="created_at" header="تاريخ الإنشاء" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        {{ new Date(slotProps.data.createdAt).toLocaleDateString('wn-US', { day: '2-digit', month: 'long', year: 'numeric' }) }}
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
                currentPageReportTemplate="عرض {first} إلى {last} من إجمالي {totalRecords} تبرع"
            ></Paginator>
        </div>
    </div>
</template>

<script>
export default {
    methods: {
        formatPaymentStatus(status) {
            if (!status) return 'غير محدد';
            switch (status) {
                case 'success':
                    return 'ناجح';
                case 'failed':
                    return 'فشل';
                case 'pending':
                    return 'معلق';
                default:
                    return status;
            }
        }
    }
};
</script>
