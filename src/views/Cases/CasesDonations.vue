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
const donors = ref([]);
const patientCases = ref([]);
const statuses = ref([
    { name: 'معلق', value: 'pending' },
    { name: 'مؤكد', value: 'paid' },
    { name: 'مرفوض', value: 'faliled' }
]);
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
const imageFile = ref(null);

const fetchPatientCases = async () => {
    const res = await request.get('cases');
    if (res.status) {
        patientCases.value = res.data;
    }
};

const search = async () => {
    const res = await request.post('case-donations/search', options.value);
    if (res.status) {
        items.value = res.data;
        total.value = res.tot;
    }
};

const get = async (e) => {
    loading.value = false;

    if (e) {
        options.value.page = e.page + 1;
        options.value.limit = e.rows;
    }
    try {
        loading.value = true;

        const res = await request.post('case-donations/paginate', options.value);
        if (res.status) {
            items.value = res.data;
            total.value = res.tot;
        }
        loading.value = false;
    } catch (error) {
        loading.value = false;
    }
};

function openNew() {
    item.value = { status: 'pending' };
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
        console.log('Selected image:', file); // Debugging
        imageFile.value = file;
        item.value.previewImage = URL.createObjectURL(file);
        event.files = []; // Clear FileUpload
    }
}

async function saveItem() {
    submitted.value = true;
    if (!item.value.donor_id || !item.value.patient_case_id || !item.value.amount || !item.value.status) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'جميع الحقول المطلوبة يجب ملؤها', life: 3000 });
        return;
    }

    loading.value = true;
    const formData = new FormData();
    formData.append('donor_id', item.value.donor_id);
    formData.append('patient_case_id', item.value.patient_case_id);
    formData.append('amount', item.value.amount);
    formData.append('status', item.value.status);
    if (imageFile.value) {
        formData.append('image', imageFile.value);
        formData.append('demo[]', imageFile.value); // Fallback for backend
        console.log('Appending image:', imageFile.value); // Debugging
    }

    // Log FormData contents
    for (let [key, value] of formData.entries()) {
        console.log(`FormData ${key}:`, value);
    }

    try {
        const res = await request.post('patient-case-donations', formData);
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم إنشاء التبرع', life: 3000 });
            get();
            item.value = {};
            imageFile.value = null;
            item.value.previewImage = null;
            hideDialog();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في إنشاء التبرع', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في إنشاء التبرع', life: 3000 });
    } finally {
        loading.value = false;
    }
}

async function edit() {
    submitted.value = true;
    if (!item.value.donor_id || !item.value.patient_case_id || !item.value.amount || !item.value.status) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'جميع الحقول المطلوبة يجب ملؤها', life: 3000 });
        return;
    }

    loading.value = true;
    const formData = new FormData();
    formData.append('donor_id', item.value.donor_id);
    formData.append('patient_case_id', item.value.patient_case_id);
    formData.append('amount', item.value.amount);
    formData.append('status', item.value.status);
    if (imageFile.value) {
        formData.append('image', imageFile.value);
        formData.append('demo[]', imageFile.value); // Fallback for backend
        console.log('Appending image:', imageFile.value); // Debugging
    }

    // Log FormData contents
    for (let [key, value] of formData.entries()) {
        console.log(`FormData ${key}:`, value);
    }

    try {
        const res = await request.put(`patient-case-donations/${item.value.id}`, formData);
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم تحديث التبرع', life: 3000 });
            get();
            item.value = {};
            imageFile.value = null;
            item.value.previewImage = null;
            hideEditDialog();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في تحديث التبرع', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في تحديث التبرع', life: 3000 });
    } finally {
        loading.value = false;
    }
}

function editItem(donation) {
    item.value = { ...donation };
    imageFile.value = null;
    item.value.previewImage = null;
    editItemDialog.value = true;
}

function confirmDeleteItem(donation) {
    item.value = donation;
    deleteItemDialog.value = true;
}

async function deleteItem() {
    loading.value = true;
    try {
        const res = await request.delete(`patient-case-donations/${item.value?.id}`);
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف التبرع', life: 3000 });
            get();
            deleteItemDialog.value = false;
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في حذف التبرع', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في حذف التبرع', life: 3000 });
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
        const res = await request.delete('patient-case-donations/bulk', { ids: items });
        if (res.status) {
            selectedItems.value = null;
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف التبرعات', life: 3000 });
            deleteItemsDialog.value = false;
            get();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.message || 'فشل في حذف التبرعات', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.message || 'فشل في حذف التبرعات', life: 3000 });
    } finally {
        loading.value = false;
    }
}

function removeImage() {
    item.value.image_url = null;
    imageFile.value = null;
    item.value.previewImage = null;
}
</script>

<template>
    <div class="card" style="direction: rtl; text-align: right">
        <Toolbar class="mb-6">
            <!-- <template #start>
                <Button label="جديد" icon="pi pi-plus" severity="primary" class="ml-2" @click="openNew" :loading="loading" />
                <Button label="حذف" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="loading || !selectedItems || !selectedItems.length" />
            </template> -->
            <template #start>
                <Button label="تصدير" icon="pi pi-upload" severity="primary" @click="exportCSV" :loading="loading" />
            </template>
        </Toolbar>

        <DataTable paginatorPosition="both" ref="dt" v-model:selection="selectedItems" :value="items" dataKey="id" :rows="options.limit" :filters="filters" :totalRecords="total" :loading="loading">
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <h4 class="m-0">إدارة التبرعات لحالات التبرع</h4>
                    <IconField>
                        <InputIcon class="pi pi-search" />
                        <InputText v-model="options.search" @change="search" placeholder="بحث..." />
                    </IconField>
                </div>
            </template>

            <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
            <Column field="id" header="المعرف" sortable style="min-width: 8rem"></Column>
            <Column field="donation_id" header="معرف التبرع" sortable style="min-width: 12rem"> </Column>
            <Column field="patient_case.patient.name" header="اسم الحالة" sortable style="min-width: 12rem">
                <template #body="slotProps">
                    {{ slotProps?.data?.case && slotProps?.data?.case?.title ? slotProps?.data?.case?.title : '-' }}
                </template>
            </Column>
            <Column field="amount" header="المبلغ" sortable style="min-width: 10rem"></Column>
            <Column field="qty" header="الكمية" sortable style="min-width: 10rem"></Column>
            <Column field="total" header="الاجمالي" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    {{ parseFloat(slotProps?.data.qty) * parseFloat(slotProps?.data.amount) || 0 }}
                </template>
            </Column>
            <Column field="status" header="الحالة" sortable style="min-width: 10rem">
                <template #body="slotProps">
                    {{ slotProps.data?.donation?.status || 'فشل' }}
                </template>
            </Column>
            <Column field="image_url" header="الصورة" style="min-width: 10rem">
                <template #body="slotProps">
                    <img v-if="slotProps?.data?.case?.image_url" :src="$imageService.getImageUrl(slotProps?.data?.case?.image_url)" alt="Donation Image" style="width: 50px; height: auto" />
                    <span v-else>-</span>
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
            currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} تبرعات"
        ></Paginator>
    </div>

    <Dialog v-model:visible="itemDialog" :style="{ width: '600px' }" header="تبرع جديد لحالة مريض" :modal="true" style="direction: rtl; text-align: right">
        <div class="flex flex-col gap-6">
            <div>
                <label for="donor_id" class="block font-bold mb-2">المتبرع</label>
                <Dropdown id="donor_id" v-model="item.donor_id" :options="donors" optionLabel="name" optionValue="id" placeholder="اختر متبرع" :invalid="submitted && !item.donor_id" class="w-full" />
                <small v-if="submitted && !item.donor_id" class="text-red-500">المتبرع مطلوب.</small>
            </div>
            <div>
                <label for="patient_case_id" class="block font-bold mb-2">حالة المريض</label>
                <Dropdown id="patient_case_id" v-model="item.patient_case_id" :options="patientCases" optionLabel="patient.name" optionValue="id" placeholder="اختر حالة مريض" :invalid="submitted && !item.patient_case_id" class="w-full" />
                <small v-if="submitted && !item.patient_case_id" class="text-red-500">حالة المريض مطلوبة.</small>
            </div>
            <div>
                <label for="amount" class="block font-bold mb-2">المبلغ</label>
                <InputNumber id="amount" v-model="item.amount" :min="0" :invalid="submitted && !item.amount" class="w-full" />
                <small v-if="submitted && !item.amount" class="text-red-500">المبلغ مطلوب.</small>
            </div>
            <div>
                <label for="status" class="block font-bold mb-2">الحالة</label>
                <Dropdown id="status" v-model="item.status" :options="statuses" optionLabel="name" optionValue="value" placeholder="اختر حالة" :invalid="submitted && !item.status" class="w-full" />
                <small v-if="submitted && !item.status" class="text-red-500">الحالة مطلوبة.</small>
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
        </div>
        <template #footer>
            <Button label="إلغاء" icon="pi pi-times" text @click="hideDialog" :loading="loading" />
            <Button label="حفظ" icon="pi pi-check" @click="saveItem" :loading="loading" />
        </template>
    </Dialog>

    <Dialog v-model:visible="editItemDialog" :style="{ width: '600px' }" header="تعديل التبرع" :modal="true" style="direction: rtl; text-align: right">
        <div class="flex flex-col gap-6">
            <div>
                <label for="donor_id" class="block font-bold mb-2">المتبرع</label>
                <Dropdown id="donor_id" v-model="item.donor_id" :options="donors" optionLabel="name" optionValue="id" placeholder="اختر متبرع" :invalid="submitted && !item.donor_id" class="w-full" />
                <small v-if="submitted && !item.donor_id" class="text-red-500">المتبرع مطلوب.</small>
            </div>
            <div>
                <label for="patient_case_id" class="block font-bold mb-2">حالة المريض</label>
                <Dropdown id="patient_case_id" v-model="item.patient_case_id" :options="patientCases" optionLabel="patient.name" optionValue="id" placeholder="اختر حالة مريض" :invalid="submitted && !item.patient_case_id" class="w-full" />
                <small v-if="submitted && !item.patient_case_id" class="text-red-500">حالة المريض مطلوبة.</small>
            </div>
            <div>
                <label for="amount" class="block font-bold mb-2">المبلغ</label>
                <InputNumber id="amount" v-model="item.amount" :min="0" :invalid="submitted && !item.amount" class="w-full" />
                <small v-if="submitted && !item.amount" class="text-red-500">المبلغ مطلوب.</small>
            </div>
            <div>
                <label for="status" class="block font-bold mb-2">الحالة</label>
                <Dropdown id="status" v-model="item.status" :options="statuses" optionLabel="name" optionValue="value" placeholder="اختر حالة" :invalid="submitted && !item.status" class="w-full" />
                <small v-if="submitted && !item.status" class="text-red-500">الحالة مطلوبة.</small>
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
        </div>
        ![]()
        <template #footer>
            <Button label="إلغاء" icon="pi pi-times" text @click="hideEditDialog" :loading="loading" />
            <Button label="حفظ" icon="pi pi-check" @click="edit" :loading="loading" />
        </template>
    </Dialog>

    <Dialog v-model:visible="deleteItemDialog" :style="{ width: '450px' }" header="تأكيد الحذف" :modal="true" style="direction: rtl; text-align: right">
        <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle !text-3xl" />
            <span v-if="item">هل أنت متأكد من حذف التبرع؟</span>
        </div>
        <template #footer>
            <Button label="لا" icon="pi pi-times" text @click="deleteItemDialog = false" :loading="loading" />
            <Button label="نعم" icon="pi pi-check" @click="deleteItem" :loading="loading" />
        </template>
    </Dialog>

    <Dialog v-model:visible="deleteItemsDialog" :style="{ width: '450px' }" header="تأكيد الحذف" :modal="true" style="direction: rtl; text-align: right">
        <div class="flex items-center gap-4">
            <i class="pi pi-exclamation-triangle !text-3xl" />
            <span>هل أنت متأكد من حذف التبرعات المحددة؟</span>
        </div>
        <template #footer>
            <Button label="لا" icon="pi pi-times" text @click="deleteItemsDialog = false" :loading="loading" />
            <Button label="نعم" icon="pi pi-check" text @click="deleteSelectedItems" :loading="loading" />
        </template>
    </Dialog>
</template>
