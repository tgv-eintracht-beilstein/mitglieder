const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand, DeleteCommand, GetCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient());

exports.handler = async (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims || {};
  const email = claims.email || claims.sub;
  const groups = claims["cognito:groups"] || [];
  if (!email) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch { /* ignore */ }
  const { id, formType } = body;
  if (!id) return { statusCode: 400, body: JSON.stringify({ error: "id required" }) };

  const isGst = groups.includes("geschäftsstelle") || groups.includes("tgv-geschaeftsstelle");

  try {
    let item = null;
    let oldPK, oldSK;

    if (formType) {
      // Form submissions — only Geschäftsstelle can archive these
      if (!isGst) return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };

      const res = await ddb.send(new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: { PK: `FORM#${formType}`, SK: id }
      }));
      item = res.Item || null;
    } else {
      // Regular messages — exact key lookup scoped to user's mailbox
      const res = await ddb.send(new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: { PK: `MAIL#${email}`, SK: `INBOX#${id}` }
      }));
      item = res.Item || null;
    }

    if (!item) return { statusCode: 404, body: JSON.stringify({ error: "Not found" }) };

    oldPK = item.PK;
    oldSK = item.SK;

    await ddb.send(new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: { ...item, PK: `MAIL#${email}`, SK: `ARCHIVE#${id}`, archivedAt: new Date().toISOString() }
    }));
    await ddb.send(new DeleteCommand({
      TableName: process.env.TABLE_NAME,
      Key: { PK: oldPK, SK: oldSK }
    }));

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("Archive error", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};
