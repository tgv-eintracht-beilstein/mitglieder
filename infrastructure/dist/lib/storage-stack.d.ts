import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';
export interface StorageStackProps extends cdk.StackProps {
    readonly stageName: string;
}
/**
 * StorageStack: S3 bucket for tenant documents/images + CloudFront distribution.
 *
 * Object key convention: <tenantId>/<category>/<objectId>/<filename>
 * This prefix structure allows per-tenant IAM conditions for strict isolation.
 */
export declare class StorageStack extends cdk.Stack {
    readonly bucket: s3.Bucket;
    readonly distribution: cloudfront.Distribution;
    constructor(scope: Construct, id: string, props: StorageStackProps);
}
//# sourceMappingURL=storage-stack.d.ts.map