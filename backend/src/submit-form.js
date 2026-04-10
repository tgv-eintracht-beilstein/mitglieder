const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient());

exports.handler = async (event) => {
  const body = JSON.parse(event.body || "{}");
  const { formType, formData, pdfKeys, submittedBy } = body;

  if (!formType || !formData) {
    return { statusCode: 400, body: JSON.stringify({ error: "formType and formData required" }) };
  }

  const now = new Date().toISOString();
  const id = `${now}#${Math.random().toString(36).slice(2, 8)}`;

  await ddb.send(new PutCommand({
    TableName: process.env.TABLE_NAME,
    Item: {
      PK: `FORM#${formType}`,
      SK: id,
      formType,
      formData,
      pdfKeys: pdfKeys || [],
      submittedBy: submittedBy || "anonymous",
      createdAt: now,
    },
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({ id }),
  };
};
