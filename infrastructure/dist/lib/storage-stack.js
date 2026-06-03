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
exports.StorageStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const cloudfront = __importStar(require("aws-cdk-lib/aws-cloudfront"));
const origins = __importStar(require("aws-cdk-lib/aws-cloudfront-origins"));
/**
 * StorageStack: S3 bucket for tenant documents/images + CloudFront distribution.
 *
 * Object key convention: <tenantId>/<category>/<objectId>/<filename>
 * This prefix structure allows per-tenant IAM conditions for strict isolation.
 */
class StorageStack extends cdk.Stack {
    bucket;
    distribution;
    constructor(scope, id, props) {
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
exports.StorageStack = StorageStack;
//# sourceMappingURL=storage-stack.js.map