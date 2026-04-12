const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient());

exports.handler = async (event) => {
  const sub = event.requestContext?.authorizer?.jwt?.claims?.sub;
  if (!sub) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };

  const { key, data } = JSON.parse(event.body || "{}");
  if (!key || data === undefined) {
    return { statusCode: 400, body: JSON.stringify({ error: "key and data required" }) };
  }

  const now = new Date().toISOString();
  await ddb.send(new PutCommand({
    TableName: process.env.TABLE_NAME,
    Item: { PK: `USER#${sub}`, SK: `DATA#${key}`, data, updatedAt: now },
  }));

  return { statusCode: 200, body: JSON.stringify({ updatedAt: now }) };
};
