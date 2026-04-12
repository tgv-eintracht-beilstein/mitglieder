const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");

const s3 = new S3Client();
const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_SIZE = 10 * 1024 * 1024;

exports.handler = async (event) => {
  const sub = event.requestContext?.authorizer?.jwt?.claims?.sub;
  if (!sub) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };

  const params = event.queryStringParameters || {};
  const filename = params.filename || `${crypto.randomUUID()}.pdf`;
  const contentType = params.contentType || "application/pdf";
  const size = parseInt(params.size || "0", 10);

  if (!ALLOWED_TYPES.includes(contentType)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Nur PDF, PNG und JPG erlaubt" }) };
  }

  if (size > MAX_SIZE) {
    return { statusCode: 400, body: JSON.stringify({ error: "Datei zu groß (max. 10 MB)" }) };
  }

  const key = `users/${sub}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}/${filename}`;

  const url = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 300 }
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ url, key }),
  };
};
