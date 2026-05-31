const { S3Client, ListObjectVersionsCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { GetObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client();

exports.handler = async (event) => {
  const sub = event.requestContext?.authorizer?.jwt?.claims?.sub;
  if (!sub) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };

  const key = event.queryStringParameters?.key;
  if (!key || !key.startsWith(`users/${sub}/`)) return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };

  const { Versions = [] } = await s3.send(new ListObjectVersionsCommand({
    Bucket: process.env.BUCKET_NAME,
    Prefix: key,
  }));

  const versions = Versions
    .filter(v => v.Key === key)
    .map(v => ({
      versionId: v.VersionId,
      lastModified: v.LastModified?.toISOString(),
      size: v.Size,
      isLatest: v.IsLatest,
    }));

  return { statusCode: 200, body: JSON.stringify(versions) };
};
