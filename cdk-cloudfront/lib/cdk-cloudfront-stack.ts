import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudFront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3Deploy from "aws-cdk-lib/aws-s3-deployment"
import * as apiGateway from 'aws-cdk-lib/aws-apigateway';

export class CdkCloudfrontStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // create S3
    const s3Bucket = new s3.Bucket(this, "s3-bucket-for-web-application",{
      bucketName: "storage-web-application",
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      versioned: false,
    });
    new cdk.CfnOutput(this, 'bucketName', {
      value: s3Bucket.bucketName,
      description: 'The nmae of bucket',
    });
    new cdk.CfnOutput(this, 's3Arn', {
      value: s3Bucket.bucketArn,
      description: 'The arn of s3',
    });
    new cdk.CfnOutput(this, 's3Path', {
      value: 's3://'+s3Bucket.bucketName,
      description: 'The path of s3',
    });

    // copy web application files into s3 bucket
    new s3Deploy.BucketDeployment(this, "DeployWebApplication", {
      sources: [s3Deploy.Source.asset("../webapplication")],
      destinationBucket: s3Bucket,
    });

    // lambda function
    const lambdaBasic = new lambda.Function(this, "lambdaBasic", {
      description: 'Basic Lambda Function',
      runtime: lambda.Runtime.NODEJS_14_X, 
      code: lambda.Code.fromAsset("../basic-lambda-function"), 
      handler: "index.handler", 
      timeout: cdk.Duration.seconds(3),
      environment: {
      }
    }); 
    new cdk.CfnOutput(this, 'lambdaBasicARN', {
      value: lambdaBasic.functionArn,
      description: 'The arn of basic lambda',
    });
  
    // api-role
    const stage = "dev";
    const role = new iam.Role(this, "api-gateway-role", {
      roleName: "ApiGatewayRole",
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com")
    });
    role.addToPolicy(new iam.PolicyStatement({
      resources: ['*'],
      actions: ['lambda:InvokeFunction']
    }));
    role.addManagedPolicy({
      managedPolicyArn: 'arn:aws:iam::aws:policy/AWSLambdaExecute',
    }); 

    // define api gateway
    const methodName = "status"
    const apigw = new apiGateway.RestApi(this, 'api-gateway', {
      description: 'API Gateway for cloudfront routed',
      endpointTypes: [apiGateway.EndpointType.REGIONAL],
      deployOptions: {
        stageName: stage,
      },
      defaultMethodOptions: {
        authorizationType: apiGateway.AuthorizationType.NONE
      },
    });   

    // define template
    const templateString: string = `#set($inputRoot = $input.path('$'))
    {
        "deviceid": "$input.params('deviceid')"
    }`;

    const requestTemplates = { // path through
      'application/json': templateString,
    };

    // define method of "status"
    const api = apigw.root.addResource(methodName);

    api.addMethod('GET', new apiGateway.LambdaIntegration(lambdaBasic, {
      passthroughBehavior: apiGateway.PassthroughBehavior.WHEN_NO_TEMPLATES,  // options: NEVER
      credentialsRole: role,
      requestTemplates: requestTemplates,
      integrationResponses: [{
        statusCode: '200',
      }], 
      proxy:false, 
    }), {
      requestParameters: {
        'method.request.querystring.deviceid': true,
      },
      methodResponses: [   // API Gateway sends to the client that called a method.
        {
          statusCode: '200',
          responseModels: {
            'application/json': apiGateway.Model.EMPTY_MODEL,
          }, 
        }
      ]
    }); 

    new cdk.CfnOutput(this, 'EndpointUrl', {
      value: apigw.url,
      description: 'The endpoint of API Gateway',
    });

    // cloudfront
    const myOriginRequestPolicy = new cloudFront.OriginRequestPolicy(this, 'OriginRequestPolicyCloudfront', {
      originRequestPolicyName: 'QueryStringPolicyCloudfront',
      comment: 'Query string policy for cloudfront',
      cookieBehavior: cloudFront.OriginRequestCookieBehavior.none(),
      headerBehavior: cloudFront.OriginRequestHeaderBehavior.none(),
      queryStringBehavior: cloudFront.OriginRequestQueryStringBehavior.allowList('deviceid'),
    });

    const distribution = new cloudFront.Distribution(this, 'cloudfront', {
      defaultBehavior: {
        origin: new origins.S3Origin(s3Bucket),
        allowedMethods: cloudFront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudFront.CachePolicy.CACHING_DISABLED,
        viewerProtocolPolicy: cloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      priceClass: cloudFront.PriceClass.PRICE_CLASS_200,  
    });
    distribution.addBehavior("/status", new origins.RestApiOrigin(apigw), {
      cachePolicy: cloudFront.CachePolicy.CACHING_DISABLED,
      originRequestPolicy: myOriginRequestPolicy,
      viewerProtocolPolicy: cloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    });    

    new cdk.CfnOutput(this, 'distributionDomainName', {
      value: distribution.domainName,
      description: 'The domain name of the Distribution',
    }); 
  }
}
