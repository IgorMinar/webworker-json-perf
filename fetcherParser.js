self.addEventListener('message', function(e) {
  var resp = { tReceived: Date.now() }
  fetchPayload(e.data, function(jsonString) {
    resp.dXhr = Date.now() - resp.tReceived;
    resp.stringLn = jsonString.length;
    resp.tParseNet = Date.now()
    resp.result = JSON.parse(jsonString);
    resp.tSent = Date.now();
    self.postMessage(resp);
  });
}, false);


function fetchPayload(src, fn) {
  var req = new XMLHttpRequest();
  req.open('GET', src, true);
  req.onreadystatechange = function () {
    if (req.readyState == 4) {
      if(req.status == 200) {
        fn(req.responseText);
      } else {
        dump("Error loading page\n");
      }
    }
  };
  req.send();
}