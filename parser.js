self.addEventListener('message', function(e) {
  var resp = { tReceived: Date.now() };
  
  resp.tParseNet = Date.now()
  resp.result = JSON.parse(e.data);
  resp.tSent = Date.now();
  self.postMessage(resp);
}, false);