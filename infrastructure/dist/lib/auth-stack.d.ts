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
export declare class AuthStack extends cdk.Stack {
    readonly userPool: cognito.UserPool;
    readonly userPoolClient: cognito.UserPoolClient;
    constructor(scope: Construct, id: string, props: AuthStackProps);
}
//# sourceMappingURL=auth-stack.d.ts.map