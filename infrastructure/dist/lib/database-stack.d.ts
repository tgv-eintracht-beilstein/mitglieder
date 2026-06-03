import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
export interface DatabaseStackProps extends cdk.StackProps {
    readonly stageName: string;
}
/**
 * DatabaseStack: Multi-tenant DynamoDB tables for Vereinssoftware.
 *
 * Design principles:
 * - Multi-table design for clear boundaries and simpler access patterns
 * - All PKs prefixed with TENANT#<id> to enforce tenant isolation
 * - PITR enabled on all tables for disaster recovery
 * - PAY_PER_REQUEST billing (no capacity planning needed)
 */
export declare class DatabaseStack extends cdk.Stack {
    /** Verein Stammdaten + Subscription-Status */
    readonly tenantsTable: dynamodb.Table;
    /** Mitglieder eines Vereins */
    readonly membersTable: dynamodb.Table;
    /** Vereinsstruktur (Abteilungen, Teams) */
    readonly structureTable: dynamodb.Table;
    /** Veranstaltungen */
    readonly eventsTable: dynamodb.Table;
    /** Dokument-Metadaten */
    readonly documentsTable: dynamodb.Table;
    /** Rollen & Berechtigungen */
    readonly authTable: dynamodb.Table;
    constructor(scope: Construct, id: string, props: DatabaseStackProps);
}
//# sourceMappingURL=database-stack.d.ts.map