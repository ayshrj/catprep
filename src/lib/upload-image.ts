type UploadImageResult = {
  url: string;
  publicId: string | null;
  text?: string | null;
  ocr?: boolean;
};

export async function uploadImageToCloudinary(
  file: File,
  options?: { folder?: string; signal?: AbortSignal; ocr?: boolean }
): Promise<UploadImageResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are supported.");
  }

  const formData = new FormData();
  formData.append("file", file);
  if (options?.folder) {
    formData.append("folder", options.folder);
  }
  if (options?.ocr) {
    formData.append("ocr", "1");
  }

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
    credentials: "include",
    signal: options?.signal,
  });

  const data = await response.json().catch(() => ({}) as any);
  if (!response.ok) {
    const message = typeof data?.error === "string" ? data.error : "Upload failed.";
    throw new Error(message);
  }

  const url = typeof data?.url === "string" ? data.url : "";
  if (!url) {
    throw new Error("Upload response missing URL.");
  }

  return {
    url,
    publicId: typeof data?.publicId === "string" ? data.publicId : null,
    text: typeof data?.text === "string" ? data.text : null,
    ocr: Boolean(data?.ocr),
  };
}
