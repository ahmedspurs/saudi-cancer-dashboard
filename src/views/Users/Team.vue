<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import request from '@/service/Request';
onMounted(() => {
    get();
    getRoles();
});

const toast = useToast();
const dt = ref();
const items = ref([]);
const itemDialog = ref(false);
const editItemDialog = ref(false);
const deleteItemDialog = ref(false);
const total = ref(0);
const deleteItemsDialog = ref(false);
const data = ref({});
const item = ref({});
const selectedImageFile = ref(null);
const imagePreview = ref(null);
const imageUploader = ref(null);
const roles = ref([]);
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
function onSelectImage(event) {
    const file = event.files[0];
    selectedImageFile.value = file;
    imagePreview.value = URL.createObjectURL(file);
}
const search = async () => {
    const res = await request.post('team/search', options.value);
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
    const res = await request.post('team/paginate', options.value);
    if (res.status) {
        items.value = res.data;
        total.value = res.tot;
    }
};
const getRoles = async () => {
    const res = await request.get('user-roles');
    if (res.status) {
        roles.value = res.data;
    }
};
const submitted = ref(false);

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
    const formData = new FormData();
    for (var key in item.value) {
        formData.append(key, item.value[key]);
    }
    if (selectedImageFile.value) {
        formData.append('image', selectedImageFile.value);
    }
    const res = await request.post('team', formData);
    if (res.status) {
        get();
        item.value = {};
        selectedImageFile.value = null;
        hideDialog();
    }
}

async function Edit() {
    submitted.value = true;
    const formData = new FormData();
    for (var key in item.value) {
        if (key == 'image') {
            if (selectedImageFile.value) {
                formData.append('image', selectedImageFile.value);
            } else {
                formData.append(key, item.value[key]);
            }
        } else {
            formData.append(key, item.value[key]);
        }
    }

    const res = await request.put(`team/${item.value.id}`, formData);
    if (res.status) {
        get();
        item.value = {};
        selectedImageFile.value = null;
        hideEditDialog();
    }
}

function editItem(prod) {
    item.value = { ...prod };
    editItemDialog.value = true;
}

function confirmDeleteItem(prod) {
    item.value = prod;
    deleteItemDialog.value = true;
}

async function deleteItem() {
    const res = await request.delete(`team/${item.value.id}`);
    if (res.status) {
        toast.add({ severity: 'success', summary: 'Successful', detail: 'Item Deleted', life: 3000 });
        get();
        deleteItemDialog.value = false;

        return;
    }
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete item', life: 3000 });
    deleteItemDialog.value = false;
}

function exportCSV() {
    dt.value.exportCSV();
}

function confirmDeleteSelected() {
    deleteItemsDialog.value = true;
}

async function deleteSelectedItems() {
    console.log({ select: selectedItems.value });
    const items = selectedItems.value.map((item) => item.id);
    try {
        const res = await request.delete('base/team', items);
        if (res.status) {
            selectedItems.value = null;
            toast.add({ severity: 'success', summary: 'Successful', detail: 'Items Deleted', life: 3000 });
            deleteItemsDialog.value = true;
            get();
            return;
        }
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete items', life: 3000 });
    }
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete items', life: 3000 });
}
</script>

<template>
    <div>
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="New" icon="pi pi-plus" severity="secondary" class="mr-2" @click="openNew" />
                    <Button label="Delete" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedItems || !selectedItems.length" />
                </template>

                <template #end>
                    <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportCSV($event)" />
                </template>
            </Toolbar>

            <DataTable ref="dt" v-model:selection="selectedItems" :value="items" dataKey="id" :rows="options.limit" :filters="filters" :totalRecords="total">
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Manage Users</h4>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="options.search" @change="search" placeholder="Search..." />
                        </IconField>
                    </div>
                </template>

                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
                <Column field="id" header="ID" sortable style="min-width: 12rem"></Column>
                <Column field="name" header="Name" sortable style="min-width: 16rem"></Column>

                <Column field="email" header="Email" sortable style="min-width: 10rem"></Column>
                <Column field="phone" header="Phone" sortable style="min-width: 10rem"></Column>
                <Column field="role" header="Role" sortable style="min-width: 8rem">
                    <template #body="slotProps">
                        {{ slotProps?.data?.role?.name_en }}
                    </template>
                </Column>
                <Column :exportable="false" style="min-width: 12rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" outlined rounded class="mr-2" @click="editItem(slotProps.data)" />
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
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} items"
            ></Paginator>
        </div>

        <Dialog v-model:visible="itemDialog" :style="{ width: '450px' }" header="User Details" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="name" class="block font-bold mb-2">Name</label>
                    <InputText id="name" v-model.trim="item.name" required autofocus :invalid="submitted && !item.name" class="w-full" />
                    <small v-if="submitted && !item.name" class="text-red-500">Name is required.</small>
                </div>

                <div>
                    <label for="name_en" class="block font-bold mb-2">Name(en)</label>
                    <InputText id="name_en" v-model.trim="item.name_en" required autofocus :invalid="submitted && !item.name_en" class="w-full" />
                    <small v-if="submitted && !item.name_en" class="text-red-500">Name is required.</small>
                </div>

                <div>
                    <label for="bio" class="block font-bold mb-2">Bio</label>
                    <InputText id="bio" v-model.trim="item.bio" required autofocus :invalid="submitted && !item.bio" class="w-full" />
                    <small v-if="submitted && !item.bio" class="text-red-500">Name is required.</small>
                </div>

                <div>
                    <label for="university" class="block font-bold mb-2">University</label>
                    <InputText id="university" v-model.trim="item.university" required autofocus :invalid="submitted && !item.university" class="w-full" />
                    <small v-if="submitted && !item.university" class="text-red-500">Name is required.</small>
                </div>
                <div>
                    <label class="block font-bold mb-2">Image</label>
                    <FileUpload ref="imageUploader" name="image" accept="image/*" :maxFileSize="1000000" chooseLabel="Browse" customUpload :auto="false" @select="onSelectImage">
                        <template #empty>
                            <span>Drag and drop an image here or click to browse.</span>
                        </template>
                    </FileUpload>
                </div>
                <div>
                    <label for="linkedin_link" class="block font-bold mb-2">Linkedin</label>
                    <InputText id="linkedin_link" v-model.trim="item.linkedin_link" required autofocus :invalid="submitted && !item.linkedin_link" class="w-full" />
                    <small v-if="submitted && !item.linkedin_link" class="text-red-500">Name is required.</small>
                </div>

                <div>
                    <label for="twitter_link" class="block font-bold mb-2">Twitter(X)</label>
                    <InputText id="twitter_link" v-model.trim="item.twitter_link" required autofocus :invalid="submitted && !item.twitter_link" class="w-full" />
                    <small v-if="submitted && !item.twitter_link" class="text-red-500">Name is required.</small>
                </div>

                <div>
                    <label for="facebook_link" class="block font-bold mb-2">Facebook</label>
                    <InputText id="facebook_link" v-model.trim="item.facebook_link" required autofocus :invalid="submitted && !item.facebook_link" class="w-full" />
                    <small v-if="submitted && !item.facebook_link" class="text-red-500">Name is required.</small>
                </div>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Save" icon="pi pi-check" @click="saveItem" />
            </template>
        </Dialog>
        <Dialog v-model:visible="editItemDialog" :style="{ width: '450px' }" header="Edit User" :modal="true">
            <div class="flex flex-col gap-6">
                <div>
                    <label for="name" class="block font-bold mb-2">Name</label>
                    <InputText id="name" v-model.trim="item.name" required autofocus :invalid="submitted && !item.name" class="w-full" />
                    <small v-if="submitted && !item.name" class="text-red-500">Name is required.</small>
                </div>

                <div>
                    <label for="name_en" class="block font-bold mb-2">Name(en)</label>
                    <InputText id="name_en" v-model.trim="item.name_en" required autofocus :invalid="submitted && !item.name_en" class="w-full" />
                    <small v-if="submitted && !item.name_en" class="text-red-500">Name is required.</small>
                </div>

                <div>
                    <label for="bio" class="block font-bold mb-2">Bio</label>
                    <InputText id="bio" v-model.trim="item.bio" required autofocus :invalid="submitted && !item.bio" class="w-full" />
                    <small v-if="submitted && !item.bio" class="text-red-500">Name is required.</small>
                </div>

                <div>
                    <label for="university" class="block font-bold mb-2">University</label>
                    <InputText id="university" v-model.trim="item.university" required autofocus :invalid="submitted && !item.university" class="w-full" />
                    <small v-if="submitted && !item.university" class="text-red-500">Name is required.</small>
                </div>
                <div>
                    <label class="block font-bold mb-2">Image</label>
                    <FileUpload ref="imageUploader" name="image" accept="image/*" :maxFileSize="1000000" chooseLabel="Browse" customUpload :auto="false" @select="onSelectImage">
                        <template #empty>
                            <span>Drag and drop an image here or click to browse.</span>
                        </template>
                    </FileUpload>
                </div>
                <div>
                    <label for="linkedin_link" class="block font-bold mb-2">Linkedin</label>
                    <InputText id="linkedin_link" v-model.trim="item.linkedin_link" required autofocus :invalid="submitted && !item.linkedin_link" class="w-full" />
                    <small v-if="submitted && !item.linkedin_link" class="text-red-500">Name is required.</small>
                </div>

                <div>
                    <label for="twitter_link" class="block font-bold mb-2">Twitter(X)</label>
                    <InputText id="twitter_link" v-model.trim="item.twitter_link" required autofocus :invalid="submitted && !item.twitter_link" class="w-full" />
                    <small v-if="submitted && !item.twitter_link" class="text-red-500">Name is required.</small>
                </div>

                <div>
                    <label for="facebook_link" class="block font-bold mb-2">Facebook</label>
                    <InputText id="facebook_link" v-model.trim="item.facebook_link" required autofocus :invalid="submitted && !item.facebook_link" class="w-full" />
                    <small v-if="submitted && !item.facebook_link" class="text-red-500">Name is required.</small>
                </div>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" text @click="hideDialog" />
                <Button label="Save" icon="pi pi-check" @click="Edit" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteItemDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="item"
                    >Are you sure you want to delete <b>{{ item.name }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteItemDialog = false" />
                <Button label="Yes" icon="pi pi-check" @click="deleteItem" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteItemsDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="item">Are you sure you want to delete the selected items?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteItemsDialog = false" />
                <Button label="Yes" icon="pi pi-check" text @click="deleteSelectedItems" />
            </template>
        </Dialog>
    </div>
</template>
