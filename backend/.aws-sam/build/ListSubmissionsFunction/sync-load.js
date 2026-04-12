const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { GetCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient());

exports.handler = async (event) => {
  const sub = event.requestContext?.authorizer?.jwt?.claims?.sub;
  if (!sub) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };

  const key = event.queryStringParameters?.key;
  if (!key) return { statusCode: 400, body: JSON.stringify({ error: "key required" }) };

  const result = await ddb.send(new GetCommand({
    TableName: process.env.TABLE_NAME,
    Key: { PK: `USER#${sub}`, SK: `DATA#${key}` },
  }));

  if (!result.Item) {
    return { statusCode: 200, body: JSON.stringify({ data: null, updatedAt: null }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ data: result.Item.data, updatedAt: result.Item.updatedAt }),
  };
};
