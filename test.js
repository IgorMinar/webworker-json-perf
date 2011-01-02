(function(w, d) {

  var logEl,
      tStart, tFinish, tParse,
      dXhr, dPost, dIn, dParseNet, dOut,
      stringLn, arrayLn,
      lagTimer, lagLog = [],
      parser = new Worker('parser.js'),
      fetcherParser = new Worker('fetcherParser.js'),
      payloadSrc = 'payload.json';



  w.addEventListener('load', function() {
    d.getElementById('sync').addEventListener('click', syncParse, false);
    d.getElementById('async-inout').addEventListener('click', asyncInOutParse, false);
    d.getElementById('async-out').addEventListener('click', asyncOutParse, false);

    logSyncEl = d.getElementById('log-sync');
    logAsyncInOutEl = d.getElementById('log-async-inout');
    logAsyncOutEl = d.getElementById('log-async-out');
  }, false);

  

  function syncParse() {
    if (tStart) {
      console.log('test in progress, aborting!');
      return;
    }

    dPost = 0;
    dIn = 0;
    dParseNet = 0;
    dOut = 0;
    lagLog = [];
    
    tStart = Date.now();
    
    fetchPayload(function(jsonString) {
      tParse = Date.now();
      arrayLn = JSON.parse(jsonString).length;
      tFinish = Date.now();
      dParseNet = tFinish - tParse;
      lagLog.push(dParseNet);
      log(logSyncEl);
    });
  }


  function asyncInOutParse() {
    if (tStart) {
      console.log('test in progress, aborting!');
      return;
    }

    tStart = Date.now();
    
    fetchPayload(function(jsonString) {
      tParse = Date.now();
      parser.postMessage(jsonString);
      dPost = Date.now() - tParse;
    });

    watchLag();
  }

  parser.addEventListener('message', function(e) {
    dOut = Date.now() - e.data.tSent;

    var resp  = e.data;

    arrayLn = resp.result.length;
    tFinish = Date.now();
    dIn = resp.tReceived - tParse;
    dParseNet = resp.tSent - resp.tParseNet;
    setTimeout(function() {log(logAsyncInOutEl)}, 10);
  }, false);

  parser.addEventListener('error', function(e) {
    dump('WebWorker ERROR', e);
  }, false);


  function asyncOutParse() {
    if (tStart) {
      console.log('test in progress, aborting!');
      return;
    }

    tStart = Date.now();
    tParse = Date.now();
    fetcherParser.postMessage(payloadSrc);
    dPost = Date.now() - tParse;

    watchLag();
  }

  fetcherParser.addEventListener('message', function(e) {
    var resp = e.data;
    dOut = Date.now() - resp.tSent;
    arrayLn = resp.result.length;
    tFinish = Date.now();
    stringLn = resp.stringLn;
    dIn = e.data.tReceived - tParse;
    dParseNet = resp.tSent - resp.tParseNet;
    dXhr = resp.dXhr;
    setTimeout(function() {log(logAsyncOutEl)}, 10); //log async so that we measure the last lag
  }, false);

  fetcherParser.addEventListener('error', function(e) {
    dump('WebWorker ERROR', e);
  }, false);


  function fetchPayload(fn) {
    var req = new XMLHttpRequest();
    req.open('GET', payloadSrc, true);
    req.onreadystatechange = function () {
      if (req.readyState == 4) {
        if(req.status == 200) {
          dXhr = Date.now() - tStart;
          stringLn = req.responseText.length;
          fn(req.responseText);
        } else {
          dump("Error loading page\n");
        }
      }
    };
    req.send();
  }


  function log(logEl) {
    lagLog.sort(function(o1,o2) {return o2-o1});

    logEl.textContent = "total duration:  " + (tFinish - tStart) +
                        "\n parse:          " + (tFinish - tParse) +
                        "\n  post msg:      " + dPost +
                        "\n  in:            " + dIn +
                        "\n  net parse:     " + dParseNet +
                        "\n  out:           " + dOut +
                        "\nxhr duration:    " + dXhr +
                        
                        "\nstring length:   " + (Math.round(stringLn/10000)/100) + 'MB' +
                        "\narray length:    " + arrayLn +
                        "\nmax lag:         " + lagLog.slice(0, 5).join(',') +
                        "\n\n----\n\n" +
                        logEl.textContent;

    tStart = 0;
    lagLog = [];
  }


  function watchLag() {
    if (tStart) {
      if (lagTimer) {
        lagLog.push(Date.now() - lagTimer);
      }
      lagTimer = Date.now();
      setTimeout(watchLag, 0);
    } else {
      lagTimer = undefined;
    }
  }

})(window, document);
