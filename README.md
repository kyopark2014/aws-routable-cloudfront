# AWS CloudFront의 URL Routing을 이용한 Web Client 및 API Server 구현

여기서는 CliendFront의 URL Routing을 이용하여 Web Client와 API Server를 구현하고자 합니다. Web Client는 Amazon S3에 html과 javascript과 같은 respource들로 구성되며, javascript에서 '/status'와 같은 API를 호출하면, Amazon API Gateway를 통해 lambda를 호출하는 구조를 되어 있습니다. 또한, 쉽고 편리하게 인프라를 구축하기 위하여 [AWS CDK](https://github.com/kyopark2014/technical-summary/blob/main/cdk-introduction.md)를 이용합니다.

전체적인 Architecture는 아래와 같습니다. 사용자가 Amazon CloudFront를 이용해 web page에 접속 할 수 있습니다. 또한 restful api로 접속시에는 api의 method 이름을 이용하여 적절한 경로로 Routing 할 수 있습니다. 여기에서는 status Method를 가지고 '/status'라는 URL을 가지므로, Amazon API Gateway로 routing 되어지는데, 이때 API Gateway와 연결된 Lambda를 통해 원하는 동작을 요청 할 수 있습니다.  

<img width="654" alt="image" src="https://user-images.githubusercontent.com/52392004/171968528-f091b951-8e3c-4170-8507-a6d8c263d48b.png">

## CORS 에러 

브라우저는 HTTP 보안을 위해 리소스의 origin (domain, scheme, port)을 확인하여 원래 사이트의 origin과 다른 경우(cross-origin)에 접속을 제한합니다. 

![image](https://user-images.githubusercontent.com/52392004/171963588-1fe1089a-e9fd-4222-b0a3-263dc2fe0d09.png)

자신의 origin과 다른 리소스를 허용하려면 [Cross-Origin Resource Sharing(CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)를 적용하여야 하는데, 브라우저는 preflight request(OPTIONS)를 보내서 서버로부터 "approval"을 받으면, actual request를 보낼 수 있습니다. 여기서 OPTIONS 해더에 origin 헤더가 반드시 포함되어야 합니다.

![noname](https://user-images.githubusercontent.com/52392004/171965277-c06888c4-efd4-48af-b3cd-9038293922ee.png)


그런데, [Chrome과 같은 브라우저에서 request에 origin을 허용하지 않은 경우](https://stackoverflow.com/questions/11182712/refused-to-set-unsafe-header-origin-when-using-xmlhttprequest-of-google-chrome)가 있어서, API Gateway에서 CORS 설정을 하더라도, CORS 에러로 request가 실패 할 수 있습니다. 

따라서, 여기에서는 원천적으로 crosss-origin 이슈가 발생하지 않도록, contents(html, css, js)와 같은 리소스가 같은 origin을 사용할 수 있도록 CloudFront를 사용하는 방법을 설명합니다. 


## CloudFront를 이용한 cross-origin 이슈 해결 방법

아래와 같이 CloudFront를 이용하여 '/status'로 시작하는 모든 request는 API Gateway를 통해 제공하고, 나머지 request는 S3로 routing 되도록 할 수 있습니다. 상세한 것은 [CDK Cloudfront](https://github.com/kyopark2014/aws-routable-cloudfront/tree/main/cdk-cloudfront)를 참고 하시기 바랍니다.

```java
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

이렇게 할 경우에 아래와 같이 CloudFront에는 2개의 origin이 등록이 되는데, '/status' API의 경우는 api gateway로 전달되어 처리되고, 나머지는 S3로 라우팅 됩니다.

![noname](https://user-images.githubusercontent.com/52392004/171436095-76869042-d7f3-49d9-ba37-015852ec90e5.png)


## CDK로 인프라 설치하기 

git repository에서 소스를 다운로드 합니다.

```c
$ git clone https://github.com/kyopark2014/aws-routable-cloudfront
```

아래의 [AWS CDK](https://github.com/kyopark2014/technical-summary/blob/main/cdk-introduction.md)명령어를 이용하여 인프라를 생성합니다. 

```c
$ cd cdk-cloudfront
$ cd cdk synth
$ cd deploy
```

인프라를 생성하는 방법은 [AWS CDK 인프라 생성하기](https://github.com/kyopark2014/aws-routable-cloudfront/tree/main/cdk-cloudfront)에서 상세히 설명하고 있습니다. 

인프라 삭제시는 아래 명령어를 사용합니다.

```c
$ cdk destroy
```

## 실행 결과

### Postman에서 '/status' API 호출시 

'/status'는 lambda-for-status로 routing되고 있으므로 아래와 같이 Lambda가 실행되는 것을 확인 할 수 있습니다.

![noname](https://user-images.githubusercontent.com/52392004/172040459-e9196687-cb12-416c-93e4-0339e7fd4a77.png)



### 브라우저(Chrome)에서 "status.html"을 호출시

html 내부의 request.js가 실행되면서, '/status' API를 호출하게 됩니다.

- "status.html"을 로딩 후 아래와 같이 [RUN]을 선택합니다. 여기서 "status.html"은 S3에 저장되어 있고, CloudFront를 통해 로딩됩니다.  

<img width="648" alt="image" src="https://user-images.githubusercontent.com/52392004/172040341-e18e6756-2dde-4eb2-b632-35d0c062905e.png">



- [RUN] 버튼을 선택하면 "status.html"에서 지정한 "request.js"가 실행되는데, 이때 "lambda-for-status"를 호출하여 응답을 받고, 이것을 아래와 같이 화면에 "response"로 표시하고 있습니다. 


<img width="652" alt="image" src="https://user-images.githubusercontent.com/52392004/172041708-71ff5590-33c4-4b9f-b8d3-a2ef0c8eee05.png">



## Reference 

[AWS CDK — A Beginner’s Guide with Examples](https://enlear.academy/aws-cdk-a-beginners-guide-with-examples-424c600ac409)

[aws-cdk-changelogs-demo](https://github.com/aws-samples/aws-cdk-changelogs-demo)

[CloudFront to S3 and API Gateway](https://serverlessland.com/patterns/cloudfront-s3-lambda-cdk)

[CORS란 무엇인가?](https://hannut91.github.io/blogs/infra/cors)

[Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
