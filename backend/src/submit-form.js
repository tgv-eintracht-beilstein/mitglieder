const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { EventBridgeClient, PutEventsCommand } = require("@aws-sdk/client-eventbridge");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient());
const eb = new EventBridgeClient();
const s3 = new S3Client();

exports.handler = async (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims || {};
  const sub = claims.sub;
  const email = claims.email || sub;
  const body = JSON.parse(event.body || "{}");
  const { formType, formData, pdfKeys } = body;

  if (!formType || !formData) {
    return { statusCode: 400, body: JSON.stringify({ error: "formType and formData required" }) };
  }

  const now = new Date().toISOString();
  const id = `${now}#${crypto.randomUUID()}`;
  const item = {
    id,
    formType,
    formData,
    pdfKeys: pdfKeys || [],
    submittedBy: email || "anonymous",
    createdAt: now,
  };

  await Promise.all([
    ddb.send(new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: { PK: `FORM#${formType}`, SK: id, ...item },
    })),
    s3.send(new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: `users/${sub}/.data/${formType}/${now.replace(/:/g, "-")}.json`,
      ContentType: "application/json",
      Body: JSON.stringify(item),
    })),
    eb.send(new PutEventsCommand({
      Entries: [{ Source: "tgv.mitglieder", DetailType: `form.submitted.${formType}`, Detail: JSON.stringify(item) }],
    })),
  ]);

  return { statusCode: 200, body: JSON.stringify({ id }) };
};
