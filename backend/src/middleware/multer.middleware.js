import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// This boilerplate gives you the absolute path to the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This creates an absolute path to your 'public/temp' folder from the project root
// We go up two directories from 'src/middleware' to get to the 'backend' root
const uploadDir = path.resolve(__dirname, "../../public/temp");

// Create the directory if it doesn't exist to prevent ENOENT errors
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Use the safe, absolute path
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Keep the original file extension (e.g., .jpg, .png)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ storage: storage });