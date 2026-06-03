#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AuthStack } from '../lib/auth-stack';
import { DatabaseStack } from '../lib/database-stack';
import { StorageStack } from '../lib/storage-stack';

/**
 * Environment configuration for the Vereinssoftware platform.
 * All resources are deployed to eu-central-1 (Frankfurt) for DSGVO compliance.
 */
interface EnvironmentConfig {
  readonly account?: string;
  readonly region: string;
  readonly stageName: string;
}

const environments: Record<string, EnvironmentConfig> = {
  dev: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'eu-central-1',
    stageName: 'dev',
  },
  staging: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'eu-central-1',
    stageName: 'staging',
  },
  prod: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'eu-central-1',
    stageName: 'prod',
  },
};

const app = new cdk.App();

const targetEnv = app.node.tryGetContext('env') || 'dev';
const envConfig = environments[targetEnv] ?? environments['dev']!;

const env: cdk.Environment = {
  account: envConfig.account,
  region: envConfig.region,
};

const { stageName } = envConfig;

const authStack = new AuthStack(app, `Vereinssoftware-Auth-${stageName}`, { env, stageName });
const dbStack = new DatabaseStack(app, `Vereinssoftware-Database-${stageName}`, { env, stageName });
const storageStack = new StorageStack(app, `Vereinssoftware-Storage-${stageName}`, { env, stageName });

// ApiStack and MonitoringStack will be added in subsequent tasks
// (they depend on authStack.userPool and dbStack tables)
void authStack;
void dbStack;
void storageStack;

app.synth();
