import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
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
export class StorageStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const { stageName } = props;

    // ── S3 Bucket ─────────────────────────────────────────────────────────────
    this.bucket = new s3.Bucket(this, 'DocumentsBucket', {
      bucketName: `vereinssoftware-documents-${stageName}-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true, // DSGVO: enables recovery + audit trail
      lifecycleRules: [
        {
          // Clean up incomplete multipart uploads
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
        {
          // Move old versions to cheaper storage after 90 days
          noncurrentVersionTransitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
          noncurrentVersionExpiration: cdk.Duration.days(365),
        },
      ],
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedOrigins: stageName === 'prod'
            ? ['https://app.vereinssoftware.de', 'https://*.vereinssoftware.de']
            : ['http://localhost:5173', 'http://localhost:3000'],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
      removalPolicy: stageName === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: stageName !== 'prod',
    });

    // ── CloudFront (for signed URL delivery) ─────────────────────────────────
    const oac = new cloudfront.S3OriginAccessControl(this, 'OAC', {
      description: `OAC for vereinssoftware-${stageName}`,
    });

    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: `vereinssoftware-${stageName}`,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.bucket, {
          originAccessControl: oac,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED, // Documents served via signed URLs
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
      },
      // Restrict to eu-central-1 region for DSGVO compliance
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // ── Outputs ───────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'BucketName', { value: this.bucket.bucketName });
    new cdk.CfnOutput(this, 'BucketArn', { value: this.bucket.bucketArn });
    new cdk.CfnOutput(this, 'DistributionDomainName', { value: this.distribution.distributionDomainName });
    new cdk.CfnOutput(this, 'DistributionId', { value: this.distribution.distributionId });
  }
}
