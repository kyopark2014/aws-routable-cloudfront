# Web application

client의 브라우저에서 web url을 이용하여 web application을 호출하여 web client로 사용하고자 합니다. 

## status.html

아래와 같이 button을 선택하여 "RUN"을하면 "request.js"가 동작하는 매우 simple 한 구조를 가지고 있습니다. 
   
```html   
<html>
  <body>	
    <form id="my-form">
        <h3>API: /status</h3>

        <button name="run" id="run">RUN</button>

        <h3><p id="response">response:</p></h3>	  
    </form>		
    <script src="request.js"></script> 
	</script> 
  </body>	
</html>
```

## request.js

'/status' 경로로 request를 요청하므로 cross origin 이슈가 발생하지 않습니다. '/status'에 querystring '?deviceid=a1234567890'과 같이 호출하면 'lambda-for-basic'이 200OK 응답의 body에 cloudfront가 전달해준 event를 다시 전달함으로 querystring이 정상적으로 전달된것을 확인 할 수 있습니다. 

```java
const myForm = document.querySelector('#my-form');
myForm.addEventListener('submit', onSubmit);

function onSubmit(e) {
  e.preventDefault();

  let deviceid = 'a1234567890';

  const url = '/status?deviceid='+deviceid;
    
  var xmlHttp = new XMLHttpRequest();

  xmlHttp.open("GET", url, true);     

  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState == XMLHttpRequest.DONE && xmlHttp.status == 200 ) {
      console.log('response: '+xmlHttp.responseText);

      let res = JSON.parse(xmlHttp.responseText);

      console.log('statusCode: '+res.statusCode);
      console.log('body: '+res.body);

      document.getElementById("response").innerHTML = 'response: '+xmlHttp.responseText;	
    }
  };
  
  xmlHttp.send(null);
}
```
