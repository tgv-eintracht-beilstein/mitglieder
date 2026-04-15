const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

const s3 = new S3Client();

exports.handler = async (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims || {};
  const sub = claims.sub;
  if (!sub) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };

  const { key, signatureDataUrl, x, y, width, height, page } = JSON.parse(event.body || "{}");
  if (!key || !signatureDataUrl || x == null || y == null || width == null || height == null) {
    return { statusCode: 400, body: JSON.stringify({ error: "key, signatureDataUrl, x, y, width, height required" }) };
  }

  const obj = await s3.send(new GetObjectCommand({ Bucket: process.env.BUCKET_NAME, Key: key }));
  const pdfBytes = await obj.Body.transformToByteArray();

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pageIndex = page || 0;
  const pdfPage = pdfDoc.getPages()[pageIndex];
  if (!pdfPage) return { statusCode: 400, body: JSON.stringify({ error: "Invalid page" }) };

  const base64 = signatureDataUrl.replace(/^data:image\/png;base64,/, "");
  const sigBytes = Buffer.from(base64, "base64");
  const sigImage = await pdfDoc.embedPng(sigBytes);

  const pageHeight = pdfPage.getHeight();
  const sigY = pageHeight - y - height;

  // Draw signature image
  pdfPage.drawImage(sigImage, { x, y: sigY, width, height });

  // Draw date/time text below the signature
  const now = new Date();
  const dateStr = now.toLocaleString("de-DE", { timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  pdfPage.drawText(dateStr, {
    x,
    y: sigY - 10,
    size: 7,
    font,
    color: rgb(0.42, 0.45, 0.5),
  });

  const signedPdfBytes = await pdfDoc.save();

  await s3.send(new PutObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: key,
    Body: signedPdfBytes,
    ContentType: "application/pdf",
  }));

  return { statusCode: 200, body: JSON.stringify({ key }) };
};
