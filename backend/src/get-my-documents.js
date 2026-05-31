const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

const secrets = new SecretsManagerClient();
const API_BASE = "https://easyverein.com/api/v3.0";

async function getToken() {
  const res = await secrets.send(new GetSecretValueCommand({ SecretId: process.env.EASYVEREIN_SECRET_ARN }));
  return res.SecretString;
}

// Temporary mapping: Cognito email → easyVerein email
const EMAIL_MAP = { "ebbo+test@rode.io": "tgv@bernhardrode.de" };

exports.handler = async (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims || {};
  let email = claims.email;
  if (!email) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  email = EMAIL_MAP[email] || email;

  const token = await getToken();

  // Find member by email to get membership_number
  const memberRes = await fetch(
    `${API_BASE}/member?email=${encodeURIComponent(email)}&query={id,membership_number}&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!memberRes.ok) throw new Error(`easyVerein API error: ${memberRes.status}`);
  const memberData = await memberRes.json();
  const member = (memberData.results || [])[0];
  if (!member || !member.membership_number) {
    return { statusCode: 200, body: JSON.stringify({ files: [] }) };
  }

  // List files under /Mitgliederdokumente/<membership_number>
  const path = `/Mitgliederdokumente/${member.membership_number}`;
  const filesRes = await fetch(
    `${API_BASE}/file-system-path?path=${encodeURIComponent(path)}&query={id,path,related_file_storage{id,name,file,size,date}}&limit=100`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!filesRes.ok) {
    // 404 or no folder = no files
    return { statusCode: 200, body: JSON.stringify({ files: [] }) };
  }
  const filesData = await filesRes.json();
  const results = filesData.results || [];

  // Extract files from the path entries
  const files = [];
  for (const entry of results) {
    const storage = entry.related_file_storage;
    if (storage && Array.isArray(storage)) {
      for (const f of storage) {
        files.push({ name: f.name || "", url: f.file || "", size: f.size || 0, date: f.date || null });
      }
    } else if (storage && storage.file) {
      files.push({ name: storage.name || "", url: storage.file || "", size: storage.size || 0, date: storage.date || null });
    }
  }

  return { statusCode: 200, body: JSON.stringify({ files, membershipNumber: member.membership_number }) };
};
