<script setup>
import { ref, onMounted, watch } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Chart from 'primevue/chart';
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import Button from 'primevue/button';
import request from '@/service/Request';
import { saveAs } from 'file-saver';

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
    { label: 'ناجحة', value: 'success' },
    { label: 'فاشلة', value: 'failed' },
    { label: 'معلقة', value: 'pending' }
]);
const amountFilter = ref(null);
const amountOptions = ref([
    { label: 'الكل', value: null },
    { label: '0-1000 ر.س', value: '0-1000' },
    { label: '1001-5000 ر.س', value: '1001-5000' },
    { label: '5001-10000 ر.س', value: '5001-10000' },
    { label: '>10000 ر.س', value: '10001-999999' }
]);

// Table data
const payments = ref([]);

// Chart data
const pieChartData = ref({
    labels: ['ناجحة', 'فاشلة', 'معلقة'],
    datasets: [
        {
            data: [0, 0, 0],
            backgroundColor: ['#42A5F5', '#EF5350', '#FFA726']
        }
    ]
});
const lineChartData = ref({
    labels: [],
    datasets: [
        {
            label: 'إجمالي المدفوعات',
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

// Fetch payment data
const fetchPaymentsData = async () => {
    isLoading.value = true;
    errorMessage.value = null;

    try {
        // Determine date range
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
            amount: amountFilter.value
        };

        // Fetch payments
        const paymentsResponse = await request.get('reports/payments', { params });
        payments.value = paymentsResponse.data;

        // Fetch payments by status (pie chart)
        const statusChartResponse = await request.get('reports/payments-by-status', { params });
        pieChartData.value.datasets[0].data = statusChartResponse.data;
        pieChartData.value = { ...pieChartData.value };

        // Fetch payments timeline (line chart)
        const timelineChartResponse = await request.get('reports/payments-timeline', { params });
        lineChartData.value.labels = timelineChartResponse.data.labels;
        lineChartData.value.datasets[0].data = timelineChartResponse.data.values;
        lineChartData.value = { ...lineChartData.value };
    } catch (error) {
        console.error('خطأ في جلب بيانات المدفوعات:', error);
        errorMessage.value = 'فشل في تحميل البيانات، يرجى المحاولة لاحقًا';
    } finally {
        isLoading.value = false;
    }
};

// Export to CSV
const exportToCSV = () => {
    const headers = ['المعرف', 'المبلغ', 'الحالة', 'التاريخ', 'عنوان الحالة'];
    const rows = payments.value.map((p) => [p.id, `${p.amount} ر.س`, p.payment_status === 'success' ? 'ناجحة' : p.payment_status === 'failed' ? 'فاشلة' : 'معلقة', p.createdAt.split('T')[0], p.case_title || 'غير مرتبط']);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'payments_report.csv');
};

// Watch filter changes
watch([timeFilter, dateRange, statusFilter, amountFilter], () => {
    fetchPaymentsData();
});

onMounted(() => {
    fetchPaymentsData();
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
                        <label class="block text-muted-color font-medium mb-2">حالة الدفع</label>
                        <Dropdown v-model="statusFilter" :options="statusOptions" optionLabel="label" optionValue="value" class="w-48" />
                    </div>
                    <div>
                        <label class="block text-muted-color font-medium mb-2">نطاق المبلغ</label>
                        <Dropdown v-model="amountFilter" :options="amountOptions" optionLabel="label" optionValue="value" class="w-48" />
                    </div>
                    <div class="flex items-end">
                        <Button label="تصدير إلى CSV" icon="pi pi-download" @click="exportToCSV" :disabled="!payments.length" />
                    </div>
                </div>
            </div>

            <!-- Charts -->
            <div class="grid grid-cols-12 gap-8 mb-8">
                <div class="col-span-12 lg:col-span-6">
                    <div class="card">
                        <div class="font-semibold text-xl mb-4">توزيع المدفوعات حسب الحالة</div>
                        <Chart type="pie" :data="pieChartData" :options="chartOptions" class="h-80" />
                    </div>
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <div class="card">
                        <div class="font-semibold text-xl mb-4">اتجاهات المدفوعات</div>
                        <Chart type="line" :data="lineChartData" :options="chartOptions" class="h-80" />
                    </div>
                </div>
            </div>

            <!-- Payments Table -->
            <div class="card">
                <div class="font-semibold text-xl mb-4">تقرير المدفوعات</div>
                <DataTable :value="payments" :rows="10" :paginator="true" responsiveLayout="scroll">
                    <Column header="المعرف" field="id"></Column>
                    <Column header="المبلغ" field="amount">
                        <template #body="slotProps"> {{ slotProps.data.amount }} ر.س </template>
                    </Column>
                    <Column header="الحالة" field="payment_status">
                        <template #body="slotProps">
                            {{ slotProps.data.payment_status === 'success' ? 'ناجحة' : slotProps.data.payment_status === 'failed' ? 'فاشلة' : 'معلقة' }}
                        </template>
                    </Column>
                    <Column header="التاريخ" field="createdAt">
                        <template #body="slotProps"> {{ slotProps.data.createdAt.split('T')[0] }} </template>
                    </Column>
                    <Column header="عنوان الحالة" field="case_title">
                        <template #body="slotProps"> {{ slotProps.data.case_title || 'غير مرتبط' }} </template>
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
