const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { EventBridgeClient, PutEventsCommand } = require("@aws-sdk/client-eventbridge");
const { CognitoIdentityProviderClient, ListUsersInGroupCommand } = require("@aws-sdk/client-cognito-identity-provider");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient());
const eb = new EventBridgeClient();
const cognito = new CognitoIdentityProviderClient();

exports.handler = async (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims || {};
  const senderSub = claims.sub;
  const senderEmail = claims.email || senderSub;
  const userPoolId = process.env.USER_POOL_ID;
  
  if (!senderSub) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };

  const { recipientEmail, subject, body } = JSON.parse(event.body || "{}");
  
  if (!recipientEmail || !subject || !body) {
    return { statusCode: 400, body: JSON.stringify({ error: "recipientEmail, subject, and body required" }) };
  }

  const now = new Date().toISOString();
  const msgId = `${now}#${crypto.randomUUID()}`;

  // Determine recipients
  let recipients = [recipientEmail];
  let isGroup = false;

  try {
    const groupUsers = await cognito.send(new ListUsersInGroupCommand({
      UserPoolId: userPoolId,
      GroupName: recipientEmail
    }));
    if (groupUsers.Users && groupUsers.Users.length > 0) {
      recipients = groupUsers.Users.map(u => {
        const emailAttr = u.Attributes.find(a => a.Name === "email");
        return emailAttr ? emailAttr.Value : u.Username;
      }).filter(Boolean);
      isGroup = true;
    }
  } catch (err) {
    // If group doesn't exist or other error, assume it's a single email recipient
  }

  const baseMessage = {
    id: msgId,
    from: senderEmail,
    subject,
    body,
    sentAt: now,
    type: "MESSAGE",
    to: isGroup ? `Gruppe: ${recipientEmail}` : recipientEmail
  };

  const actions = [
    // Put in sender's sent folder once
    ddb.send(new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: { 
        PK: `MAIL#${senderEmail}`, 
        SK: `SENT#${msgId}`, 
        ...baseMessage
      },
    }))
  ];

  // For each recipient, emit an event
  recipients.forEach(email => {
    actions.push(eb.send(new PutEventsCommand({
      Entries: [{
        Source: "tgv.mitglieder",
        DetailType: "message.sent",
        Detail: JSON.stringify({ ...baseMessage, to: email })
      }]
    })));
  });

  await Promise.all(actions);

  return { statusCode: 200, body: JSON.stringify({ id: msgId, recipientCount: recipients.length }) };
};
