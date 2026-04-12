const { CognitoIdentityProviderClient, ListUsersCommand, ListGroupsCommand } = require("@aws-sdk/client-cognito-identity-provider");

const cognito = new CognitoIdentityProviderClient();

exports.handler = async (event) => {
  const userPoolId = process.env.USER_POOL_ID;

  const [usersData, groupsData] = await Promise.all([
    cognito.send(new ListUsersCommand({ UserPoolId: userPoolId })),
    cognito.send(new ListGroupsCommand({ UserPoolId: userPoolId }))
  ]);

  const users = usersData.Users.map(u => {
    const attrs = u.Attributes.reduce((acc, a) => ({ ...acc, [a.Name]: a.Value }), {});
    return {
      id: u.Username,
      email: attrs.email || u.Username,
      firstName: attrs.given_name || "",
      lastName: attrs.family_name || "",
      type: "user"
    };
  }).filter(u => u.email);

  const groups = groupsData.Groups.map(g => ({
    id: g.GroupName,
    name: g.GroupName,
    type: "group"
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({ users, groups })
  };
};
