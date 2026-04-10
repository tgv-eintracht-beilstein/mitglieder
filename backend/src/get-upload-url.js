const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");

const s3 = new S3Client();

exports.handler = async (event) => {
  const params = event.queryStringParameters || {};
  const filename = params.filename || `${crypto.randomUUID()}.pdf`;
  const contentType = params.contentType || "application/pdf";

  const key = `uploads/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}/${filename}`;

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
