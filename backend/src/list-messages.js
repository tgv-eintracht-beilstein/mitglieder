const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { QueryCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient());

const FORM_TYPES = ["mitglied-werden", "ehrenamtspauschale", "reisekostenabrechnung", "übungsleiterpauschale"];

exports.handler = async (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims || {};
  const email = claims.email || claims.sub;
  const groups = claims["cognito:groups"] || [];

  if (!email) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };

  const { folder } = event.queryStringParameters || {};
  const isGst = groups.includes("geschäftsstelle") || groups.includes("tgv-geschaeftsstelle");

  let items = [];

  const folders = folder ? [folder] : ["INBOX", "SENT"];

  // Fetch regular messages — id is derived from SK (format: FOLDER#<id>)
  try {
    const results = await Promise.all(folders.map(f => ddb.send(new QueryCommand({
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: { ":pk": `MAIL#${email}`, ":sk": `${f}#` },
      ScanIndexForward: false
    }))));
    items = results.flatMap((r, i) => (r.Items || []).map(item => ({
      ...item,
      id: item.SK.split("#").slice(1).join("#"),
      folder: folders[i],
    })));
  } catch (err) {
    console.error("Error fetching regular messages:", err);
  }

  // If in Geschäftsstelle and viewing INBOX, query each form type partition
  if (isGst && folders.includes("INBOX")) {
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
          subject: `Einreichung: ${f.formType.charAt(0).toUpperCase() + f.formType.slice(1)}`,
          body: `Neue Formular-Einreichung vom Typ ${f.formType.charAt(0).toUpperCase() + f.formType.slice(1)}.`,
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
