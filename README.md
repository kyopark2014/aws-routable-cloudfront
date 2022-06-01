# aws-routable-cloudfront
It shows a routable cloudfront 


![image](https://user-images.githubusercontent.com/52392004/171437317-06da32fe-e1c9-42ae-919b-124b71e21ae1.png)


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

![noname](https://user-images.githubusercontent.com/52392004/171436966-37362137-b407-459f-a325-4edabfc2c7db.png)




## Reference 

[AWS CDK — A Beginner’s Guide with Examples](https://enlear.academy/aws-cdk-a-beginners-guide-with-examples-424c600ac409)

[aws-cdk-changelogs-demo](https://github.com/aws-samples/aws-cdk-changelogs-demo)

[CloudFront to S3 and API Gateway](https://serverlessland.com/patterns/cloudfront-s3-lambda-cdk)
