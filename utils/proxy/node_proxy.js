var http = require('http'),
    request = require('request');
    
http.createServer(function (req, res) {
    //console.log(req);   
        
    if (req.url.match('^\\/proxy.*') && req.method === 'POST') {
       // handle XSScripting proxy calls
       post_handler(req, function(req_data) {
           req_data = JSON.parse(req_data);
           console.log("Received proxy call with data:");
           console.log(req_data);
           
          var r = request({
               method : (req_data.verb)? req_data.verb : "GET",
               uri : req_data.proxy_url,
               body : req_data.content,
               headers: {
                   "Accept": (req_data.format)? req_data.format : "text/plain"
               }
            }, function (error, response, body) {
              if(response.statusCode == 200) {
                res.writeHead(response.statusCode, {'Content-Type': (req_data.format)? req_data.format : "text/plain"});
                res.end(body);
              } else {
                res.writeHead(response.statusCode, {'Content-Type': 'text/plain'});
                res.end(body);
              }
            });
	    });
    }
    else {
      // do normal request handling
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('Normal request...\n');
    }
    
}).listen(8124, "127.0.0.1");


//data format:
/* {
     proxy_url: url, 
     content: text,
     verb: "POST",
     format: "application/rdf+json" (e.g.)
}*/
function do_Request (data, res) {
    
};

function post_handler(request, callback) {
    var content = '';

    request.addListener('data', function(chunk) {
        content += chunk;
	});

	request.addListener('end', function() {
	    callback(content);
	});
};
console.log('Server running at http://127.0.0.1:8124/');