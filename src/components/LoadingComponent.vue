<template>
    <div class="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-4 rounded-lg shadow-lg">
            <div class="flex justify-center">
                <i class="fa-solid fa-circle-notch fa-spin text-secondary text-[25px]"></i>
            </div>
            <p class="text-center mt-2 text-gray-700">جاري التحميل...</p>
        </div>
    </div>
</template>

<script>
export default {
    name: 'LoadingComponent'
};
</script>
