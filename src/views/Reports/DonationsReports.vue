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

// حالة الفلاتر
const dateRange = ref([null, null]);
const timeFilter = ref('30_days');
const timeFilterOptions = ref([
    { label: 'آخر 7 أيام', value: '7_days' },
    { label: 'آخر 30 يومًا', value: '30_days' },
    { label: 'آخر 90 يومًا', value: '90_days' },
    { label: 'مخصص', value: 'custom' }
]);
const categoryFilter = ref(null);
const categoryOptions = ref([]);
const statusFilter = ref(null);
const statusOptions = ref([
    { label: 'الكل', value: null },
    { label: 'مكتملة', value: 'success' },
    { label: 'معلقة', value: 'pending' },
    { label: 'مرفوضة', value: 'failed' }
]);

// بيانات الجدول
const donations = ref([]);

// بيانات المخططات
const pieChartData = ref({
    labels: [],
    datasets: [
        {
            data: [],
            backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#EF5350', '#AB47BC']
        }
    ]
});
const lineChartData = ref({
    labels: [],
    datasets: [
        {
            label: 'إجمالي التبرعات',
            borderColor: '#42A5F5',
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
        x: { ticks: { color: '#495057' }, grid: { color: '#ebedef' } },
        y: { ticks: { color: '#495057' }, grid: { color: '#ebedef' } }
    }
});

// حالة التحميل والأخطاء
const isLoading = ref(true);
const errorMessage = ref(null);

// جلب بيانات التقارير
const fetchDonationsData = async () => {
    isLoading.value = true;
    errorMessage.value = null;

    try {
        // جلب الفئات
        const categoriesResponse = await request.get('statistics/categories');
        categoryOptions.value = [
            { label: 'الكل', value: null },
            ...categoriesResponse.data.map((cat) => ({
                label: cat.name_ar,
                value: cat.id
            }))
        ];

        // تحديد نطاق التاريخ بناءً على الفلتر
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
            category: categoryFilter.value,
            status: statusFilter.value
        };

        // جلب التبرعات
        const donationsResponse = await request.get('reports/donations', { params });
        donations.value = donationsResponse.data;

        // جلب توزيع التبرعات حسب الفئة
        const categoryChartResponse = await request.get('reports/donations-by-category', { params });
        pieChartData.value.labels = categoryChartResponse.data.labels;
        pieChartData.value.datasets[0].data = categoryChartResponse.data.values;
        pieChartData.value = { ...pieChartData.value };

        // جلب اتجاهات التبرعات
        const timelineChartResponse = await request.get('reports/donations-timeline', { params });
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

// تصدير البيانات إلى CSV
const exportToCSV = () => {
    const headers = ['المعرف', 'المبلغ', 'الفئة', 'التاريخ', 'الحالة', 'اسم المتبرع'];
    const rows = donations.value.map((d) => [
        d.id,
        d.amount,
        d.category?.name_ar || 'غير محدد',
        d.createdAt.split('T')[0],
        d.payment?.payment_status === 'success' ? 'مكتملة' : d.payment?.payment_status === 'pending' ? 'معلقة' : 'مرفوضة',
        d.user?.name || 'مجهول'
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'donations_report.csv');
};

// مراقبة تغييرات الفلاتر
watch([timeFilter, dateRange, categoryFilter, statusFilter], () => {
    fetchDonationsData();
});

onMounted(() => {
    fetchDonationsData();
});
</script>

<template>
    <div class="grid grid-cols-12 gap-8" dir="rtl">
        <!-- حالة التحميل أو الخطأ -->
        <div v-if="isLoading" class="col-span-12 text-center">
            <p>جاري تحميل البيانات...</p>
        </div>
        <div v-else-if="errorMessage" class="col-span-12 text-center text-red-500">
            <p>{{ errorMessage }}</p>
        </div>
        <div v-else class="col-span-12">
            <!-- الفلاتر -->
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
                        <label class="block text-muted-color font-medium mb-2">فئة التبرع</label>
                        <Dropdown v-model="categoryFilter" :options="categoryOptions" optionLabel="label" optionValue="value" class="w-48" />
                    </div>
                    <div>
                        <label class="block text-muted-color font-medium mb-2">حالة التبرع</label>
                        <Dropdown v-model="statusFilter" :options="statusOptions" optionLabel="label" optionValue="value" class="w-48" />
                    </div>
                    <div class="flex items-end">
                        <Button label="تصدير إلى CSV" icon="pi pi-download" @click="exportToCSV" :disabled="!donations.length" />
                    </div>
                </div>
            </div>

            <!-- المخططات -->
            <div class="grid grid-cols-12 gap-8 mb-8">
                <div class="col-span-12 lg:col-span-6">
                    <div class="card">
                        <div class="font-semibold text-xl mb-4">توزيع التبرعات حسب الفئة</div>
                        <Chart type="pie" :data="pieChartData" :options="chartOptions" class="h-80" />
                    </div>
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <div class="card">
                        <div class="font-semibold text-xl mb-4">اتجاهات التبرعات</div>
                        <Chart type="line" :data="lineChartData" :options="chartOptions" class="h-80" />
                    </div>
                </div>
            </div>

            <!-- جدول التبرعات -->
            <div class="card">
                <div class="font-semibold text-xl mb-4">تقرير التبرعات</div>
                <DataTable :value="donations" :rows="10" :paginator="true" responsiveLayout="scroll">
                    <Column header="المعرف" field="id"></Column>
                    <Column header="المبلغ" field="amount">
                        <template #body="slotProps"> {{ slotProps.data.amount }} ر.س </template>
                    </Column>
                    <Column header="الفئة" field="category.name_ar">
                        <template #body="slotProps"> {{ slotProps.data.category?.name_ar || 'غير محدد' }} </template>
                    </Column>
                    <Column header="التاريخ" field="createdAt">
                        <template #body="slotProps"> {{ slotProps.data.createdAt.split('T')[0] }} </template>
                    </Column>
                    <Column header="الحالة" field="payment.payment_status">
                        <template #body="slotProps">
                            {{ slotProps.data.payment?.payment_status === 'success' ? 'مكتملة' : slotProps.data.payment?.payment_status === 'pending' ? 'معلقة' : 'مرفوضة' }}
                        </template>
                    </Column>
                    <Column header="اسم المتبرع" field="user.name">
                        <template #body="slotProps"> {{ slotProps.data.user?.name || 'مجهول' }} </template>
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
.text-primary {
    color: #3b82f6;
}
</style>
