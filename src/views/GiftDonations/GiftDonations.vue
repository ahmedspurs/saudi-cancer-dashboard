<script setup>
import request from '@/service/Request';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

onMounted(() => {
    get();
    fetchDonations();
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
const donations = ref([]);
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
const submitted = ref(false);
const loading = ref(false);

const fetchDonations = async () => {
    const res = await request.get('donations');
    if (res.status) {
        donations.value = res.data;
    }
};

const search = async () => {
    const res = await request.post('gift-donations/search', options.value);
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
        const res = await request.post('gift-donations/paginate', options.value);
        if (res.status) {
            items.value = res.data;
            total.value = res.tot;
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في جلب البيانات', life: 3000 });
    } finally {
        loading.value = false;
    }
};

function openNew() {
    item.value = { sms_sent: false };
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
    if (!item.value.donation_id || !item.value.recipient_name || !item.value.phone || !item.value.message) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'جميع الحقول المطلوبة يجب ملؤها', life: 3000 });
        return;
    }

    loading.value = true;
    const formData = new FormData();
    formData.append('donation_id', item.value.donation_id);
    formData.append('recipient_name', item.value.recipient_name);
    formData.append('phone', item.value.phone);
    formData.append('message', item.value.message);
    formData.append('sms_sent', item.value.sms_sent ? '1' : '0');

    try {
        const res = await request.post('gift-donations', formData);
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم إنشاء هدية التبرع', life: 3000 });
            get();
            item.value = {};
            hideDialog();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في إنشاء هدية التبرع', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في إنشاء هدية التبرع', life: 3000 });
    } finally {
        loading.value = false;
    }
}

async function edit() {
    submitted.value = true;
    if (!item.value.donation_id || !item.value.recipient_name || !item.value.phone || !item.value.message) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'جميع الحقول المطلوبة يجب ملؤها', life: 3000 });
        return;
    }

    loading.value = true;
    const formData = new FormData();
    formData.append('donation_id', item.value.donation_id);
    formData.append('recipient_name', item.value.recipient_name);
    formData.append('phone', item.value.phone);
    formData.append('message', item.value.message);
    formData.append('sms_sent', item.value.sms_sent ? '1' : '0');

    try {
        const res = await request.put(`gift-donations/${item.value.id}`, formData);
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم تحديث هدية التبرع', life: 3000 });
            get();
            item.value = {};
            hideEditDialog();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في تحديث هدية التبرع', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في تحديث هدية التبرع', life: 3000 });
    } finally {
        loading.value = false;
    }
}

function editItem(gift) {
    item.value = { ...gift };
    editItemDialog.value = true;
}

function confirmDeleteItem(gift) {
    item.value = gift;
    deleteItemDialog.value = true;
}

async function deleteItem() {
    loading.value = true;
    try {
        const res = await request.delete(`gift-donations/${item.value?.id}`);
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف هدية التبرع', life: 3000 });
            get();
            deleteItemDialog.value = false;
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في حذف هدية التبرع', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في حذف هدية التبرع', life: 3000 });
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
        const res = await request.delete('gift-donations/bulk', { ids: items });
        if (res.status) {
            selectedItems.value = null;
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف هدايا التبرع', life: 3000 });
            deleteItemsDialog.value = false;
            get();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في حذف هدايا التبرع', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في حذف هدايا التبرع', life: 3000 });
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
                    <h4 class="m-0">إدارة هدايا التبرعات</h4>
                    <IconField>
                        <InputIcon class="pi pi-search" />
                        <InputText v-model="options.search" @change="search" placeholder="بحث..." />
                    </IconField>
                </div>
            </template>

            <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
            <Column field="id" header="المعرف" sortable style="min-width: 8rem"></Column>
            <Column field="donation_id" header="معرف التبرع" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    {{ slotProps.data.donation_id || '-' }}
                </template>
            </Column>
            <Column field="giver_name" header="اسم المرسل" sortable style="min-width: 12rem">
                <template #body="slotProps">
                    {{ slotProps.data.giver_name || '-' }}
                </template></Column
            >
            <Column field="receiver_name" header="اسم المستلم" sortable style="min-width: 12rem"></Column>
            <Column field="receiver_name" header="رقم الهاتف" sortable style="min-width: 12rem"></Column>
            <Column field="message" header="الرسالة" style="min-width: 15rem">
                <template #body="slotProps">
                    {{ slotProps.data.message || '-' }}
                </template>
            </Column>
            <Column field="sms_sent" header="تم إرسال SMS" style="min-width: 10rem">
                <template #body="slotProps">
                    <i :class="slotProps.data.sms_sent ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'"></i>
                </template>
            </Column>
            <Column field="created_at" header="تاريخ الإنشاء" sortable style="min-width: 12rem">
                <template #body="slotProps">
                    {{ new Date(slotProps.data.createdAt).toLocaleDateString('wn-US', { day: '2-digit', month: 'long', year: 'numeric' }) }}
                </template>
            </Column>
            <!-- <Column :exportable="false" style="min-width: 8rem">
                <template #body="slotProps">
                    <Button icon="pi pi-pencil" outlined rounded class="ml-2" @click="editItem(slotProps.data)" :loading="loading" />
                    <Button icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteItem(slotProps.data)" :loading="loading" />
                </template>
            </Column> -->
        </DataTable>
        <Paginator
            :rows="options.limit"
            :totalRecords="total"
            :currentPage="options.page"
            @page="get"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rowsPerPageOptions="[5, 10, 25]"
            currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} هدايا"
        ></Paginator>
    </div>

    <Dialog v-model:visible="itemDialog" :style="{ width: '600px' }" header="هدية تبرع جديدة" :modal="true" style="direction: rtl; text-align: right">
        <div class="flex flex-col gap-6">
            <div>
                <label for="donation_id" class="block font-bold mb-2">التبرع</label>
                <Dropdown id="donation_id" v-model="item.donation_id" :options="donations" optionLabel="id" optionValue="id" placeholder="اختر تبرع" :invalid="submitted && !item.donation_id" class="w-full" />
                <small v-if="submitted && !item.donation_id" class="text-red-500">التبرع مطلوب.</small>
            </div>
            <div>
                <label for="recipient_name" class="block font-bold mb-2">اسم المستلم</label>
                <InputText id="recipient_name" v-model="item.recipient_name" :invalid="submitted && !item.recipient_name" class="w-full" />
                <small v-if="submitted && !item.recipient_name" class="text-red-500">اسم المستلم مطلوب.</small>
            </div>
            <div>
                <label for="phone" class="block font-bold mb-2">رقم الهاتف</label>
                <InputText id="phone" v-model="item.phone" :invalid="submitted && !item.phone" class="w-full" />
                <small v-if="submitted && !item.phone" class="text-red-500">رقم الهاتف مطلوب.</small>
            </div>
            <div>
                <label for="message" class="block font-bold mb-2">الرسالة</label>
                <Textarea id="message" v-model="item.message" :invalid="submitted && !item.message" class="w-full" rows="4" />
                <small v-if="submitted && !item.message" class="text-red-500">الرسالة مطلوبة.</small>
            </div>
            <div>
                <label for="sms_sent" class="block font-bold mb-2">تم إرسال SMS</label>
                <Checkbox id="sms_sent" v-model="item.sms_sent" :binary="true" />
            </div>
        </div>
        <template #footer>
            <Button label="إلغاء" icon="pi pi-times" text @click="hideDialog" :loading="loading" />
            <Button label="حفظ" icon="pi pi-check" @click="saveItem" :loading="loading" />
        </template>
    </Dialog>

    <Dialog v-model:visible="editItemDialog" :style="{ width: '600px' }" header="تعديل هدية التبرع" :modal="true" style="direction: rtl; text-align: right">
        <div class="flex flex-col gap-6">
            <div>
                <label for="donation_id" class="block font-bold mb-2">التبرع</label>
                <Dropdown id="donation_id" v-model="item.donation_id" :options="donations" optionLabel="id" optionValue="id" placeholder="اختر تبرع" :invalid="submitted && !item.donation_id" class="w-full" />
                <small v-if="submitted && !item.donation_id" class="text-red-500">التبرع مطلوب.</small>
            </div>
            <div>
                <label for="recipient_name" class="block font-bold mb-2">اسم المستلم</label>
                <InputText id="recipient_name" v-model="item.recipient_name" :invalid="submitted && !item.recipient_name" class="w-full" />
                <small v-if="submitted && !item.recipient_name" class="text-red-500">اسم المستلم مطلوب.</small>
            </div>
            <div>
                <label for="phone" class="block font-bold mb-2">رقم الهاتف</label>
                <InputText id="phone" v-model="item.phone" :invalid="submitted && !item.phone" class="w-full" />
                <small v-if="submitted && !item.phone" class="text-red-500">رقم الهاتف مطلوب.</small>
            </div>
            <div>
                <label for="message" class="block font-bold mb-2">الرسالة</label>
                <Textarea id="message" v-model="item.message" :invalid="submitted && !item.message" class="w-full" rows="4" />
                <small v-if="submitted && !item.message" class="text-red-500">الرسالة مطلوبة.</small>
            </div>
            <div>
                <label for="sms_sent" class="block font-bold mb-2">تم إرسال SMS</label>
                <Checkbox id="sms_sent" v-model="item.sms_sent" :binary="true" />
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
            <span v-if="item">هل أنت متأكد من حذف هدية التبرع؟</span>
        </div>
        <template #footer>
            <Button label="لا" icon="pi pi-times" text @click="deleteItemDialog = false" :loading="loading" />
            <Button label="نعم" icon="pi pi-check" @click="deleteItem" :loading="loading" />
        </template>
    </Dialog>

    <Dialog v-model:visible="deleteItemsDialog" :style="{ width: '450px' }" header="تأكيد الحذف" :modal="true" style="direction: rtl; text-align: right">
        <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle !text-3xl" />
            <span>هل أنت متأكد من حذف هدايا التبرعات المحددة؟</span>
        </div>
        <template #footer>
            <Button label="pi pi-times" icon="text" @click="deleteItemsDialog" :loading="false" />
            <Button label="نعم" icon="pi pi-check" @click="deleteSelectedItems" :loading="loading" />
        </template>
    </Dialog>
</template>
