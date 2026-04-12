const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");

const s3 = new S3Client();

exports.handler = async (event) => {
  const sub = event.requestContext?.authorizer?.jwt?.claims?.sub;
  if (!sub) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };

  const prefix = `users/${sub}/`;
  const { Contents = [] } = await s3.send(new ListObjectsV2Command({
    Bucket: process.env.BUCKET_NAME,
    Prefix: prefix,
  }));

  const files = Contents
    .filter((o) => !o.Key.includes("/.data/"))
    .map((o) => ({
    key: o.Key,
    name: o.Key.split("/").pop(),
    size: o.Size,
    lastModified: o.LastModified?.toISOString(),
  }));

  return { statusCode: 200, body: JSON.stringify(files) };
};
