const ALLOWED_ORIGINS = [
  process.env.PROD_DOMAIN,
  `http://localhost:${process.env.LOCAL_PORT}`,
];

exports.handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || "";
  const isLocal = origin.includes("localhost");
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  const headers = {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      cognitoDomain: process.env.COGNITO_DOMAIN,
      clientId: isLocal ? process.env.LOCALHOST_CLIENT_ID : process.env.PRODUCTION_CLIENT_ID,
      redirectUri: isLocal
        ? `http://localhost:${process.env.LOCAL_PORT}/callback`
        : `${process.env.PROD_DOMAIN}/callback`,
      logoutUri: isLocal
        ? `http://localhost:${process.env.LOCAL_PORT}`
        : process.env.PROD_DOMAIN,
    }),
  };
};
