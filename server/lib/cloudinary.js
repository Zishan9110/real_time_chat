import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});
export const uploadImage = async (file, folder = "user_profiles") => {
    if (!process.env.CLOUDINARY_UPLOAD_PRESET) {
        throw new Error("CLOUDINARY_UPLOAD_PRESET is missing in .env");
    }

    try {
        const result = await cloudinary.uploader.upload(file, {
            folder,
            upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET
        });
        return result.secure_url;
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw error;
    }
};

export default cloudinary;
