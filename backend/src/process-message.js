const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient());

exports.handler = async (event) => {
  const message = event.detail;
  const { id, to } = message;

  if (!to || !id) {
    console.error("Invalid message event detail:", message);
    return;
  }

  // Put in recipient's inbox
  await ddb.send(new PutCommand({
    TableName: process.env.TABLE_NAME,
    Item: { 
      PK: `MAIL#${to}`, 
      SK: `INBOX#${id}`, 
      ...message,
      read: false
    },
  }));

  console.log(`Processed message ${id} for recipient ${to}`);
};
