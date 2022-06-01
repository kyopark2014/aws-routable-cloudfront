# AWS CDK 로 인프라 생성하기 

## S3 설치 

S3 bucket을 아래와 같이 생성합니다. 이때, 보안을 위해 외부에석 직접 접속을 제한합니다. 

```java
    const s3Bucket = new s3.Bucket(this, "s3-bucket-for-web-application",{
      bucketName: "storage-web-application",
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      versioned: false,
    });
```    

로컬 폴더에 있는 파일들을 S3에 복사합니다. 

```java
    new s3Deploy.BucketDeployment(this, "DeployWebApplication", {
      sources: [s3Deploy.Source.asset("../webapplication")],
      destinationBucket: s3Bucket,
    });
```    

## Lambda 생성

아래와 같이 Lambda를 생성합니다. 

```java
    const lambdaBasic = new lambda.Function(this, "lambdaBasic", {
      description: 'Basic Lambda Function',
      runtime: lambda.Runtime.NODEJS_14_X, 
      code: lambda.Code.fromAsset("../basic-lambda-function"), 
      handler: "index.handler", 
      timeout: cdk.Duration.seconds(3),
      environment: {
      }
    }); 
```

Lambda는 자동으로 생성된 코드를 그대로 사용합니다. 

```java
exports.handler = async (event) => {
    // TODO implement
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};
```

## API Gateway 생성

"RestApi"로 API Gateway를 생성합니다. 이때 생성한 "/status" API는 기생성한 Lambda와 연결합니다. 

```java
    const mathodName = "status"
    const apigw = new apiGateway.RestApi(this, 'api-gateway', {
      description: 'API Gateway',
      endpointTypes: [apiGateway.EndpointType.REGIONAL],
      deployOptions: {
        stageName: 'dev',
      },
      defaultMethodOptions: {
        authorizationType: apiGateway.AuthorizationType.NONE
      },
    }); 
    
    // define method of "status"
    const api = apigw.root.addResource(mathodName);
    api.addMethod('GET', new apiGateway.LambdaIntegration(lambdaBasic, {
      integrationResponses: [{
        statusCode: '200',
      }], 
      proxy:false, 
    }), {
      methodResponses: [   // API Gateway sends to the client that called a method.
        {
          statusCode: '200',
          responseModels: {
            'application/json': apiGateway.Model.EMPTY_MODEL,
          }, 
        }
      ]
    }); 
```

## CloudFront 생성

아래와 같이 cloudfront를 정의합니다. 기본 Origin으로 S3 bucket을 지정하고, 추가적인 Origin으로 API Gateway를 지정하면, '/status"를 제외한 모든 트래픽은 S3로 가도록 Routing 할 수 있습니다. 

```java
    const distribution = new cloudFront.Distribution(this, 'cloudfront', {
      defaultBehavior: {
        origin: new origins.S3Origin(s3Bucket),
        allowedMethods: cloudFront.AllowedMethods.ALLOW_ALL,
        viewerProtocolPolicy: cloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      priceClass: cloudFront.PriceClass.PRICE_CLASS_200,  
    });
    
    distribution.addBehavior("/status", new origins.RestApiOrigin(apigw), {
      viewerProtocolPolicy: cloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    });  
```    
