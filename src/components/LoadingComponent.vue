<template>
    <div class="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-4 rounded-lg shadow-lg">
            <div class="flex justify-center">
                <div class="w-8 h-8 border-4 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
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
