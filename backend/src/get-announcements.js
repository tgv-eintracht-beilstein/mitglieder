const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

const secrets = new SecretsManagerClient();
const API_BASE = "https://easyverein.com/api/v3.0";

async function getToken() {
  const res = await secrets.send(new GetSecretValueCommand({ SecretId: process.env.EASYVEREIN_SECRET_ARN }));
  return res.SecretString;
}

async function fetchMembers(token, params) {
  const url = `${API_BASE}/member?${params}&query={contact_details{first_name,family_name,date_of_birth},join_date}&limit=100`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`easyVerein API error: ${res.status}`);
  const data = await res.json();
  return data.results || [];
}

function getDepartments(m) {
  return (m.member_groups || []).map(g => g.name).filter(Boolean);
}

exports.handler = async () => {
  const token = await getToken();

  const [upcoming, past, anniversaries] = await Promise.all([
    fetchMembers(token, "show_only_upcoming_birthdays=true"),
    fetchMembers(token, "show_only_past_birthdays=true"),
    fetchMembers(token, "show_only_upcoming_anniversaries=true"),
  ]);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentYear = now.getFullYear();

  function daysFromToday(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const thisYear = new Date(currentYear, d.getMonth(), d.getDate());
    return Math.round((thisYear - today) / 86400000);
  }

  function age(dateStr) {
    if (!dateStr) return null;
    return currentYear - new Date(dateStr).getFullYear();
  }

  function formatBirthdayText(daysFromToday, age) {
    if (daysFromToday === 0) return `wird heute ${age}`;
    if (daysFromToday === 1) return `wird morgen ${age}`;
    if (daysFromToday > 0) return `wird in ${daysFromToday} Tagen ${age}`;
    const abs = Math.abs(daysFromToday);
    return `wurde vor ${abs} ${abs === 1 ? "Tag" : "Tagen"} ${age}`;
  }

  function formatAnniversaryText(years) {
    return `${years} Jahre Mitglied`;
  }

  const mapBirthday = (m) => {
    const cd = m.contact_details || {};
    const dob = cd.date_of_birth || null;
    const d = daysFromToday(dob);
    const a = age(dob);
    return {
      name: `${cd.first_name || ""} ${(cd.family_name || "").charAt(0)}.`,
      text: formatBirthdayText(d, a),
      departments: getDepartments(m),
    };
  };

  const anniversaryList = anniversaries.map(m => {
    const cd = m.contact_details || {};
    const joinDate = m.join_date || null;
    const years = joinDate ? currentYear - new Date(joinDate).getFullYear() : null;
    return {
      name: `${cd.first_name || ""} ${(cd.family_name || "").charAt(0)}.`,
      text: formatAnniversaryText(years),
      departments: getDepartments(m),
    };
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      upcomingBirthdays: upcoming.map(mapBirthday),
      pastBirthdays: past.map(mapBirthday),
      anniversaries: anniversaryList,
    }),
  };
};
