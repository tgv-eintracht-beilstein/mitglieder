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
exports.DatabaseStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
/**
 * DatabaseStack: Multi-tenant DynamoDB tables for Vereinssoftware.
 *
 * Design principles:
 * - Multi-table design for clear boundaries and simpler access patterns
 * - All PKs prefixed with TENANT#<id> to enforce tenant isolation
 * - PITR enabled on all tables for disaster recovery
 * - PAY_PER_REQUEST billing (no capacity planning needed)
 */
class DatabaseStack extends cdk.Stack {
    /** Verein Stammdaten + Subscription-Status */
    tenantsTable;
    /** Mitglieder eines Vereins */
    membersTable;
    /** Vereinsstruktur (Abteilungen, Teams) */
    structureTable;
    /** Veranstaltungen */
    eventsTable;
    /** Dokument-Metadaten */
    documentsTable;
    /** Rollen & Berechtigungen */
    authTable;
    constructor(scope, id, props) {
        super(scope, id, props);
        const { stageName } = props;
        // ── Tenants ──────────────────────────────────────────────────────────────
        // PK: TENANT#<id>  SK: META
        this.tenantsTable = new dynamodb.Table(this, 'TenantsTable', {
            tableName: `vereinssoftware-tenants-${stageName}`,
            partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
            removalPolicy: stageName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
        });
        // GSI: slug → tenant lookup (for subdomain routing)
        this.tenantsTable.addGlobalSecondaryIndex({
            indexName: 'TenantsBySlug',
            partitionKey: { name: 'slug', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });
        // ── Members ───────────────────────────────────────────────────────────────
        // PK: TENANT#<vereinId>#MEMBER#<id>  SK: PROFILE | MEMBERSHIP#<timestamp>
        this.membersTable = new dynamodb.Table(this, 'MembersTable', {
            tableName: `vereinssoftware-members-${stageName}`,
            partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
            removalPolicy: stageName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
        });
        // GSI: email uniqueness check per tenant
        // PK: TENANT#<vereinId>#EMAIL#<email>
        this.membersTable.addGlobalSecondaryIndex({
            indexName: 'MembersByEmail',
            partitionKey: { name: 'emailKey', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.KEYS_ONLY,
        });
        // GSI: list members by department
        // PK: TENANT#<vereinId>#DEPT#<abteilungId>  SK: MEMBER#<id>
        this.membersTable.addGlobalSecondaryIndex({
            indexName: 'MembersByDept',
            partitionKey: { name: 'deptKey', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'memberSortKey', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });
        // GSI: Cognito sub → member lookup (for auth flows)
        // PK: AUTH#<cognitoSub>  SK: TENANT#<vereinId>
        this.membersTable.addGlobalSecondaryIndex({
            indexName: 'UserByAuth',
            partitionKey: { name: 'authKey', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'tenantKey', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });
        // ── Structure ─────────────────────────────────────────────────────────────
        // PK: TENANT#<vereinId>#DEPT#<abteilungId>  SK: META | TEAM#<teamId>
        this.structureTable = new dynamodb.Table(this, 'StructureTable', {
            tableName: `vereinssoftware-structure-${stageName}`,
            partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
            removalPolicy: stageName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
        });
        // GSI: list all departments/teams for a tenant
        // PK: TENANT#<vereinId>  SK: DEPT#<abteilungId> | TEAM#<teamId>
        this.structureTable.addGlobalSecondaryIndex({
            indexName: 'StructureByTenant',
            partitionKey: { name: 'tenantId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'structureSortKey', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });
        // ── Events ────────────────────────────────────────────────────────────────
        // PK: TENANT#<vereinId>#EVENT#<id>  SK: META | GUEST#<memberId>
        this.eventsTable = new dynamodb.Table(this, 'EventsTable', {
            tableName: `vereinssoftware-events-${stageName}`,
            partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
            removalPolicy: stageName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
        });
        // GSI: calendar queries — events by date range for a tenant
        // PK: TENANT#<vereinId>  SK: DATE#<isoDate>#EVENT#<id>
        this.eventsTable.addGlobalSecondaryIndex({
            indexName: 'EventsByDate',
            partitionKey: { name: 'tenantId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'dateSortKey', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });
        // ── Documents ─────────────────────────────────────────────────────────────
        // PK: TENANT#<vereinId>#DOC#<id>  SK: META
        this.documentsTable = new dynamodb.Table(this, 'DocumentsTable', {
            tableName: `vereinssoftware-documents-${stageName}`,
            partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
            removalPolicy: stageName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
        });
        // GSI: list documents by tenant + visibility
        // PK: TENANT#<vereinId>  SK: VISIBILITY#<level>#DOC#<id>
        this.documentsTable.addGlobalSecondaryIndex({
            indexName: 'DocumentsByTenant',
            partitionKey: { name: 'tenantId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'visibilitySortKey', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });
        // ── Auth (Roles & Permissions) ────────────────────────────────────────────
        // PK: TENANT#<vereinId>#ROLE#<roleId>  SK: META | PERMISSION#<resource>
        this.authTable = new dynamodb.Table(this, 'AuthTable', {
            tableName: `vereinssoftware-auth-${stageName}`,
            partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
            removalPolicy: stageName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
        });
        // GSI: roles by user (find all roles assigned to a Cognito user)
        // PK: TENANT#<vereinId>#USER#<cognitoSub>  SK: ROLE#<roleId>
        this.authTable.addGlobalSecondaryIndex({
            indexName: 'RolesByUser',
            partitionKey: { name: 'userRoleKey', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'roleSortKey', type: dynamodb.AttributeType.STRING },
            projectionType: dynamodb.ProjectionType.ALL,
        });
        // ── Outputs ───────────────────────────────────────────────────────────────
        new cdk.CfnOutput(this, 'TenantsTableName', { value: this.tenantsTable.tableName });
        new cdk.CfnOutput(this, 'MembersTableName', { value: this.membersTable.tableName });
        new cdk.CfnOutput(this, 'StructureTableName', { value: this.structureTable.tableName });
        new cdk.CfnOutput(this, 'EventsTableName', { value: this.eventsTable.tableName });
        new cdk.CfnOutput(this, 'DocumentsTableName', { value: this.documentsTable.tableName });
        new cdk.CfnOutput(this, 'AuthTableName', { value: this.authTable.tableName });
    }
}
exports.DatabaseStack = DatabaseStack;
//# sourceMappingURL=database-stack.js.map