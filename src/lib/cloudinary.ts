import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error("Missing Cloudinary credentials:");
  console.error("CLOUDINARY_CLOUD_NAME:", cloudName ? "set" : "missing");
  console.error("CLOUDINARY_API_KEY:", apiKey ? "set" : "missing");
  console.error("CLOUDINARY_API_SECRET:", apiSecret ? "set" : "missing");
  throw new Error("Cloudinary credentials not configured properly");
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export default cloudinary;
