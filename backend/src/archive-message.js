const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { QueryCommand, PutCommand, DeleteCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient());

exports.handler = async (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims || {};
  const email = claims.email || claims.sub;
  if (!email) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch (e) { /* ignore */ }
  const { id } = body;
  if (!id) return { statusCode: 400, body: JSON.stringify({ error: "id required" }) };

  const pk = `MAIL#${email}`;

  try {
    const q = await ddb.send(new QueryCommand({
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "PK = :pk",
      FilterExpression: "contains(SK, :id)",
      ExpressionAttributeValues: { ":pk": pk, ":id": id }
    }));

    const items = q.Items || [];
    if (items.length === 0) return { statusCode: 404, body: JSON.stringify({ error: "Not found" }) };

    const item = items[0];
    const oldSK = item.SK;
    const newSK = `ARCHIVE#${id}`;
    const newItem = { ...item, SK: newSK, archivedAt: new Date().toISOString() };

    await ddb.send(new PutCommand({ TableName: process.env.TABLE_NAME, Item: newItem }));
    await ddb.send(new DeleteCommand({ TableName: process.env.TABLE_NAME, Key: { PK: pk, SK: oldSK } }));

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("Archive error", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};
