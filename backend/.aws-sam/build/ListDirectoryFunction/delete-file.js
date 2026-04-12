const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client();

exports.handler = async (event) => {
  const sub = event.requestContext?.authorizer?.jwt?.claims?.sub;
  if (!sub) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };

  const { key } = JSON.parse(event.body || "{}");
  if (!key || !key.startsWith(`users/${sub}/`)) {
    return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
  }

  await s3.send(new DeleteObjectCommand({ Bucket: process.env.BUCKET_NAME, Key: key }));
  return { statusCode: 200, body: JSON.stringify({ deleted: key }) };
};
