<script setup>
import request from '@/service/Request';
import { onMounted, ref } from 'vue';

const conferences = ref([]);

const getConferences = async () => {
    const response = await request.get('base/leatest-conferences');
    conferences.value = response.data;
};
onMounted(() => {
    getConferences();
});
</script>

<template>
    <div class="card">
        <div class="font-semibold text-xl mb-4">Leatest Conferences</div>
        <DataTable :value="conferences" :rows="5" :paginator="true" responsiveLayout="scroll">
            <Column header="ID" field="id"> </Column>
            <Column header="Title" field="title"> </Column>
            <Column field="start_date" header="Start Date" :sortable="true">
                <template #body="slotProps">
                    {{ slotProps.data.start_date?.split('T')[0] }}
                </template>
            </Column>
        </DataTable>
    </div>
</template>
