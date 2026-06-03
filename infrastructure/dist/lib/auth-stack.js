"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const cognito = __importStar(require("aws-cdk-lib/aws-cognito"));
/**
 * AuthStack: Shared Cognito User Pool for all tenants.
 *
 * Design:
 * - Single shared pool (cheaper, scales better than per-tenant pools)
 * - Tenant isolation via custom:tenant_id attribute
 * - PKCE flow for frontend (no client secret)
 * - custom:roles stores JSON array of role types
 */
class AuthStack extends cdk.Stack {
    userPool;
    userPoolClient;
    constructor(scope, id, props) {
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
exports.AuthStack = AuthStack;
//# sourceMappingURL=auth-stack.js.map