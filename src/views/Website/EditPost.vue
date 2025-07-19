<script setup>
import request from '@/service/Request';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import FileUpload from 'primevue/fileupload';
import InputSwitch from 'primevue/inputswitch';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const toast = useToast();
const router = useRouter();
const route = useRoute();

// Post type options for Dropdown
const postTypes = ref([]);

// Form data for the post
const post = ref({
    type: null,
    type_id: '',
    title_ar: '',
    title_en: '',
    content_ar: '',
    content_en: '',
    is_featured: false,
    is_active: true,
    slug: ''
});

// Gallery images, featured image, and video
const post_images = ref([]);
const imageFile = ref(null);
const existingImageUrl = ref(null);
const videoFile = ref(null); // For new video file (video_url)
const existingVideoUrl = ref(null); // Store existing video URL
const submitted = ref(false);
const loading = ref(false);

// Fetch post types
const getPostTypes = async () => {
    const res = await request.get('post-types');
    postTypes.value = res.data;
};

// Fetch post data by ID
const getPost = async (id) => {
    try {
        const res = await request.get(`posts/${id}`);
        if (res.status) {
            const postData = res.data;
            post.value = {
                type: postTypes.value.find((pt) => pt.id === postData.type_id) || null,
                type_id: postData.type_id,
                title_ar: postData.title_ar || '',
                title_en: postData.title_en || '',
                content_ar: postData.content_ar || '',
                content_en: postData.content_en || '',
                is_featured: postData.is_featured,
                is_active: postData.is_active,
                slug: postData.slug || ''
            };
            existingImageUrl.value = postData.image_url || null;
            existingVideoUrl.value = postData.video_url || null;
            if (postData.type.code == 'gallery') {
                post_images.value = res.data.post_images.map((img, index) => ({
                    file: null,
                    image_url: img.image_url,
                    sort_order: img.sort_order || index,
                    id: img.id
                }));
            }
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.msg || 'فشل في جلب المنشور', life: 3000 });
            router.push('/posts');
        }
    } catch (error) {
        console.error('Error fetching post:', error);
        toast.add({ severity: 'error', summary: 'خطأ', detail: error.response?.data?.msg || 'حدث خطأ ما', life: 3000 });
        router.push('/posts');
    }
};

// Initialize data
onMounted(async () => {
    await getPostTypes();
    const postId = route.params.id;
    if (postId) {
        await getPost(postId);
    }
});

// Handle form submission
const updatePost = async () => {
    submitted.value = true;
    loading.value = true;

    // Validation
    if (!post.value.title_ar.trim()) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'العنوان بالعربية مطلوب', life: 3000 });
        loading.value = false;
        return;
    }
    if (!post.value.title_en.trim()) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'العنوان بالإنجليزية مطلوب', life: 3000 });
        loading.value = false;
        return;
    }
    if (!post.value.type || !post.value.type.id) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'نوع المنشور مطلوب', life: 3000 });
        loading.value = false;
        return;
    }
    if (post.value.type.code === 'gallery' && !post_images.value.length) {
        toast.add({ severity: 'error', summary: 'خطأ', detail: 'يجب تحميل صورة واحدة على الأقل للمعرض', life: 3000 });
        loading.value = false;
        return;
    }
    let images = [];

    // Prepare form data
    const formData = new FormData();
    formData.append('type_id', post.value.type.id);
    formData.append('title_ar', post.value.title_ar);
    formData.append('title_en', post.value.title_en);
    if (post.value.content_ar) formData.append('content_ar', post.value.content_ar);
    if (post.value.content_en) formData.append('content_en', post.value.content_en);
    if (post.value.slug) formData.append('slug', post.value.slug);
    formData.append('is_featured', post.value.is_featured ? '1' : '0');
    formData.append('is_active', post.value.is_active ? '1' : '0');
    if (imageFile.value) {
        formData.append('image_url', imageFile.value);
    }
    if (videoFile.value) {
        formData.append('video_url', videoFile.value);
    }
    if (post.value.type.code === 'gallery') {
        post_images.value.forEach((image, index) => {
            if (image.file) {
                formData.append(`images[${index}]`, image.file);
            }
            formData.append(`sort_orders[${index}]`, image.sort_order);
            if (image.id) {
                images.push(image.id);
            }
        });
        formData.append(`image_ids`, images);
    }

    try {
        const res = await request.put(`posts`, route.params.id, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (res.status) {
            toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم تحديث المنشور بنجاح', life: 3000 });
            router.push('/posts');
        } else {
            toast.add({ severity: 'error', summary: 'خطأ', detail: res.msg || 'فشل في تحديث المنشور', life: 3000 });
        }
    } catch (error) {
        console.error('Error updating post:', error);
        const errorMessage = error.response?.data?.msg || error.message || 'حدث خطأ ما';
        toast.add({ severity: 'error', summary: 'خطأ', detail: errorMessage, life: 3000 });
    } finally {
        loading.value = false;
        submitted.value = false;
    }
};

// Handle single image selection for featured image (news or gallery)
const onSelectImage = (event) => {
    const file = event.files[0];
    if (file) {
        if (file.size > 1000000) {
            toast.add({ severity: 'error', summary: 'خطأ', detail: 'حجم الصورة يجب ألا يتجاوز 1 ميغابايت', life: 3000 });
            event.files = [];
            return;
        }
        if (!file.type.startsWith('image/')) {
            toast.add({ severity: 'error', summary: 'خطأ', detail: 'يجب تحميل صورة فقط', life: 3000 });
            event.files = [];
            return;
        }
        imageFile.value = file;
        existingImageUrl.value = null;
        event.files = [];
    }
};

// Handle video selection
const onSelectVideo = (event) => {
    const file = event.files[0];
    if (file) {
        if (file.size > 10000000) {
            toast.add({ severity: 'error', summary: 'خطأ', detail: 'حجم الفيديو يجب ألا يتجاوز 10 ميغابايت', life: 3000 });
            event.files = [];
            return;
        }
        if (!file.type.startsWith('video/')) {
            toast.add({ severity: 'error', summary: 'خطأ', detail: 'يجب تحميل فيديو فقط', life: 3000 });
            event.files = [];
            return;
        }
        videoFile.value = file;
        existingVideoUrl.value = null;
        event.files = [];
    }
};

// Handle multiple image selection for gallery posts
const onSelectpost_images = (event) => {
    const files = event.files;
    if (files.length) {
        files.forEach((file) => {
            if (file.size > 1000000) {
                toast.add({ severity: 'error', summary: 'خطأ', detail: `حجم ${file.name} يجب ألا يتجاوز 1 ميغابايت`, life: 3000 });
                return;
            }
            if (!file.type.startsWith('image/')) {
                toast.add({ severity: 'error', summary: 'خطأ', detail: `يجب أن يكون ${file.name} صورة`, life: 3000 });
                return;
            }
            post_images.value.push({ file, sort_order: post_images.value.length, image_url: null });
        });
        event.files = [];
    }
};

// Remove a gallery image
const removeGalleryImage = (index) => {
    post_images.value.splice(index, 1);
    post_images.value = post_images.value.map((img, i) => ({ ...img, sort_order: i }));
};

// Go back
const goBack = () => {
    router.push('/posts');
};
</script>
<template>
    <div dir="rtl" class="p-6 mx-auto max-w-4xl">
        <Toast />
        <div class="card bg-white shadow-md rounded-lg p-6">
            <h1 class="text-2xl font-bold mb-6 text-center">تعديل المنشور</h1>
            <form @submit.prevent="updatePost" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Post Type -->
                    <div class="flex flex-col">
                        <label for="type" class="block font-bold mb-2">نوع المنشور</label>
                        <Dropdown id="type" v-model="post.type" :options="postTypes" optionLabel="name" optionValue="" placeholder="اختر نوع المنشور" class="w-full" :invalid="submitted && !post.type" />
                        <small v-if="submitted && !post.type" class="text-red-500">نوع المنشور مطلوب.</small>
                    </div>

                    <!-- Title Arabic -->
                    <div class="flex flex-col">
                        <label for="title_ar" class="block font-bold mb-2">العنوان (عربي)</label>
                        <InputText id="title_ar" v-model.trim="post.title_ar" required autofocus :invalid="submitted && !post.title_ar.trim()" class="w-full" />
                        <small v-if="submitted && !post.title_ar.trim()" class="text-red-500">العنوان بالعربية مطلوب.</small>
                    </div>

                    <!-- Title English -->
                    <div class="flex flex-col">
                        <label for="title_en" class="block font-bold mb-2">العنوان (إنجليزي)</label>
                        <InputText id="title_en" v-model.trim="post.title_en" required :invalid="submitted && !post.title_en.trim()" class="w-full" />
                        <small v-if="submitted && !post.title_en.trim()" class="text-red-500">العنوان بالإنجليزية مطلوب.</small>
                    </div>

                    <!-- Content Arabic -->
                    <div class="flex flex-col md:col-span-2">
                        <label for="content_ar" class="block font-bold mb-2">المحتوى (عربي)</label>
                        <Textarea id="content_ar" v-model="post.content_ar" rows="4" class="w-full" />
                    </div>

                    <!-- Content English -->
                    <div class="flex flex-col md:col-span-2">
                        <label for="content_en" class="block font-bold mb-2">المحتوى (إنجليزي)</label>
                        <Textarea id="content_en" v-model="post.content_en" rows="4" class="w-full" />
                    </div>

                    <!-- Slug -->
                    <div class="flex flex-col">
                        <label for="slug" class="block font-bold mb-2">المعرف (Slug)</label>
                        <InputText id="slug" v-model.trim="post.slug" class="w-full" />
                        <small class="text-gray-500">اختياري، سيتم إنشاؤه تلقائيًا إذا ترك فارغًا</small>
                    </div>

                    <!-- Featured -->
                    <div class="flex flex-col">
                        <label for="is_featured" class="block font-bold mb-2">مميز</label>
                        <InputSwitch id="is_featured" v-model="post.is_featured" />
                    </div>

                    <!-- Active -->
                    <div class="flex flex-col">
                        <label for="is_active" class="block font-bold mb-2">نشط</label>
                        <InputSwitch id="is_active" v-model="post.is_active" />
                    </div>

                    <!-- Featured Image (News or Gallery) -->
                    <div class="flex flex-col md:col-span-2">
                        <label for="image" class="block font-bold mb-2">{{ post.type?.code == 'news' ? 'صورة الخبر' : 'الصورة المميزة' }}</label>
                        <FileUpload name="image" accept="image/*" :maxFileSize="1000000" @select="onSelectImage" chooseLabel="اختيار" :multiple="false" :showUploadButton="false" :showCancelButton="true">
                            <template #empty>
                                <span>اسحب الصورة هنا لرفعها.</span>
                            </template>
                        </FileUpload>
                        <small v-if="imageFile" class="text-gray-500">{{ imageFile.name }}</small>
                        <div v-if="existingImageUrl && !imageFile" class="mt-2">
                            <img :src="$imageService.getImageUrl(existingImageUrl)" alt="Existing Featured Image" class="max-w-xs" />
                        </div>
                    </div>

                    <!-- Video Upload -->
                    <div class="flex flex-col md:col-span-2">
                        <label for="video" class="block font-bold mb-2">فيديو (اختياري)</label>
                        <FileUpload name="video" accept="video/*" :maxFileSize="10000000" @select="onSelectVideo" chooseLabel="اختيار فيديو" :multiple="false" :showUploadButton="false" :showCancelButton="true">
                            <template #empty>
                                <span>اسحب الفيديو هنا لرفعه.</span>
                            </template>
                        </FileUpload>
                        <small v-if="videoFile" class="text-gray-500">{{ videoFile.name }}</small>
                        <div v-if="existingVideoUrl && !videoFile" class="mt-2">
                            <video :src="$imageService.getImageUrl(existingVideoUrl)" controls class="max-w-xs" />
                        </div>
                    </div>

                    <!-- Gallery Images (only for gallery type) -->
                    <div v-if="post.type?.code == 'gallery'" class="flex flex-col md:col-span-2">
                        <label class="block font-bold mb-2">صور المعرض</label>
                        <FileUpload name="gallery_images" accept="image/*" :maxFileSize="1000000" @select="onSelectpost_images" chooseLabel="اختيار" :multiple="true" :showUploadButton="false" :showCancelButton="true">
                            <template #empty>
                                <span>اسحب الصور هنا لرفعها.</span>
                            </template>
                        </FileUpload>
                        <small v-if="submitted && post.type.code === 'gallery' && !post_images.length" class="text-red-500">يجب تحميل صورة واحدة على الأقل.</small>
                        <div class="grid grid-cols-2 gap-4 mt-4">
                            <div v-for="(image, index) in post_images" :key="index" class="relative">
                                <img :src="$imageService.getImageUrl(image.image_url)" alt="Gallery Image" class="max-w-full h-auto" />
                                <Button icon="pi pi-trash" class="p-button-danger p-button-sm absolute top-0 right-0" @click="removeGalleryImage(index)" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Form Actions -->
                <div class="flex justify-end gap-4 mt-6">
                    <Button label="العودة إلى المنشورات" icon="pi pi-arrow-right" text @click="goBack" :loading="loading" />
                    <Button type="submit" label="حفظ" icon="pi pi-check" :loading="loading" />
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
.card {
    background-color: #ffffff;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
}
.p-inputtext,
.p-textarea,
.p-fileupload,
.p-dropdown,
.p-inputswitch {
    width: 100%;
}
.text-red-500 {
    color: #ef4444;
}
.text-gray-500 {
    color: #6b7280;
}
</style>
