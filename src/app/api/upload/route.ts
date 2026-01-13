import type { UploadApiOptions } from "cloudinary";
import { type NextRequest, NextResponse } from "next/server";

import cloudinary from "@/lib/cloudinary";

import { getAuthenticatedUserId } from "../auth/utils";

export const runtime = "nodejs";

function extractOcrText(payload: any): string | null {
  const ocr = payload?.info?.ocr;
  if (!ocr) return null;

  const adv = ocr?.adv_ocr?.data;
  if (adv?.textAnnotations?.[0]?.description) {
    return String(adv.textAnnotations[0].description).trim();
  }
  if (typeof adv?.text === "string" && adv.text.trim()) {
    return adv.text.trim();
  }

  const plain = ocr?.data;
  if (plain?.textAnnotations?.[0]?.description) {
    return String(plain.textAnnotations[0].description).trim();
  }

  return null;
}

function isOcrSubscriptionError(error: any) {
  const message = String(error?.message ?? "");
  const code = Number(error?.http_code ?? error?.httpCode ?? error?.status);
  if (Number.isFinite(code) && code === 420) return true;
  return message.toLowerCase().includes("ocr");
}

async function uploadToCloudinary({ dataUri, folder, withOcr }: { dataUri: string; folder: string; withOcr: boolean }) {
  const uploadOptions: UploadApiOptions & { ocr?: string } = {
    folder,
    resource_type: "image",
  };
  if (withOcr) {
    uploadOptions.ocr = "adv_ocr";
  }
  return cloudinary.uploader.upload(dataUri, uploadOptions);
}

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const fileEntry = formData.get("file");
    const folderEntry = formData.get("folder");
    const ocrEntry = formData.get("ocr");
    const folder = typeof folderEntry === "string" && folderEntry.trim() ? folderEntry.trim() : "cat99/notes";
    const ocrEnabled = process.env.CLOUDINARY_OCR_ENABLED === "true";
    const withOcrRequested = ocrEntry === "1" || ocrEntry === "true";
    let withOcr = ocrEnabled && withOcrRequested;

    if (!(fileEntry instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    const file = fileEntry;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    let uploadResult;
    try {
      uploadResult = await uploadToCloudinary({ dataUri, folder, withOcr });
    } catch (error) {
      if (withOcr && isOcrSubscriptionError(error)) {
        withOcr = false;
        uploadResult = await uploadToCloudinary({
          dataUri,
          folder,
          withOcr: false,
        });
      } else {
        throw error;
      }
    }

    const text = withOcr ? extractOcrText(uploadResult) : null;

    return NextResponse.json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      text,
      ocr: withOcr,
    });
  } catch (error) {
    console.error("Cloudinary upload failed", error);
    return NextResponse.json({ error: "Unable to upload file right now." }, { status: 500 });
  }
}
