#!/usr/bin/env node
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
const cdk = __importStar(require("aws-cdk-lib"));
const auth_stack_1 = require("../lib/auth-stack");
const database_stack_1 = require("../lib/database-stack");
const storage_stack_1 = require("../lib/storage-stack");
const environments = {
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
const envConfig = environments[targetEnv] ?? environments['dev'];
const env = {
    account: envConfig.account,
    region: envConfig.region,
};
const { stageName } = envConfig;
const authStack = new auth_stack_1.AuthStack(app, `Vereinssoftware-Auth-${stageName}`, { env, stageName });
const dbStack = new database_stack_1.DatabaseStack(app, `Vereinssoftware-Database-${stageName}`, { env, stageName });
const storageStack = new storage_stack_1.StorageStack(app, `Vereinssoftware-Storage-${stageName}`, { env, stageName });
// ApiStack and MonitoringStack will be added in subsequent tasks
// (they depend on authStack.userPool and dbStack tables)
void authStack;
void dbStack;
void storageStack;
app.synth();
//# sourceMappingURL=app.js.map