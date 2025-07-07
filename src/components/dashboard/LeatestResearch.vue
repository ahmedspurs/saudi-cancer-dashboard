<script setup>
import request from '@/service/Request';
import { onMounted, ref } from 'vue';

const research = ref([]);

const getresearch = async () => {
    const response = await request.get('base/leatest-research');
    research.value = response.data;
};
onMounted(() => {
    getresearch();
});
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Leatest Research Upload</div>
        <DataTable :value="research" :rows="5" :paginator="true" responsiveLayout="scroll">
            <Column header="ID" field="id"> </Column>
            <Column header="Title" field="name"> </Column>
            <Column field="cateogry" header="Category" :sortable="true">
                <template #body="slotProps">
                    {{ slotProps.data?.category?.name }}
                </template>
            </Column>
        </DataTable>
    </div>
</template>
