# Lambda for Basic

API Gateway에서 "lambda-for-basic"을 Invoke할때 event로 전달되는 querystring을 확인하기 위하여 아래와 같이 event를 log로 찍고, return 값의 body에 event를 전달하고 있습니다. 

```java
exports.handler = async (event) => {
    console.log('## ENVIRONMENT VARIABLES: ' + JSON.stringify(process.env))
    console.log('event: '+JSON.stringify((event)));
    
    // TODO implement
    const response = {
        statusCode: 200,
        body: JSON.stringify(event),
    };
    return response;
};
```
