import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export interface AuthStackProps extends cdk.StackProps {
  readonly stageName: string;
}

/**
 * AuthStack: Shared Cognito User Pool for all tenants.
 *
 * Design:
 * - Single shared pool (cheaper, scales better than per-tenant pools)
 * - Tenant isolation via custom:tenant_id attribute
 * - PKCE flow for frontend (no client secret)
 * - custom:roles stores JSON array of role types
 */
export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    const { stageName } = props;

    // ── User Pool ─────────────────────────────────────────────────────────────
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `vereinssoftware-${stageName}`,
      selfSignUpEnabled: false, // Admins create users; self-signup via /register endpoint
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        givenName: { required: false, mutable: true },
        familyName: { required: false, mutable: true },
      },
      customAttributes: {
        // Tenant the user belongs to (set at registration, immutable)
        tenant_id: new cognito.StringAttribute({ mutable: false }),
        // JSON array of role types, e.g. ["superadmin"] or ["abteilungsleiter","teamleiter"]
        roles: new cognito.StringAttribute({ maxLen: 2048, mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false, // Vereins-Ehrenamtliche as target group
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      email: cognito.UserPoolEmail.withCognito(),
      removalPolicy: stageName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // ── App Client (PKCE, no secret) ──────────────────────────────────────────
    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: `vereinssoftware-frontend-${stageName}`,
      generateSecret: false, // SPA — no client secret
      authFlows: {
        userSrp: true,
        userPassword: false, // SRP only, never plaintext password
      },
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: stageName === 'prod'
          ? ['https://app.vereinssoftware.de/callback']
          : ['http://localhost:5173/callback', 'http://localhost:3000/callback'],
        logoutUrls: stageName === 'prod'
          ? ['https://app.vereinssoftware.de']
          : ['http://localhost:5173', 'http://localhost:3000'],
      },
      readAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({ email: true, givenName: true, familyName: true })
        .withCustomAttributes('tenant_id', 'roles'),
      writeAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({ email: true, givenName: true, familyName: true }),
      // Tokens: access 1h, id 1h, refresh 30d
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
    });

    // ── Outputs ───────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'UserPoolId', { value: this.userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolArn', { value: this.userPool.userPoolArn });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: this.userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, 'CognitoIssuer', {
      value: `https://cognito-idp.${this.region}.amazonaws.com/${this.userPool.userPoolId}`,
    });
  }
}
