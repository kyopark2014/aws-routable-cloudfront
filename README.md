# aws-routable-cloudfront
It shows a routable cloudfront 


![image](https://user-images.githubusercontent.com/52392004/171398877-02464433-2388-46b9-8f43-8d28d6e732bb.png)



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


## Reference 

[AWS CDK — A Beginner’s Guide with Examples](https://enlear.academy/aws-cdk-a-beginners-guide-with-examples-424c600ac409)

[aws-cdk-changelogs-demo](https://github.com/aws-samples/aws-cdk-changelogs-demo)

[CloudFront to S3 and API Gateway](https://serverlessland.com/patterns/cloudfront-s3-lambda-cdk)
