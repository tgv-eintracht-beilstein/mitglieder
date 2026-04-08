import { callApi } from "@/lib/auth";

export async function getUploadUrl(filename: string): Promise<{ url: string; key: string }> {
  return callApi(`/upload-url?filename=${encodeURIComponent(filename)}`);
}

export async function uploadPdf(blob: Blob, filename: string): Promise<string> {
  const { url, key } = await getUploadUrl(filename);
  await fetch(url, { method: "PUT", body: blob, headers: { "Content-Type": "application/pdf" } });
  return key;
}

export async function submitForm(formType: string, formData: unknown, pdfKeys: string[]): Promise<{ id: string }> {
  return callApi("/submit", {
    method: "POST",
    body: JSON.stringify({ formType, formData, pdfKeys }),
  });
}
