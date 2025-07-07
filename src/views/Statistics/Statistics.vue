<script setup>
import { ref, onMounted, watch } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Chart from 'primevue/chart';
import Dropdown from 'primevue/dropdown';
import request from '@/service/Request';

// Summary metrics
const stats = ref({
    totalDonations: 0,
    cases: 0, // Changed from patientCases
    successfulPayments: 0,
    averageDonation: 0
});

// Table data
const topDonations = ref([]);
const cases = ref([]); // Changed from patientCases

// Chart data
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
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
    datasets: [
        {
            label: 'إجمالي التبرعات',
            borderColor: '#42A5F5',
            data: [0, 0, 0, 0, 0, 0],
            fill: false
        }
    ]
});
const barChartData = ref({
    labels: ['مفتوح', 'مكتمل'], // Updated to reflect status
    datasets: [
        {
            label: 'الحالات',
            backgroundColor: '#66BB6A',
            data: [0, 0]
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

// Filters
const timeFilter = ref('30_days');
const timeFilterOptions = ref([
    { label: 'آخر 7 أيام', value: '7_days' },
    { label: 'آخر 30 يومًا', value: '30_days' },
    { label: 'آخر 90 يومًا', value: '90_days' },
    { label: 'كل الوقت', value: 'all_time' }
]);
const categoryFilter = ref(null);
const categoryOptions = ref([]);

// Loading and error states
const isLoading = ref(true);
const errorMessage = ref(null);

// Fetch statistics data
const fetchStatisticsData = async () => {
    isLoading.value = true;
    errorMessage.value = null;

    try {
        // Fetch categories for filter
        const categoriesResponse = await request.get('statistics/categories');
        categoryOptions.value = categoriesResponse.data.map((cat) => ({
            label: cat.name_ar,
            value: cat.id
        }));

        // Fetch summary metrics
        const summaryResponse = await request.get('statistics/summary', {
            params: { time: timeFilter.value, category: categoryFilter.value }
        });
        stats.value = summaryResponse.data;

        // Fetch donations by category (pie chart)
        const donationsByCategoryResponse = await request.get('statistics/donations-by-category', {
            params: { time: timeFilter.value, category: categoryFilter.value }
        });
        pieChartData.value.labels = donationsByCategoryResponse.data.labels;
        pieChartData.value.datasets[0].data = donationsByCategoryResponse.data.values;
        pieChartData.value = { ...pieChartData.value };

        // Fetch monthly donations (line chart)
        const monthlyDonationsResponse = await request.get('statistics/monthly-donations', {
            params: { time: timeFilter.value, category: categoryFilter.value }
        });
        lineChartData.value.datasets[0].data = monthlyDonationsResponse.data;
        lineChartData.value = { ...lineChartData.value };

        // Fetch cases by status (bar chart)
        const casesByStatusResponse = await request.get('statistics/cases-by-status', {
            params: { time: timeFilter.value }
        });
        barChartData.value.datasets[0].data = casesByStatusResponse.data;
        barChartData.value = { ...barChartData.value };

        // Fetch top donations
        const topDonationsResponse = await request.get('statistics/top-donations', {
            params: { time: timeFilter.value, category: categoryFilter.value }
        });
        topDonations.value = topDonationsResponse.data;

        // Fetch cases
        const casesResponse = await request.get('statistics/cases', {
            params: { time: timeFilter.value }
        });
        cases.value = casesResponse.data;
    } catch (error) {
        console.error('خطأ في جلب بيانات الإحصائيات:', error);
        errorMessage.value = 'فشل في تحميل البيانات، يرجى المحاولة لاحقًا';
    } finally {
        isLoading.value = false;
    }
};

// Watch filter changes
watch([timeFilter, categoryFilter], () => {
    fetchStatisticsData();
});

onMounted(() => {
    fetchStatisticsData();
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
                <div class="flex gap-4">
                    <div>
                        <label class="block text-muted-color font-medium mb-2">الفترة الزمنية</label>
                        <Dropdown v-model="timeFilter" :options="timeFilterOptions" optionLabel="label" optionValue="value" class="w-48" />
                    </div>
                    <div>
                        <label class="block text-muted-color font-medium mb-2">فئة التبرع</label>
                        <Dropdown v-model="categoryFilter" :options="[{ label: 'الكل', value: null }, ...categoryOptions]" optionLabel="label" optionValue="value" class="w-48" />
                    </div>
                </div>
            </div>

            <!-- Summary Metrics -->
            <div class="grid grid-cols-12 gap-8 mb-8">
                <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                    <div class="card mb-0">
                        <div class="flex justify-between mb-4">
                            <div>
                                <span class="block text-muted-color font-medium mb-4">إجمالي التبرعات</span>
                                <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats.totalDonations }} ر.س</div>
                            </div>
                            <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                                <i class="pi pi-wallet text-blue-500 !text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                    <div class="card mb-0">
                        <div class="flex justify-between mb-4">
                            <div>
                                <span class="block text-muted-color font-medium mb-4">الحالات</span>
                                <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats.cases }}</div>
                            </div>
                            <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                                <i class="pi pi-heart text-cyan-500 !text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                    <div class="card mb-0">
                        <div class="flex justify-between mb-4">
                            <div>
                                <span class="block text-muted-color font-medium mb-4">الدفعات الناجحة</span>
                                <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats.successfulPayments }}</div>
                            </div>
                            <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                                <i class="pi pi-check-circle text-purple-500 !text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                    <div class="card mb-0">
                        <div class="flex justify-between mb-4">
                            <div>
                                <span class="block text-muted-color font-medium mb-4">متوسط التبرع</span>
                                <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats.averageDonation }} ر.س</div>
                            </div>
                            <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                                <i class="pi pi-chart-line text-orange-500 !text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts -->
            <div class="grid grid-cols-12 gap-8 mb-8">
                <div class="col-span-12 lg:col-span-6">
                    <div class="card">
                        <div class="font-semibold text-xl mb-4">توزيع التبرعات حسب الفئة</div>
                        <Chart type="pie" :data="pieChartData" :options="chartOptions" class="h-80" />
                    </div>
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <div class="card">
                        <div class="font-semibold text-xl mb-4">اتجاهات التبرعات الشهرية</div>
                        <Chart type="line" :data="lineChartData" :options="chartOptions" class="h-80" />
                    </div>
                </div>
                <div class="col-span-12">
                    <div class="card">
                        <div class="font-semibold text-xl mb-4">الحالات حسب الحالة</div>
                        <Chart type="bar" :data="barChartData" :options="chartOptions" class="h-80" />
                    </div>
                </div>
            </div>

            <!-- Tables -->
            <div class="grid grid-cols-12 gap-8">
                <div class="col-span-12 lg:col-span-6">
                    <div class="card">
                        <div class="font-semibold text-xl mb-4">أعلى التبرعات</div>
                        <DataTable :value="topDonations" :rows="5" :paginator="true" responsiveLayout="scroll">
                            <Column header="المعرف" field="id"></Column>
                            <Column header="المبلغ" field="amount">
                                <template #body="slotProps"> {{ slotProps.data.amount }} ر.س </template>
                            </Column>
                            <Column header="الفئة" field="category.name_ar"></Column>
                            <Column header="التاريخ" field="createdAt">
                                <template #body="slotProps"> {{ slotProps.data.createdAt.split('T')[0] }} </template>
                            </Column>
                        </DataTable>
                    </div>
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <div class="card">
                        <div class="font-semibold text-xl mb-4">الحالات</div>
                        <DataTable :value="cases" :rows="5" :paginator="true" responsiveLayout="scroll">
                            <Column header="المعرف" field="id"></Column>
                            <Column header="العنوان" field="title"></Column>
                            <Column header="التقدم" field="progress">
                                <template #body="slotProps"> {{ slotProps.data.progress }}% </template>
                            </Column>
                            <Column header="الحالة" field="status">
                                <template #body="slotProps"> {{ slotProps.data.status === 'open' ? 'مفتوح' : 'مكتمل' }} </template>
                            </Column>
                        </DataTable>
                    </div>
                </div>
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
.rounded-border {
    border-radius: 50%;
}
</style>
