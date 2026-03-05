import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as path from 'node:path';

export interface BgvServerlessStackProps extends cdk.StackProps {
  stage: 'dev' | 'prod';
}

export class BgvServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BgvServerlessStackProps) {
    super(scope, id, props);

    const stageContext = this.node.tryGetContext(props.stage) ?? {};
    const stage = props.stage;

    const isProd = stage === 'prod';
    const removalPolicy = isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY;

      // Strict CORS origin check removed to allow deployment without requiring a specific frontend domain.

    const cognitoUserPoolArn = String(stageContext.cognitoUserPoolArn ?? '').trim();
    const sharepointFolderUrl = String(stageContext.sharepointFolderUrl ?? '').trim();
    const sharepointEnabled = String(stageContext.sharepointEnabled ?? 'false').trim().toLowerCase();
    const alarmEmail = String(stageContext.alarmEmail ?? '').trim();
    const api5xxAlarmThreshold = Number(stageContext.api5xxAlarmThreshold ?? (isProd ? 5 : 20));
    const lambdaErrorAlarmThreshold = Number(stageContext.lambdaErrorAlarmThreshold ?? (isProd ? 3 : 10));
    const lambdaThrottleAlarmThreshold = Number(stageContext.lambdaThrottleAlarmThreshold ?? 1);
    const lambdaP95DurationMsThreshold = Number(stageContext.lambdaP95DurationMsThreshold ?? (isProd ? 45000 : 55000));
    const monthlyBudgetUsd = Number(stageContext.monthlyBudgetUsd ?? (isProd ? 100 : 20));
    let defaultMethodOptions: apigateway.MethodOptions | undefined;
    if (isProd) {
      if (!cognitoUserPoolArn) {
        throw new Error(
          'Production requires API authorization. Set context.prod.cognitoUserPoolArn in cdk.json.'
        );
      }

      const userPool = cognito.UserPool.fromUserPoolArn(this, 'BgvProdUserPool', cognitoUserPoolArn);
      const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'BgvApiCognitoAuthorizer', {
        cognitoUserPools: [userPool]
      });

      defaultMethodOptions = {
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizer
      };
    }

    const table = new dynamodb.Table(this, 'BgvRequestsTable', {
      tableName: `bgv-requests-${stage}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: isProd },
      removalPolicy
    });

    const historyTable = new dynamodb.Table(this, 'BgvRequestHistoryTable', {
      tableName: `bgv-request-history-${stage}`,
      partitionKey: { name: 'historyId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: isProd },
      removalPolicy
    });

    const excelRecordsTable = new dynamodb.Table(this, 'BgvExcelUploadRecordsTable', {
      tableName: `bgv-excel-upload-records-${stage}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: isProd },
      removalPolicy
    });

    const excelCellsTable = new dynamodb.Table(this, 'BgvExcelUploadCellsTable', {
      tableName: `bgv-excel-upload-cells-${stage}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: isProd },
      removalPolicy
    });

    table.addGlobalSecondaryIndex({
      indexName: 'psNumber-index',
      partitionKey: { name: 'psNumber', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    table.addGlobalSecondaryIndex({
      indexName: 'status-index',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL
    });

    table.addGlobalSecondaryIndex({
      indexName: 'resourcePsNo-index',
      partitionKey: { name: 'resourcePsNo', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    table.addGlobalSecondaryIndex({
      indexName: 'candidateId-index',
      partitionKey: { name: 'candidateId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    table.addGlobalSecondaryIndex({
      indexName: 'userRole-status-index',
      partitionKey: { name: 'userRole', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    historyTable.addGlobalSecondaryIndex({
      indexName: 'psNumber-index',
      partitionKey: { name: 'psNumber', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    historyTable.addGlobalSecondaryIndex({
      indexName: 'resourcePsNo-index',
      partitionKey: { name: 'resourcePsNo', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    historyTable.addGlobalSecondaryIndex({
      indexName: 'candidateId-index',
      partitionKey: { name: 'candidateId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    historyTable.addGlobalSecondaryIndex({
      indexName: 'bgvRequestId-index',
      partitionKey: { name: 'bgvRequestId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });

    excelRecordsTable.addGlobalSecondaryIndex({
      indexName: 'uploadBatchId-index',
      partitionKey: { name: 'uploadBatchId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sourceRowNumber', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL
    });

    excelCellsTable.addGlobalSecondaryIndex({
      indexName: 'uploadBatchId-index',
      partitionKey: { name: 'uploadBatchId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sourceRowNumber', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL
    });

    const commonEnv = {
      // Spring Boot property names (use dots, not underscores)
      'dynamodb.table.bgvRequests': table.tableName,
      'dynamodb.table.bgvRequestHistory': historyTable.tableName,
      'dynamodb.table.bgvExcelUploadRecords': excelRecordsTable.tableName,
      'dynamodb.table.bgvExcelUploadCells': excelCellsTable.tableName,
      // Do NOT set dynamodb.endpoint - let AWS SDK use default
      'aws.region': this.region,
      'sharepoint.folder.url': sharepointFolderUrl,
      'sharepoint.enabled': sharepointEnabled,
      'opensearch.enabled': 'false',
      JAVA_TOOL_OPTIONS: '-XX:+TieredCompilation -XX:TieredStopAtLevel=1',
      STAGE: stage
    };

    const apiLogGroup = new logs.LogGroup(this, 'BgvApiLogGroup', {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy
    });

    // Path to the Java Lambda JAR (built by Maven)
    const jarPath = path.join(__dirname, '../../../backend/target/bgv-lambda.jar');

    const bgvApiHandler = new lambda.Function(this, 'BgvApiHandler', {
      functionName: `bgv-api-${stage}`,
      runtime: lambda.Runtime.JAVA_21,
      architecture: lambda.Architecture.ARM_64,
      code: lambda.Code.fromAsset(jarPath),
      handler: 'com.bgv.application.lambda.StreamLambdaHandler::handleRequest',
      timeout: cdk.Duration.seconds(60),
      memorySize: 1536,
      logGroup: apiLogGroup,
      environment: commonEnv,
      snapStart: lambda.SnapStartConf.ON_PUBLISHED_VERSIONS
    });

    table.grantReadWriteData(bgvApiHandler);
    historyTable.grantReadWriteData(bgvApiHandler);
    excelRecordsTable.grantReadWriteData(bgvApiHandler);
    excelCellsTable.grantReadWriteData(bgvApiHandler);

    const api = new apigateway.RestApi(this, 'BgvApi', {
      restApiName: `bgv-api-${stage}`,
      description: `BGV API (${stage}) - Lambda + API Gateway`,
      defaultMethodOptions,
      deployOptions: {
        stageName: stage,
        throttlingBurstLimit: isProd ? 200 : 50,
        throttlingRateLimit: isProd ? 100 : 25,
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: false
      },
      binaryMediaTypes: ['multipart/form-data'],
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        allowCredentials: isProd
      }
    });

    const apiRoot = api.root.addResource('api');
    const streamIntegration = new apigateway.LambdaIntegration(bgvApiHandler);
    apiRoot.addProxy({
      defaultIntegration: streamIntegration,
      anyMethod: true
    });

    const websiteBucket = new s3.Bucket(this, 'FrontendWebsiteBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      autoDeleteObjects: !isProd,
      removalPolicy
    });

    const distribution = new cloudfront.Distribution(this, 'FrontendDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(1)
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(1)
        }
      ]
    });

    new s3deploy.BucketDeployment(this, 'FrontendPlaceholderDeployment', {
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
      sources: [
        s3deploy.Source.data(
          'index.html',
          `<html><body><h2>BGV frontend (${stage})</h2><p>Upload frontend build artifacts here.</p></body></html>`
        )
      ]
    });

    let alarmTopic: sns.Topic | undefined;
    if (alarmEmail) {
      alarmTopic = new sns.Topic(this, 'BgvOpsAlertsTopic', {
        topicName: `bgv-ops-alerts-${stage}`
      });
      alarmTopic.addSubscription(new subscriptions.EmailSubscription(alarmEmail));
    }

    const api5xxAlarm = new cloudwatch.Alarm(this, 'BgvApi5xxAlarm', {
      alarmName: `bgv-api-5xx-${stage}`,
      metric: api.metricServerError({
        period: cdk.Duration.minutes(5),
        statistic: 'sum'
      }),
      threshold: api5xxAlarmThreshold,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'API Gateway 5xx errors exceeded threshold'
    });

    const lambdaErrorsAlarm = new cloudwatch.Alarm(this, 'BgvLambdaErrorsAlarm', {
      alarmName: `bgv-lambda-errors-${stage}`,
      metric: bgvApiHandler.metricErrors({
        period: cdk.Duration.minutes(5),
        statistic: 'sum'
      }),
      threshold: lambdaErrorAlarmThreshold,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Lambda errors exceeded threshold'
    });

    const lambdaThrottlesAlarm = new cloudwatch.Alarm(this, 'BgvLambdaThrottlesAlarm', {
      alarmName: `bgv-lambda-throttles-${stage}`,
      metric: bgvApiHandler.metricThrottles({
        period: cdk.Duration.minutes(5),
        statistic: 'sum'
      }),
      threshold: lambdaThrottleAlarmThreshold,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Lambda throttles detected'
    });

    const lambdaDurationP95Alarm = new cloudwatch.Alarm(this, 'BgvLambdaDurationP95Alarm', {
      alarmName: `bgv-lambda-duration-p95-${stage}`,
      metric: bgvApiHandler.metricDuration({
        period: cdk.Duration.minutes(5),
        statistic: 'p95'
      }),
      threshold: lambdaP95DurationMsThreshold,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Lambda p95 duration exceeded threshold'
    });

    const billingAlarm = new cloudwatch.Alarm(this, 'BgvEstimatedChargesAlarm', {
      alarmName: `bgv-estimated-charges-${stage}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Billing',
        metricName: 'EstimatedCharges',
        dimensionsMap: {
          Currency: 'USD'
        },
        statistic: 'Maximum',
        period: cdk.Duration.hours(6),
        region: 'us-east-1'
      }),
      threshold: monthlyBudgetUsd,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Estimated monthly AWS charges exceeded configured budget threshold'
    });

    if (alarmTopic) {
      const snsAction = new cloudwatchActions.SnsAction(alarmTopic);
      api5xxAlarm.addAlarmAction(snsAction);
      lambdaErrorsAlarm.addAlarmAction(snsAction);
      lambdaThrottlesAlarm.addAlarmAction(snsAction);
      lambdaDurationP95Alarm.addAlarmAction(snsAction);
      billingAlarm.addAlarmAction(snsAction);
    }

    const dashboard = new cloudwatch.Dashboard(this, 'BgvOpsDashboard', {
      dashboardName: `bgv-ops-${stage}`
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Requests / 4xx / 5xx',
        width: 12,
        left: [
          api.metricCount({ period: cdk.Duration.minutes(5), statistic: 'sum' }),
          api.metricClientError({ period: cdk.Duration.minutes(5), statistic: 'sum' }),
          api.metricServerError({ period: cdk.Duration.minutes(5), statistic: 'sum' })
        ]
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations / Errors / Throttles',
        width: 12,
        left: [
          bgvApiHandler.metricInvocations({ period: cdk.Duration.minutes(5), statistic: 'sum' }),
          bgvApiHandler.metricErrors({ period: cdk.Duration.minutes(5), statistic: 'sum' }),
          bgvApiHandler.metricThrottles({ period: cdk.Duration.minutes(5), statistic: 'sum' })
        ]
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration (p50/p95)',
        width: 12,
        left: [
          bgvApiHandler.metricDuration({ period: cdk.Duration.minutes(5), statistic: 'p50' }),
          bgvApiHandler.metricDuration({ period: cdk.Duration.minutes(5), statistic: 'p95' })
        ]
      }),
      new cloudwatch.GraphWidget({
        title: 'Estimated Charges (USD, us-east-1 metric)',
        width: 12,
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Billing',
            metricName: 'EstimatedCharges',
            dimensionsMap: {
              Currency: 'USD'
            },
            statistic: 'Maximum',
            period: cdk.Duration.hours(6),
            region: 'us-east-1'
          })
        ]
      })
    );

    new cdk.CfnOutput(this, 'ApiBaseUrl', {
      value: `${api.url}api/bgv-requests`,
      description: 'Base URL for BGV API'
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: websiteBucket.bucketName,
      description: 'S3 bucket for frontend artifacts'
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: distribution.distributionDomainName,
      description: 'CloudFront distribution domain for frontend'
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront distribution id for invalidation'
    });

    new cdk.CfnOutput(this, 'OpsDashboardName', {
      value: dashboard.dashboardName,
      description: 'CloudWatch dashboard name for BGV operations'
    });

    if (alarmTopic) {
      new cdk.CfnOutput(this, 'OpsAlarmTopicArn', {
        value: alarmTopic.topicArn,
        description: 'SNS topic ARN for operational alarms'
      });
    }

    new cdk.CfnOutput(this, 'DynamoDbTableName', {
      value: table.tableName,
      description: 'BGV requests DynamoDB table name'
    });

    new cdk.CfnOutput(this, 'DynamoDbHistoryTableName', {
      value: historyTable.tableName,
      description: 'BGV request history DynamoDB table name'
    });

    new cdk.CfnOutput(this, 'DynamoDbExcelRecordsTableName', {
      value: excelRecordsTable.tableName,
      description: 'BGV Excel upload records DynamoDB table name'
    });

    new cdk.CfnOutput(this, 'DynamoDbExcelCellsTableName', {
      value: excelCellsTable.tableName,
      description: 'BGV Excel upload cells DynamoDB table name'
    });
  }
}