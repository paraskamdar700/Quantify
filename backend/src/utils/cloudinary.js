import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/////////////////////////
// Uploads an image file
/////////////////////////
const uploadImage = async (imagePath) => {
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      resource_type: "auto",
      use_filename: true,
      unique_filename: false,
      overwrite: true,
    });
    fs.unlinkSync(imagePath); // Clean up
    return result;
  } catch (error) {
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    console.error("Error uploading image:", error);
    throw new Error("Image upload failed");
  }
};

export { uploadImage };