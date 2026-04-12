const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client();

exports.handler = async (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims || {};
  const sub = claims.sub;
  const groups = claims["cognito:groups"] || [];

  if (!sub) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };

  const key = event.queryStringParameters?.key;
  if (!key) return { statusCode: 400, body: JSON.stringify({ error: "Key required" }) };

  const isGeschäftstelle = groups.includes("geschäftsstelle") || groups.includes("tgv-geschaeftsstelle");
  const isOwner = key.startsWith(`users/${sub}/`);

  if (!isGeschäftstelle && !isOwner) {
    return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
  }

  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: process.env.BUCKET_NAME, Key: key }),
    { expiresIn: 300 }
  );

  return { statusCode: 200, body: JSON.stringify({ url }) };
};
