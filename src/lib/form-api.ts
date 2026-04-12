import { callApi } from "@/lib/auth";

export async function getUploadUrl(filename: string, contentType = "application/pdf", size = 0): Promise<{ url: string; key: string }> {
  return callApi(`/upload-url?filename=${encodeURIComponent(filename)}&contentType=${encodeURIComponent(contentType)}&size=${size}`);
}

export async function uploadFile(blob: Blob, filename: string, contentType = "application/pdf"): Promise<string> {
  const { url, key } = await getUploadUrl(filename, contentType, blob.size);
  await fetch(url, { method: "PUT", body: blob, headers: { "Content-Type": contentType } });
  return key;
}

// Keep backward-compatible alias
export const uploadPdf = (blob: Blob, filename: string) => uploadFile(blob, filename, "application/pdf");

export async function submitForm(formType: string, formData: unknown, pdfKeys: string[]): Promise<{ id: string }> {
  return callApi("/submit", {
    method: "POST",
    body: JSON.stringify({ formType, formData, pdfKeys }),
  });
}
