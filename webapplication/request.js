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
