const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const crypto = require("crypto");

const s3 = new S3Client();
const secrets = new SecretsManagerClient();

function makeUrlSafe(base64) {
  return base64.replace(/\+/g, "-").replace(/=/g, "_").replace(/\//g, "~");
}

async function signCloudFrontUrl(domain, key, keyPairId, privateKeyPem, expiresInSeconds = 300) {
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const resource = `https://${domain}/${key}`;
  const policy = JSON.stringify({
    Statement: [
      {
        Resource: resource,
        Condition: { DateLessThan: { "AWS:EpochTime": expires } },
      },
    ],
  });

  const signer = crypto.createSign("RSA-SHA1");
  signer.update(policy);
  const signature = signer.sign(privateKeyPem, "base64");
  const sigUrlSafe = makeUrlSafe(signature);

  const url = `${resource}?Expires=${expires}&Signature=${encodeURIComponent(sigUrlSafe)}&Key-Pair-Id=${encodeURIComponent(
    keyPairId
  )}`;
  return url;
}

exports.handler = async (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims || {};
  const sub = claims.sub;
  const groups = claims["cognito:groups"] || [];

  if (!sub) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };

  const key = event.queryStringParameters?.key;
  if (!key) return { statusCode: 400, body: JSON.stringify({ error: "Key required" }) };

  const isGeschaeftstelle = groups.includes("geschäftsstelle") || groups.includes("tgv-geschaeftsstelle");
  const isOwner = key.startsWith(`users/${sub}/`);

  if (!isGeschaeftstelle && !isOwner) {
    return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
  }

  // If CloudFront signing is configured, mint a signed CloudFront URL
  const cfDomain = process.env.CLOUDFRONT_DOMAIN;
  const cfKeyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID;
  const cfPrivateSecretArn = process.env.CLOUDFRONT_PRIVATE_KEY_SECRET_ARN;

  if (cfDomain && cfKeyPairId && cfPrivateSecretArn) {
    try {
      const sec = await secrets.send(new GetSecretValueCommand({ SecretId: cfPrivateSecretArn }));
      const privateKeyPem = sec.SecretString;
      if (!privateKeyPem) throw new Error("Empty private key secret");

      const signed = await signCloudFrontUrl(cfDomain, key, cfKeyPairId, privateKeyPem, 300);
      return { statusCode: 200, body: JSON.stringify({ url: signed }) };
    } catch (e) {
      console.error("CloudFront signing failed, falling back to S3 presigned", e);
    }
  }

  // fallback to S3 presigned URL
  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: process.env.BUCKET_NAME, Key: key }),
    { expiresIn: 300 }
  );

  return { statusCode: 200, body: JSON.stringify({ url }) };
};
