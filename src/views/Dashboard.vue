<script setup>
import request from '@/service/Request';
import Button from 'primevue/button';
import Chart from 'primevue/chart';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Menu from 'primevue/menu';
import { onMounted, ref } from 'vue';

// حالة المقاييس
const states = ref({
    users: 0,
    donations: 0,
    patientCases: 0,
    payments: 0,
    changes: {
        users: { count: 0, percentage: 0 },
        donations: { count: 0, percentage: 0 },
        patientCases: { count: 0, percentage: 0 },
        payments: { count: 0, percentage: 0 }
    }
});

// بيانات الجداول
const donations = ref([]);
const patientCases = ref([]);

// بيانات المخطط
const chartData = ref({
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
    datasets: [
        {
            label: 'إجمالي التبرعات',
            backgroundColor: '#42A5F5',
            data: [0, 0, 0, 0, 0, 0]
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

// قائمة الإشعارات
const menu = ref();
const items = ref([
    { label: 'عرض الكل', icon: 'pi pi-eye' },
    { label: 'مسح', icon: 'pi pi-trash' }
]);

// دالة لتنسيق التغيرات
const formatChange = (change) => {
    if (change.count > 0) {
        if (change.percentage !== 0) {
            return `${change.percentage > 0 ? '+' : ''}${change.percentage}% منذ الأسبوع الماضي`;
        }
        return `${change.count} جديد منذ الأسبوع الماضي`;
    }
    return 'لا تغييرات منذ الأسبوع الماضي';
};

// جلب بيانات لوحة التحكم
const fetchDashboardData = async () => {
    try {
        // جلب المقاييس
        const statsResponse = await request.get('base/states');
        states.value = statsResponse.data;

        // جلب التبرعات الأخيرة
        const donationsResponse = await request.get('base/recent-donations');
        donations.value = donationsResponse.data;

        // جلب حالات المرضى الأخيرة
        const patientCasesResponse = await request.get('base/recent-patient-cases');
        patientCases.value = patientCasesResponse.data;

        // جلب بيانات المخطط
        const chartResponse = await request.get('base/donation-chart');
        chartData.value.datasets[0].data = chartResponse.data;
    } catch (error) {
        console.error('خطأ في جلب بيانات لوحة التحكم:', error);
    }
};

onMounted(() => {
    fetchDashboardData();
});
</script>

<template>
    <div class="grid grid-cols-12 gap-8" dir="rtl">
        <!-- عناصر المقاييس -->
        <div class="col-span-12 xl:col-span-12">
            <div class="grid grid-cols-12 gap-8">
                <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                    <div class="card mb-0">
                        <div class="flex justify-between mb-4">
                            <div>
                                <span class="block text-muted-color font-medium mb-4">المستخدمون</span>
                                <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ states.users }}</div>
                            </div>
                            <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                                <i class="pi pi-users text-blue-500 !text-xl"></i>
                            </div>
                        </div>
                        <span class="text-primary font-medium">{{ formatChange(states.changes.users) }}</span>
                        <!-- <span class="text-muted-color">مقارنة بالأسبوع الماضي</span> -->
                    </div>
                </div>
                <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                    <div class="card mb-0">
                        <div class="flex justify-between mb-4">
                            <div>
                                <span class="block text-muted-color font-medium mb-4">التبرعات</span>
                                <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ states.donations }}</div>
                            </div>
                            <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                                <i class="pi pi-wallet text-orange-500 !text-xl"></i>
                            </div>
                        </div>
                        <span class="text-primary font-medium">{{ formatChange(states.changes.donations) }}</span>
                        <!-- <span class="text-muted-color">مقارنة بالأسبوع الماضي</span> -->
                    </div>
                </div>
                <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                    <div class="card mb-0">
                        <div class="flex justify-between mb-4">
                            <div>
                                <span class="block text-muted-color font-medium mb-4">حالات المرضى</span>
                                <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ states.patientCases }}</div>
                            </div>
                            <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                                <i class="pi pi-heart text-cyan-500 !text-xl"></i>
                            </div>
                        </div>
                        <span class="text-primary font-medium">{{ formatChange(states.changes.patientCases) }}</span>
                        <!-- <span class="text-muted-color">مقارنة بالأسبوع الماضي</span> -->
                    </div>
                </div>
                <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                    <div class="card mb-0">
                        <div class="flex justify-between mb-4">
                            <div>
                                <span class="block text-muted-color font-medium mb-4">الدفعات الناجحة</span>
                                <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ states.payments }}</div>
                            </div>
                            <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                                <i class="pi pi-check-circle text-purple-500 !text-xl"></i>
                            </div>
                        </div>
                        <span class="text-primary font-medium">{{ formatChange(states.changes.payments) }}</span>
                        <!-- <span class="text-muted-color">مقارنة بالأسبوع الماضي</span> -->
                    </div>
                </div>
            </div>
        </div>

        <!-- الجداول -->
        <div class="col-span-12 xl:col-span-6">
            <div class="card">
                <div class="font-semibold text-xl mb-4">التبرعات الأخيرة</div>
                <DataTable paginatorPosition="both" :value="donations" :rows="5" :paginator="true" responsiveLayout="scroll">
                    <Column header="المعرف" field="id"></Column>
                    <Column header="المبلغ" field="amount">
                        <template #body="slotProps"> {{ slotProps.data.amount }} ر.س </template>
                    </Column>
                    <Column header="الفئة" field="category.name_ar"></Column>
                    <Column header="التاريخ" field="createdAt">
                        <template #body="slotProps">
                            {{ slotProps.data.createdAt.split('T')[0] }}
                        </template>
                    </Column>
                </DataTable>
            </div>
            <div class="card">
                <div class="font-semibold text-xl mb-4">حالات المرضى الأخيرة</div>
                <DataTable paginatorPosition="both" :value="patientCases" :rows="5" :paginator="true" responsiveLayout="scroll">
                    <Column header="المعرف" field="id"></Column>
                    <Column header="العنوان" field="title"></Column>
                    <Column header="التقدم" field="progress">
                        <template #body="slotProps"> {{ slotProps.data.progress }}% </template>
                    </Column>
                </DataTable>
            </div>
        </div>

        <!-- المخطط والإشعارات -->
        <div class="col-span-12 xl:col-span-6">
            <div class="card">
                <div class="font-semibold text-xl mb-4">اتجاهات التبرعات</div>
                <Chart type="bar" :data="chartData" :options="chartOptions" class="h-80" />
            </div>
            <div class="card">
                <div class="flex items-center justify-between mb-6">
                    <div class="font-semibold text-xl">الأنشطة الأخيرة</div>
                    <div>
                        <Button icon="pi pi-ellipsis-v" class="p-button-text p-button-plain p-button-rounded" @click="$refs.menu.toggle($event)"></Button>
                        <Menu ref="menu" popup :model="items" class="!min-w-40"></Menu>
                    </div>
                </div>
                <span class="block text-muted-color font-medium mb-4">اليوم</span>
                <ul class="p-0 mx-0 mt-0 mb-6 list-none">
                    <li class="flex items-center py-2 border-b border-surface">
                        <div class="w-12 h-12 flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-full mr-4 shrink-0">
                            <i class="pi pi-wallet !text-xl text-blue-500"></i>
                        </div>
                        <span class="text-surface-900 dark:text-surface-0 leading-normal"> تم استلام تبرع بقيمة <span class="text-primary font-bold">500 ر.س</span> لحالة مريض. </span>
                    </li>
                </ul>
                <span class="block text-muted-color font-medium mb-4">الأمس</span>
                <ul class="p-0 m-0 list-none mb-6">
                    <li class="flex items-center py-2 border-b border-surface">
                        <div class="w-12 h-12 flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-full mr-4 shrink-0">
                            <i class="pi pi-heart !text-xl text-orange-500"></i>
                        </div>
                        <span class="text-surface-900 dark:text-surface-0 leading-normal"> تمت إضافة حالة مريض جديدة: <span class="text-primary font-bold">صندوق علاج السرطان</span>. </span>
                    </li>
                </ul>
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
