const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { QueryCommand, ScanCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient());

exports.handler = async (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims || {};
  const email = claims.email || claims.sub;
  const groups = claims["cognito:groups"] || [];
  
  console.log("Fetching messages for:", email, "Groups:", groups);

  if (!email) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };

  const { folder = "INBOX" } = event.queryStringParameters || {};
  
  const isGst = groups.includes("geschäftsstelle") || groups.includes("tgv-geschaeftsstelle");
  
  let items = [];

  // Fetch regular messages
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
    items = msgData.Items || [];
    console.log(`Found ${items.length} regular messages`);
  } catch (err) {
    console.error("Error fetching regular messages:", err);
  }

  // If in Geschäftsstelle and viewing INBOX, also include all form submissions
  if (isGst && folder === "INBOX") {
    try {
      const formData = await ddb.send(new ScanCommand({
        TableName: process.env.TABLE_NAME,
        FilterExpression: "begins_with(PK, :prefix)",
        ExpressionAttributeValues: { ":prefix": "FORM#" }
      }));
      
      const formMessages = (formData.Items || []).map(f => ({
        id: f.id,
        from: f.submittedBy,
        to: "Geschäftsstelle",
        subject: `Einreichung: ${f.formType}`,
        body: `Neue Formular-Einreichung vom Typ ${f.formType}.`,
        sentAt: f.createdAt,
        type: "SUBMISSION",
        pdfKeys: f.pdfKeys,
        formData: f.formData
      }));
      
      console.log(`Found ${formMessages.length} form submissions`);
      items = [...items, ...formMessages].sort((a, b) => b.sentAt.localeCompare(a.sentAt));
    } catch (err) {
      console.error("Error scanning form submissions:", err);
    }
  }

  return { statusCode: 200, body: JSON.stringify(items) };
};
