// Define the server base URL
const BASE_URL = 'https://api.ratlclinic.com/'; // Replace with your actual server base URL

export const ImageService = {
    getImageUrl(imagePath) {
        // Ensure imagePath is provided and is a string
        if (!imagePath || typeof imagePath !== 'string') {
            console.warn('Invalid image path provided');
            return `${BASE_URL}/images/fallback.png`; // Fallback image
        }

        // Remove leading/trailing slashes from imagePath to avoid double slashes
        const cleanImagePath = imagePath.split("public/")[1];
        // Combine base URL with image path
        return `${BASE_URL}/${cleanImagePath}`;
    },
};