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

로컬 폴더에 있는 파일들(Web application)을 S3에 복사합니다. 

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

[Lambda for basic의 코드](https://github.com/kyopark2014/aws-routable-cloudfront/tree/main/basic-lambda-function)는 invoke 될때의 event를 로그로 찍고, 리턴시 디버깅을 위해 event를 그대로 body로 전달합니다. 

## API Gateway 생성

API Gateway를 위한 IAM Role을 생성합니다. 

```java
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
```    

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
```

API가 querystring으로 "deviceid"를 가지는 경우에 "application/json"에서 parcing 할수 있도록 아래와 같이 template을 선언합니다. 

```java
    // define template
    const templateString: string = `#set($inputRoot = $input.path('$'))
    {
        "deviceid": "$input.params('deviceid')"
    }`;

    const requestTemplates = { // path through
      'application/json': templateString,
    };
```

이제 "/status" API를 아래와 같이 선언합니다. 여기서 querystirng을 [Method Request]에 등록하기 위해서 method.request.querystring을 아래처럼 선언하여야 합니다. 

```java
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
```

## CloudFront 생성

아래와 같이 cloudfront를 정의합니다. 기본 Origin으로 S3 bucket을 지정하고, 추가적인 Origin으로 API Gateway를 지정하면, '/status"를 제외한 모든 트래픽은 S3로 가도록 Routing 할 수 있습니다. API의 경우에 caching되면 안되므로 아래와 같이 "CACHING_DISABLED"로 policy를 지정하여야 합니다. 

또, querystring이 origin으로 forwarding되기 위해서 "QueryStringPolicyCloudFront"라는 policy를 등록해서 "originRequestPolicy"로 아래처럼 사용하였습니다. 

```java
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
```    
