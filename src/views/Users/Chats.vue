<script setup>
import request from '@/service/Request';
import { FilterMatchMode } from '@primevue/core/api';
import { onMounted, ref } from 'vue';

onMounted(() => {
    get();
});

const dt = ref();
const items = ref([]);
const total = ref(0);
const options = ref({
    page: 1,
    limit: 10,
    col: 'message',
    search: ''
});
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const search = async () => {
    const res = await request.post('chats/search', options.value);
    if (res.status) {
        items.value = res.data;
        total.value = res.tot;
    }
};

const get = async (e) => {
    if (e) {
        options.value.page = e.page + 1;
        options.value.limit = e.rows;
    }
    const res = await request.post('chats/paginate', options.value);
    if (res.status) {
        items.value = res.data;
        total.value = res.tot;
    }
};

function exportCSV() {
    dt.value.exportCSV();
}
</script>

<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #end>
                    <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportCSV($event)" />
                </template>
            </Toolbar>

            <DataTable paginatorPosition="both" ref="dt" :value="items" dataKey="id" :rows="options.limit" :filters="filters" :totalRecords="total">
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">View Messages</h4>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="options.search" @change="search" placeholder="Search..." />
                        </IconField>
                    </div>
                </template>

                <Column field="id" header="ID" sortable style="min-width: 8rem"></Column>
                <Column field="message" header="Message" sortable style="min-width: 16rem"></Column>
                <Column field="user_id" header="User " sortable style="min-width: 8rem">
                    <template #body="slotProps">
                        <span>{{ slotProps?.data?.user?.name }}</span>
                    </template></Column
                >
                <Column field="community_id" header="Community " sortable style="min-width: 8rem">
                    <template #body="slotProps">
                        <span>{{ slotProps?.data?.community?.name }}</span>
                    </template></Column
                >
                <Column field="created" header="Date" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <span>{{ slotProps?.data?.created.split('T')[0] }}</span>
                    </template></Column
                >

                <Column field="created" header="Tilw" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <span>{{ slotProps?.data?.created.split('T')[1].split('.')[0] }}</span>
                    </template></Column
                >
            </DataTable>
            <Paginator
                :rows="options.limit"
                :totalRecords="total"
                :currentPage="options.page"
                @page="get"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} items"
            ></Paginator>
        </div>
    </div>
</template>
