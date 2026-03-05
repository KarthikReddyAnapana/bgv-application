#!/usr/bin/env node

/**
 * Master deployment orchestrator for BGV Application
 * 
 * Usage:
 *   node deploy.js --stage <dev|prod> --profile <AWS_PROFILE> [--firstDeploy] [--backend-only]
 * 
 * Examples:
 *   node deploy.js --stage dev --profile myprofile --firstDeploy
 *   node deploy.js --stage dev --profile myprofile
 *   node deploy.js --stage prod --profile myprofile --backend-only
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ============================================================================
// Configuration & Argument Parsing
// ============================================================================

function parseArgs() {
    const args = process.argv.slice(2);
    const opts = {
        stage: null,
        profile: null,
        firstDeploy: false,
        'backend-only': false,
        'skip-build': false,
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--stage' && i + 1 < args.length) {
            opts.stage = args[++i];
        } else if (arg === '--profile' && i + 1 < args.length) {
            opts.profile = args[++i];
        } else if (arg === '--firstDeploy') {
            opts.firstDeploy = true;
        } else if (arg === '--backend-only') {
            opts['backend-only'] = true;
        } else if (arg === '--skip-build') {
            opts['skip-build'] = true;
        }
    }

    // Validate required inputs
    if (!opts.stage || !opts.profile) {
        console.error('\n❌ ERROR: Missing required arguments\n');
        console.log('Usage:');
        console.log('  node deploy.js --stage <dev|prod> --profile <AWS_PROFILE> [--firstDeploy] [--backend-only]\n');
        console.log('Examples:');
        console.log('  node deploy.js --stage dev --profile myprofile --firstDeploy');
        console.log('  node deploy.js --stage dev --profile myprofile\n');
        process.exit(1);
    }

    if (opts.stage !== 'dev' && opts.stage !== 'prod') {
        console.error('\n❌ ERROR: Invalid stage. Must be "dev" or "prod"\n');
        process.exit(1);
    }

    return opts;
}

// ============================================================================
// Helper Functions
// ============================================================================

function log(title, message = '') {
    console.log('\n' + '='.repeat(50));
    console.log(`  ${title}`);
    console.log('='.repeat(50));
    if (message) console.log(message);
    console.log();
}

function logSection(step, title) {
    console.log(`\n[${step}] ${title}`);
    console.log('-'.repeat(40));
}

function run(command, description) {
    try {
        console.log(`  Running: ${description}`);
        execSync(command, { stdio: 'inherit', shell: true });
        console.log(`  ✓ ${description} completed\n`);
        return true;
    } catch (error) {
        console.error(`\n  ✗ ${description} failed with exit code ${error.status}\n`);
        return false;
    }
}

function getCdkStackName(stage) {
    return `BgvServerless${stage.charAt(0).toUpperCase()}${stage.slice(1)}Stack`;
}

function ensureAwsCliOnPath() {
    try {
        execSync('aws --version', { stdio: 'ignore', shell: true });
        return;
    } catch {
        const candidates = [
            'C:\\Program Files\\Amazon\\AWSCLIV2\\aws.exe',
            'C:\\Program Files (x86)\\Amazon\\AWSCLI\\bin\\aws.exe'
        ];

        const found = candidates.find(fs.existsSync);
        if (!found) {
            return;
        }

        const awsDir = path.dirname(found);
        const currentPath = process.env.PATH || '';
        const alreadyPresent = currentPath
            .toLowerCase()
            .split(';')
            .includes(awsDir.toLowerCase());

        if (!alreadyPresent) {
            process.env.PATH = `${awsDir};${currentPath}`;
            console.log(`  Auto-detected AWS CLI at: ${found}`);
        }
    }
}

// ============================================================================
// Main Deployment Orchestration
// ============================================================================

function main() {
    const opts = parseArgs();
    const stackName = getCdkStackName(opts.stage);

    ensureAwsCliOnPath();

    log(`BGV Application Deployment`, `Stage: ${opts.stage.toUpperCase()}\nProfile: ${opts.profile}`);

    // ========================================================================
    // Step 1: Validate Environment
    // ========================================================================
    logSection('1', 'Validating Environment');
    if (!run(`call scripts\\validate-environment.cmd ${opts.profile}`, 'Environment validation')) {
        log('DEPLOYMENT FAILED', 'Environment validation failed');
        process.exit(1);
    }

    // ========================================================================
    // Step 2: Deploy Backend (Infrastructure + Lambda)
    // ========================================================================
    logSection('2', 'Deploying Backend Infrastructure');
    const skipBuildFlag = opts['skip-build'] ? '--skip-build' : '';
    if (!run(
        `call scripts\\deploy-backend.cmd ${opts.stage} ${opts.profile} ${skipBuildFlag}`,
        'Backend deployment'
    )) {
        log('DEPLOYMENT FAILED', 'Backend deployment failed');
        process.exit(1);
    }

    // ========================================================================
    // Step 3: First-Deploy Configuration (if --firstDeploy flag)
    // ========================================================================
    if (opts.firstDeploy) {
        logSection('3', 'Configuring First-Deploy Steps');

        // Step 3a: Configure Lambda Environment Variables
        if (!run(
            `call scripts\\configure-lambda-env-vars.cmd ${opts.stage} ${opts.profile}`,
            'Lambda environment configuration'
        )) {
            console.log('  ⚠ Warning: Lambda env config had issues, but continuing\n');
        }

        // Step 3b: Initialize OpenSearch (if needed)
        if (!run(
            `call scripts\\initialize-opensearch-indices.cmd ${opts.stage} ${opts.profile}`,
            'OpenSearch initialization'
        )) {
            console.log('  ⚠ Warning: OpenSearch init skipped (not configured for this project)\n');
        }

        // Step 3c: Configure S3 CORS
        if (!run(
            `call scripts\\configure-s3-cors.cmd ${opts.stage} ${opts.profile}`,
            'S3 CORS configuration'
        )) {
            console.log('  ⚠ Warning: S3 CORS config may have failed, but continuing\n');
        }

        // Step 3d: Configure Cognito (if needed)
        if (!run(
            `call scripts\\configure-cognito-urls.cmd ${opts.stage} ${opts.profile}`,
            'Cognito configuration'
        )) {
            console.log('  ⚠ Warning: Cognito config skipped (not configured for this project)\n');
        }

        console.log();
    }

    // ========================================================================
    // Step 4: Deploy Frontend (unless --backend-only)
    // ========================================================================
    if (!opts['backend-only']) {
        logSection('5', 'Fetching CloudFormation Outputs');
        
        // Query CloudFormation for stack outputs
        let s3Bucket = null;
        let distributionId = null;
        try {
            const output = execSync(
                `aws cloudformation describe-stacks --stack-name ${stackName} --profile ${opts.profile} --query "Stacks[0].Outputs" --output json 2>nul`,
                { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
            );
            const outputs = JSON.parse(output);
            outputs.forEach(o => {
                if (o.OutputKey === 'FrontendBucketName') s3Bucket = o.OutputValue;
                if (o.OutputKey === 'CloudFrontDistributionId') distributionId = o.OutputValue;
            });
        } catch (e) {
            console.log('  ⚠ Warning: Could not retrieve CloudFormation outputs');
            console.log('  Proceed with manual S3 bucket name if available\n');
        }

        if (s3Bucket) {
            console.log(`  ✓ S3 Bucket: ${s3Bucket}`);
            if (distributionId) console.log(`  ✓ CloudFront Distribution: ${distributionId}`);
            console.log();

            logSection('6', 'Deploying Frontend');
            const distFlag = distributionId ? ` ${distributionId}` : '';
            if (!run(
                `call scripts\\deploy-frontend.cmd ${opts.stage} ${opts.profile} ${s3Bucket}${distFlag}`,
                'Frontend deployment'
            )) {
                log('DEPLOYMENT WARNING', 'Frontend deployment had issues, but infrastructure may be OK');
            }
        } else {
            console.log('  ⚠ Could not auto-detect S3 bucket from CloudFormation');
            console.log('  Please provide S3 bucket name and run frontend deployment manually:\n');
            console.log(`    call scripts\\deploy-frontend.cmd ${opts.stage} ${opts.profile} <S3_BUCKET> [DISTRIBUTION_ID]\n`);
        }
    } else {
        logSection('5', 'Skipping Frontend Deployment (--backend-only mode)');
    }

    // ========================================================================
    // Deployment Complete
    // ========================================================================
    log('DEPLOYMENT SUCCESSFUL', `
Stack: ${stackName}
Stage: ${opts.stage.toUpperCase()}
Profile: ${opts.profile}

Next Steps:
  1. Verify API Gateway endpoint is active
  2. Run smoke tests (GET /api/bgv-requests, POST, etc.)
  3. Verify frontend loads via CloudFront distribution domain
  4. Test login and role-based navigation
    `);
}

// ============================================================================
// Run Main
// ============================================================================

if (require.main === module) {
    try {
        main();
    } catch (error) {
        console.error('\n❌ Deployment failed:', error.message, '\n');
        process.exit(1);
    }
}

module.exports = { parseArgs, getCdkStackName };
