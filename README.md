# AWS CloudFront의 URL Routing을 이용한 Web Client 및 API Server 구현

여기서는 CliendFront의 URL Routing을 이용하여 Web Client와 API Server를 구현하고자 합니다. Web Client는 S3에 html과 javascript로 되어 있어서, URL로 접속을 하며, API Server는 Amazon API Gateway와 AWS Lambda를 통해 구현 할 수 있습니다. 또한, 이러한 인프라 설치(Deploy)는 [AWS CDK](https://github.com/kyopark2014/technical-summary/blob/main/cdk-introduction.md)를 이용하여, 쉽고 편리하게 구현합니다. 

전체적인 Architecture는 아래와 같습니다. 사용자가 Amazon CloudFront를 이용해 web page에 접속 할 수 있습니다. 또한 restful api로 접속시에는 api의 method 이름을 이용하여 적절한 경로로 Routing 할 수 있습니다. 여기에서는 status Method를 가지고 '/status'라는 URL을 가지므로, Amazon API Gateway로 routing 되어지는데, 이때 API Gateway와 연결된 Lambda를 통해 원하는 동작을 요청 할 수 있습니다. 

![image](https://user-images.githubusercontent.com/52392004/171438110-3cb4afa1-b597-4ac9-b531-78ec62b4bd7f.png)


## CDK Initiate

Typescript로 cdk를 설정시 아래와 같이 합니다.

```c
$ cdk init app --language typescript

$ cdk bootstrap aws://123456789012/ap-northeast-2
```
여기서 '123456789012'은 Account Number를 의미합니다.

- aws-cdk-lib의 수동 Upgrade가 필요합니다.

```c
$ npm install -g aws-cdk-lib
```

- CloudFrontToApiGateway를 위한 aws-solutions-constructs의 aws-cloudfront-apigateway package 설치하여야 합니다.

```c
$ npm install @aws-solutions-constructs/aws-cloudfront-apigateway
```


## 생성된 결과

아래와 같이 CloudFront에는 2개의 origin이 등록이 되는데, 기본적으로 트래픽은 S3로 라우팅 되지만 '/status' API의 경우는 api gateway로 전달되어 처리 됩니다. 

![noname](https://user-images.githubusercontent.com/52392004/171436095-76869042-d7f3-49d9-ba37-015852ec90e5.png)


따라서 아래와 같이 브라우저에서 'status' API를 호출시 Lambda가 실행되는 것을 확인 할 수 있습니다.

![image](https://user-images.githubusercontent.com/52392004/171440535-18269d39-9c50-4c66-9e90-c7ec5b17c058.png)



## Reference 

[AWS CDK — A Beginner’s Guide with Examples](https://enlear.academy/aws-cdk-a-beginners-guide-with-examples-424c600ac409)

[aws-cdk-changelogs-demo](https://github.com/aws-samples/aws-cdk-changelogs-demo)

[CloudFront to S3 and API Gateway](https://serverlessland.com/patterns/cloudfront-s3-lambda-cdk)
