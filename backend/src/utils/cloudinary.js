import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
cloudinary.config({ 
  cloud_name: process.env.cloudinary_cloud_name, 
  api_key: process.env.cloudinary_api_key, 
  api_secret: process.env.cloudinary_api_secret
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