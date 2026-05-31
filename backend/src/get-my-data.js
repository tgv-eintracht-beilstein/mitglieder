const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

const secrets = new SecretsManagerClient();
const API_BASE = "https://easyverein.com/api/v3.0";

async function getToken() {
  const res = await secrets.send(new GetSecretValueCommand({ SecretId: process.env.EASYVEREIN_SECRET_ARN }));
  return res.SecretString;
}

exports.handler = async (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims || {};
  let email = claims.email;
  if (!email) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };

  // Temporary mapping: Cognito email → easyVerein email
  const EMAIL_MAP = { "ebbo+test@rode.io": "ebbo1983@gmail.com" };
  email = EMAIL_MAP[email] || email;

  const token = await getToken();

  // Find member by email
  const memberRes = await fetch(
    `${API_BASE}/member?email=${encodeURIComponent(email)}&query={id,contact_details{*},join_date,membership_number}&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!memberRes.ok) throw new Error(`easyVerein API error: ${memberRes.status}`);
  const memberData = await memberRes.json();
  const member = (memberData.results || [])[0];
  if (!member) return { statusCode: 404, body: JSON.stringify({ error: "Member not found" }) };

  // Get group assignments (Funktionen)
  const groupsRes = await fetch(
    `${API_BASE}/member-group-assignment?user_object=${member.id}&query={id,member_group{name},start,end}&limit=100`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!groupsRes.ok) throw new Error(`easyVerein API error: ${groupsRes.status}`);
  const groupsData = await groupsRes.json();
  const groups = (groupsData.results || []).map(g => ({
    name: g.member_group?.name || "",
    start: g.start || null,
    end: g.end || null,
  }));

  const cd = member.contact_details || {};

  return {
    statusCode: 200,
    body: JSON.stringify({
      contactDetails: {
        first_name: cd.first_name || "",
        family_name: cd.family_name || "",
        street: cd.street || "",
        zip: cd.zip || "",
        city: cd.city || "",
        phone_mobile: cd.phone_mobile || "",
        date_of_birth: cd.date_of_birth || null,
      },
      joinDate: member.join_date,
      membershipNumber: member.membership_number,
      groups,
    }),
  };
};
