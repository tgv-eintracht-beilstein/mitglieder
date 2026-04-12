const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { QueryCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient());

exports.handler = async (event) => {
  const groups = event.requestContext?.authorizer?.jwt?.claims?.["cognito:groups"] || [];
  const isGeschäftstelle = groups.includes("geschäftsstelle") || groups.includes("tgv-geschaeftsstelle");
  
  if (!isGeschäftstelle) {
    return { statusCode: 403, body: JSON.stringify({ error: "Forbidden: Only for geschäftsstelle" }) };
  }

  const { formType } = event.queryStringParameters || {};
  
  let params = {
    TableName: process.env.TABLE_NAME,
  };

  if (formType) {
    params.KeyConditionExpression = "PK = :pk";
    params.ExpressionAttributeValues = { ":pk": `FORM#${formType}` };
    const data = await ddb.send(new QueryCommand(params));
    return { statusCode: 200, body: JSON.stringify(data.Items) };
  } else {
    // We need to list all submissions. Since PK is FORM#<type>, we might need a GSI or just scan for now if the table is small.
    // Or we can query for known form types if they are few.
    // Let's assume we want to see all forms.
    const { ScanCommand } = require("@aws-sdk/lib-dynamodb");
    const data = await ddb.send(new ScanCommand({
      TableName: process.env.TABLE_NAME,
      FilterExpression: "begins_with(PK, :prefix)",
      ExpressionAttributeValues: { ":prefix": "FORM#" }
    }));
    return { statusCode: 200, body: JSON.stringify(data.Items) };
  }
};
