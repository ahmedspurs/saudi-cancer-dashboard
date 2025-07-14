<script setup>
import request from '@/service/Request';
import { saveAs } from 'file-saver';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Chart from 'primevue/chart';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dropdown from 'primevue/dropdown';
import { onMounted, ref, watch } from 'vue';

// Filter states
const dateRange = ref([null, null]);
const timeFilter = ref('30_days');
const timeFilterOptions = ref([
    { label: 'آخر 7 أيام', value: '7_days' },
    { label: 'آخر 30 يومًا', value: '30_days' },
    { label: 'آخر 90 يومًا', value: '90_days' },
    { label: 'مخصص', value: 'custom' }
]);
const statusFilter = ref(null);
const statusOptions = ref([
    { label: 'الكل', value: null },
    { label: 'مفتوح', value: 'open' },
    { label: 'مكتمل', value: 'completed' }
]);
const progressFilter = ref(null);
const progressOptions = ref([
    { label: 'الكل', value: null },
    { label: '0-25%', value: '0-25' },
    { label: '26-50%', value: '26-50' },
    { label: '51-75%', value: '51-75' },
    { label: '76-100%', value: '76-100' }
]);

// Table data
const cases = ref([]);

// Chart data
const pieChartData = ref({
    labels: ['مفتوح', 'مكتمل'],
    datasets: [
        {
            data: [0, 0],
            backgroundColor: ['#42A5F5', '#EF5350']
        }
    ]
});
const lineChartData = ref({
    labels: [],
    datasets: [
        {
            label: 'عدد الحالات الجديدة',
            borderColor: '#66BB6A',
            data: [],
            fill: false
        }
    ]
});

const chartOptions = ref({
    maintainAspectRatio: false,
    aspectRatio: 0.8,
    plugins: { legend: { labels: { color: '#495057' } } },
    scales: {
        x: { ticks: { color: 'black' }, grid: { color: '#ebedef' } },
        y: { ticks: { color: '#495057' }, grid: { color: '#ebedef' } }
    }
});

// Loading and error states
const isLoading = ref(true);
const errorMessage = ref(null);

// Fetch report data
const fetchCasesData = async () => {
    isLoading.value = true;
    errorMessage.value = null;

    try {
        // Determine date range based on filter
        let startDate = null;
        let endDate = null;
        if (timeFilter.value !== 'custom') {
            const days = { '7_days': 7, '30_days': 30, '90_days': 90 }[timeFilter.value];
            endDate = new Date();
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - days);
        } else if (dateRange.value[0] && dateRange.value[1]) {
            startDate = dateRange.value[0];
            endDate = dateRange.value[1];
        }

        const params = {
            startDate: startDate ? startDate.toISOString().split('T')[0] : null,
            endDate: endDate ? endDate.toISOString().split('T')[0] : null,
            status: statusFilter.value,
            progress: progressFilter.value
        };

        // Fetch cases
        const casesResponse = await request.get('reports/cases', { params });
        cases.value = casesResponse.data;

        // Fetch cases by status (pie chart)
        const statusChartResponse = await request.get('reports/cases-by-status', { params });
        pieChartData.value.datasets[0].data = statusChartResponse.data;
        pieChartData.value = { ...pieChartData.value };

        // Fetch cases timeline (line chart)
        const timelineChartResponse = await request.get('reports/cases-timeline', { params });
        lineChartData.value.labels = timelineChartResponse.data.labels;
        lineChartData.value.datasets[0].data = timelineChartResponse.data.values;
        lineChartData.value = { ...lineChartData.value };
    } catch (error) {
        console.error('خطأ في جلب بيانات التقارير:', error);
        errorMessage.value = 'فشل في تحميل البيانات، يرجى المحاولة لاحقًا';
    } finally {
        isLoading.value = false;
    }
};

// Export to CSV
const exportToCSV = () => {
    const headers = ['المعرف', 'العنوان', 'التقدم', 'الحالة', 'التاريخ', 'إجمالي التبرعات'];
    const rows = cases.value.map((c) => [c.id, c.title, `${c.progress}%`, c.status === 'open' ? 'مفتوح' : 'مكتمل', c.createdAt.split('T')[0], c.total_donations || 0]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'cases_report.csv');
};

// Watch filter changes
watch([timeFilter, dateRange, statusFilter, progressFilter], () => {
    fetchCasesData();
});

onMounted(() => {
    fetchCasesData();
});
</script>

<template>
    <div class="grid grid-cols-12 gap-8" dir="rtl">
        <!-- Loading or error state -->
        <div v-if="isLoading" class="col-span-12 text-center">
            <p>جاري تحميل البيانات...</p>
        </div>
        <div v-else-if="errorMessage" class="col-span-12 text-center text-red-500">
            <p>{{ errorMessage }}</p>
        </div>
        <div v-else class="col-span-12">
            <!-- Filters -->
            <div class="card mb-8">
                <div class="flex flex-wrap gap-4">
                    <div>
                        <label class="block text-muted-color font-medium mb-2">الفترة الزمنية</label>
                        <Dropdown v-model="timeFilter" :options="timeFilterOptions" optionLabel="label" optionValue="value" class="w-48" />
                    </div>
                    <div v-if="timeFilter === 'custom'">
                        <label class="block text-muted-color font-medium mb-2">نطاق التاريخ</label>
                        <Calendar v-model="dateRange" selectionMode="range" :manualInput="true" class="w-64" />
                    </div>
                    <div>
                        <label class="block text-muted-color font-medium mb-2">حالة الحالة</label>
                        <Dropdown v-model="statusFilter" :options="statusOptions" optionLabel="label" optionValue="value" class="w-48" />
                    </div>
                    <div>
                        <label class="block text-muted-color font-medium mb-2">نطاق التقدم</label>
                        <Dropdown v-model="progressFilter" :options="progressOptions" optionLabel="label" optionValue="value" class="w-48" />
                    </div>
                    <div class="flex items-end">
                        <Button label="تصدير إلى CSV" icon="pi pi-download" @click="exportToCSV" :disabled="!cases.length" />
                    </div>
                </div>
            </div>

            <!-- Charts -->
            <div class="grid grid-cols-12 gap-8 mb-8">
                <div class="col-span-12 lg:col-span-6">
                    <div class="card">
                        <div class="font-semibold text-xl mb-4">توزيع الحالات حسب الحالة</div>
                        <Chart type="pie" :data="pieChartData" :options="chartOptions" class="h-80" />
                    </div>
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <div class="card">
                        <div class="font-semibold text-xl mb-4">اتجاهات الحالات الجديدة</div>
                        <Chart type="line" :data="lineChartData" :options="chartOptions" class="h-80" />
                    </div>
                </div>
            </div>

            <!-- Cases Table -->
            <div class="card">
                <div class="font-semibold text-xl mb-4">تقرير الحالات</div>
                <DataTable paginatorPosition="both" :value="cases" :rows="10" :paginator="true" responsiveLayout="scroll">
                    <Column header="المعرف" field="id"></Column>
                    <Column header="العنوان" field="title"></Column>
                    <Column header="التقدم" field="progress">
                        <template #body="slotProps"> {{ slotProps.data.progress }}% </template>
                    </Column>
                    <Column header="الحالة" field="status">
                        <template #body="slotProps"> {{ slotProps.data.status === 'open' ? 'مفتوح' : 'مكتمل' }} </template>
                    </Column>
                    <Column header="التاريخ" field="createdAt">
                        <template #body="slotProps"> {{ slotProps.data.createdAt.split('T')[0] }} </template>
                    </Column>
                    <Column header="إجمالي التبرعات" field="total_donations">
                        <template #body="slotProps"> {{ slotProps.data.total_donations || 0 }} ر.س </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>
</template>

<style scoped>
.card {
    background: #ffffff;
    padding: 1.5rem;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.text-muted-color {
    color: #6b7280;
}
</style>
