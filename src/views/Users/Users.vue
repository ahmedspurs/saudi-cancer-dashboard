<script setup>
import request from '@/service/Request';
import { FilterMatchMode } from '@primevue/core/api';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Paginator from 'primevue/paginator';
import Password from 'primevue/password';
import Toolbar from 'primevue/toolbar';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();
const dt = ref();
const items = ref([]);
const editItemDialog = ref(false);
const editPasswordDialog = ref(false);
const deleteItemDialog = ref(false);
const total = ref(0);
const deleteItemsDialog = ref(false);
const item = ref({});
const roles = ref([]);
const options = ref({
    page: 1,
    limit: 10,
    col: 'name',
    search: '',
    role_id: null
});
const selectedItems = ref();
const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const submitted = ref(false);
const tableLoading = ref(false); // Added for table loading state
const buttonLoading = ref(false); // Added for button loading state

onMounted(() => {
    get();
    getRoles();
});

const search = async () => {
    tableLoading.value = true; // Start table loading
    try {
        const res = await request.post('users/search', options.value);
        if (res.status) {
            items.value = res.data;
            total.value = res.tot;
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.msg || 'فشل في البحث', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'حدث خطأ أثناء البحث', life: 3000 });
    } finally {
        tableLoading.value = false; // End table loading
    }
};

const get = async (e) => {
    tableLoading.value = true; // Start table loading
    try {
        if (e) {
            options.value.page = e.page + 1;
            options.value.limit = e.rows;
        }
        const res = await request.post('users/paginate', options.value);
        if (res.status) {
            items.value = res.data;
            total.value = res.tot;
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.msg || 'فشل في جلب البيانات', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'حدث خطأ أثناء جلب البيانات', life: 3000 });
    } finally {
        tableLoading.value = false; // End table loading
    }
};

const getRoles = async () => {
    try {
        const res = await request.get('roles');
        if (res.status) {
            roles.value = res.data.map((role) => ({ label: role.name, value: role.id }));
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في جلب الأدوار', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'حدث خطأ أثناء جلب الأدوار', life: 3000 });
    }
};

function hideEditDialog() {
    editItemDialog.value = false;
    submitted.value = false;
    item.value = {};
}

function hidePasswordDialog() {
    editPasswordDialog.value = false;
    submitted.value = false;
    item.value = { id: '', password: '', rePassword: '' };
}

function editItem(prod) {
    item.value = {
        id: prod.id,
        name: prod.name,
        email: prod.email,
        phone: prod.phone || '',
        role_id: prod.user_roles?.[0]?.role?.id || ''
    };
    editItemDialog.value = true;
}

async function updateItem() {
    submitted.value = true;
    buttonLoading.value = true; // Start button loading

    // Validation for provided fields
    if (item.value.name && !item.value.name.trim()) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'الاسم مطلوب', life: 3000 });
        buttonLoading.value = false;
        return;
    }
    if (item.value.email && !item.value.email.trim()) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'البريد الإلكتروني مطلوب', life: 3000 });
        buttonLoading.value = false;
        return;
    }
    if (item.value.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(item.value.email)) {
            toast.add({ severity: 'error', summary: 'خطأ', detail: 'صيغة البريد الإلكتروني غير صحيحة', life: 3000 });
            buttonLoading.value = false;
            return;
        }
    }

    if (item.value.phone && item.value.phone.length < 9) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'رقم الهاتف يجب أن يكون 9 أرقام على الأقل', life: 3000 });
        buttonLoading.value = false;
        return;
    }

    // Prepare form data (only include provided fields)
    const formData = new FormData();
    if (item.value.name) formData.append('name', item.value.name);
    if (item.value.email) formData.append('email', item.value.email);
    if (item.value.phone) formData.append('phone', item.value.phone);
    if (item.value.role_id) formData.append('role_id', item.value.role_id);

    try {
        const res = await request.post(`users/edit-user-admin/${item.value.id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: res.data.msg, life: 3000 });
            hideEditDialog();
            get();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.data.msg || 'فشل في تحديث المستخدم', life: 3000 });
        }
    } catch (error) {
        console.error('Update error:', error);
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.response?.data?.msg || 'حدث خطأ ما', life: 3000 });
    } finally {
        buttonLoading.value = false; // End button loading
        submitted.value = false;
    }
}

function editPassword(prod) {
    item.value = { id: prod.id, password: '', rePassword: '' };
    editPasswordDialog.value = true;
}

async function updatePassword() {
    submitted.value = true;
    buttonLoading.value = true; // Start button loading

    if (!item.value.password || !item.value.rePassword || item.value.password.length < 6 || item.value.password !== item.value.rePassword) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل وتتطابق مع إعادة كلمة المرور', life: 3000 });
        buttonLoading.value = false;
        return;
    }

    const formData = new FormData();
    formData.append('password', item.value.password);

    try {
        const res = await request.post(`users/${item.value.id}/password`, formData);
        if (res.status) {
            hidePasswordDialog();
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم تحديث كلمة المرور', life: 3000 });
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.error || 'فشل في تحديث كلمة المرور', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'حدث خطأ أثناء تحديث كلمة المرور', life: 3000 });
    } finally {
        buttonLoading.value = false; // End button loading
        submitted.value = false;
    }
}

function confirmDeleteItem(prod) {
    item.value = prod;
    deleteItemDialog.value = true;
}

async function deleteItem() {
    try {
        const res = await request.delete(`users/${item.value.id}`);
        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف المستخدم', life: 3000 });
            get();
            deleteItemDialog.value = false;
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في حذف المستخدم', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'حدث خطأ أثناء حذف المستخدم', life: 3000 });
    } finally {
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
        const res = await request.delete('users', items);
        if (res.status) {
            selectedItems.value = null;
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف العناصر المحددة', life: 3000 });
            deleteItemsDialog.value = false;
            get();
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في حذف العناصر', life: 3000 });
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'حدث خطأ أثناء حذف العناصر', life: 3000 });
    } finally {
        deleteItemsDialog.value = false;
    }
}
</script>

<template>
    <div dir="rtl">
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="جديد" icon="pi pi-plus" severity="secondary" class="mr-2" disabled />
                    <Button label="حذف" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedItems || !selectedItems.length" />
                </template>

                <template #end>
                    <Button label="تصدير" icon="pi pi-upload" severity="secondary" @click="exportCSV($event)" />
                </template>
            </Toolbar>

            <DataTable paginatorPosition="both" ref="dt" v-model:selection="selectedItems" :value="items" dataKey="id" :rows="options.limit" :filters="filters" :totalRecords="total" :loading="tableLoading">
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">إدارة المستخدمين</h4>
                        <div class="flex gap-2">
                            <IconField>
                                <InputIcon>
                                    <i class="pi pi-search" />
                                </InputIcon>
                                <InputText v-model="options.search" @change="search" placeholder="بحث..." />
                            </IconField>
                            <Dropdown v-model="options.role_id" :options="roles" optionLabel="label" optionValue="value" placeholder="تصفية حسب الدور" @change="search" class="w-full md:w-40" />
                        </div>
                    </div>
                </template>

                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
                <Column field="id" header="المعرف" sortable style="min-width: 12rem"></Column>
                <Column field="name" header="الاسم" sortable style="min-width: 16rem"></Column>
                <Column field="email" header="البريد الإلكتروني" sortable style="min-width: 10rem"></Column>
                <Column field="phone" header="رقم الهاتف" sortable style="min-width: 10rem"></Column>
                <Column field="user_roles" header="الأدوار" sortable style="min-width: 8rem">
                    <template #body="slotProps">
                        {{ slotProps?.data?.user_roles.map((role) => role?.role?.name).join(', ') || 'غير محدد' }}
                    </template>
                </Column>
                <Column :exportable="false" style="min-width: 12rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editItem(slotProps.data)" />
                        <Button icon="pi pi-key" outlined rounded class="mr-2" @click="editPassword(slotProps.data)" />
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
                currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} عناصر"
            ></Paginator>
        </div>

        <Dialog v-model:visible="editItemDialog" :style="{ width: '450px' }" header="تعديل المستخدم" :modal="true">
            <div class="flex flex-col gap-6">
                <!-- Name -->
                <div>
                    <label for="name" class="block font-bold mb-2">الاسم</label>
                    <InputText id="name" v-model.trim="item.name" autofocus :invalid="submitted && item.name && !item.name.trim()" class="w-full" />
                    <small v-if="submitted && item.name && !item.name.trim()" class="text-red-500">الاسم مطلوب.</small>
                    <small class="text-gray-500">اختياري</small>
                </div>

                <!-- Email -->
                <div>
                    <label for="email" class="block font-bold mb-2">البريد الإلكتروني</label>
                    <InputText id="email" v-model.trim="item.email" type="email" :invalid="submitted && item.email && !item.email.trim()" class="w-full" />
                    <small v-if="submitted && item.email && !item.email.trim()" class="text-red-500">البريد الإلكتروني مطلوب.</small>
                    <small class="text-gray-500">اختياري</small>
                </div>

                <!-- Password -->
                <div>
                    <label for="password" class="block font-bold mb-2">كلمة المرور</label>
                    <Password id="password" v-model="item.password" toggleMask :feedback="false" :invalid="submitted && item.password && item.password.length < 6" class="w-full" />
                    <small v-if="submitted && item.password && item.password.length < 6" class="text-red-500">كلمة المرور يجب أن تكون 6 أحرف على الأقل.</small>
                    <small class="text-gray-500">اختياري</small>
                </div>

                <!-- Phone -->
                <div>
                    <label for="phone" class="block font-bold mb-2">رقم الهاتف</label>
                    <InputText id="phone" v-model="item.phone" :invalid="submitted && item.phone && item.phone.length < 9" class="w-full" />
                    <small v-if="submitted && item.phone && item.phone.length < 9" class="text-red-500">رقم الهاتف يجب أن يكون 9 أرقام على الأقل.</small>
                    <small class="text-gray-500">اختياري</small>
                </div>

                <!-- Roles -->
                <div>
                    <label for="role_id" class="block font-bold mb-2">الدور</label>
                    <Dropdown id="role_id" v-model="item.role_id" :options="roles" option-label="label" option-value="value" placeholder="اختر الدور" class="w-full" :invalid="submitted && item.role_id && !item.role_id" />
                    <small v-if="submitted && item.role_id && !item.role_id" class="text-red-500">يجب اختيار دور واحد على الأقل.</small>
                    <small class="text-gray-500">اختياري</small>
                </div>
            </div>

            <template #footer>
                <Button label="إلغاء" icon="pi pi-times" text @click="hideEditDialog" :disabled="buttonLoading" />
                <Button label="حفظ التغييرات" icon="pi pi-check" @click="updateItem" :loading="buttonLoading" />
            </template>
        </Dialog>

        <Dialog v-model:visible="editPasswordDialog" :style="{ width: '450px' }" header="تعديل كلمة المرور" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="password" class="block font-bold mb-2">كلمة المرور الجديدة</label>
                    <Password id="password" v-model="item.password" toggleMask :feedback="false" required :invalid="submitted && !item.password" class="w-full" />
                    <small v-if="submitted && !item.password" class="text-red-500">كلمة المرور مطلوبة.</small>
                </div>
                <div>
                    <label for="rePassword" class="block font-bold mb-2">إعادة كلمة المرور</label>
                    <Password id="rePassword" v-model="item.rePassword" toggleMask :feedback="false" required :invalid="submitted && !item.rePassword" class="w-full" />
                    <small v-if="submitted && item.rePassword && item.password !== item.rePassword" class="text-red-500">كلمتا المرور غير متطابقتين.</small>
                </div>
            </div>

            <template #footer>
                <Button label="إلغاء" icon="pi pi-times" text @click="hidePasswordDialog" :disabled="buttonLoading" />
                <Button label="حفظ" icon="pi pi-check" @click="updatePassword" :loading="buttonLoading" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteItemDialog" :style="{ width: '450px' }" header="تأكيد" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="item">
                    هل أنت متأكد أنك تريد حذف <b>{{ item.name }}</b
                    >؟
                </span>
            </div>
            <template #footer>
                <Button label="لا" icon="pi pi-times" text @click="deleteItemDialog = false" />
                <Button label="نعم" icon="pi pi-check" @click="deleteItem" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteItemsDialog" :style="{ width: '450px' }" header="تأكيد" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span>هل أنت متأكد أنك تريد حذف العناصر المحددة؟</span>
            </div>
            <template #footer>
                <Button label="لا" icon="pi pi-times" text @click="deleteItemsDialog = false" />
                <Button label="نعم" icon="pi pi-check" text @click="deleteSelectedItems" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.card {
    background-color: #ffffff;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
}
.p-inputtext,
.p-password,
.p-dropdown {
    width: 100%;
}
.p-dropdown .p-overlay {
    z-index: 1000 !important;
}
.text-red-500 {
    color: #ef4444;
}
.text-gray-500 {
    color: #6b7280;
}
</style>
