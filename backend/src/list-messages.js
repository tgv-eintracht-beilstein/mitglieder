const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { QueryCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient());

const FORM_TYPES = ["mitglied-werden", "ehrenamtspauschale", "reisekostenabrechnung", "übungsleiterpauschale"];

exports.handler = async (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims || {};
  const email = claims.email || claims.sub;
  const groups = claims["cognito:groups"] || [];

  if (!email) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };

  const { folder = "INBOX" } = event.queryStringParameters || {};
  const isGst = groups.includes("geschäftsstelle") || groups.includes("tgv-geschaeftsstelle");

  let items = [];

  // Fetch regular messages — id is derived from SK (format: INBOX#<id>)
  try {
    const msgData = await ddb.send(new QueryCommand({
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `MAIL#${email}`,
        ":sk": `${folder}#`
      },
      ScanIndexForward: false
    }));
    items = (msgData.Items || []).map(item => ({
      ...item,
      id: item.SK.split("#").slice(1).join("#"),
    }));
  } catch (err) {
    console.error("Error fetching regular messages:", err);
  }

  // If in Geschäftsstelle and viewing INBOX, query each form type partition
  if (isGst && folder === "INBOX") {
    try {
      const results = await Promise.all(
        FORM_TYPES.map(ft => ddb.send(new QueryCommand({
          TableName: process.env.TABLE_NAME,
          KeyConditionExpression: "PK = :pk",
          ExpressionAttributeValues: { ":pk": `FORM#${ft}` }
        })))
      );

      const formMessages = results.flatMap(r =>
        (r.Items || []).map(f => ({
          id: f.SK,
          from: f.submittedBy,
          to: "Geschäftsstelle",
          subject: `Einreichung: ${f.formType}`,
          body: `Neue Formular-Einreichung vom Typ ${f.formType}.`,
          sentAt: f.createdAt,
          type: "SUBMISSION",
          formType: f.formType,
          pdfKeys: f.pdfKeys,
          formData: f.formData
        }))
      );

      items = [...items, ...formMessages].sort((a, b) => b.sentAt.localeCompare(a.sentAt));
    } catch (err) {
      console.error("Error querying form submissions:", err);
    }
  }

  return { statusCode: 200, body: JSON.stringify(items) };
};
