var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});

	var google = http.createClient(80, 'twitter.com');
	var request = google.request('GET', '/8thlightinc', {'host': 'twitter.com'});
	request.end();
	request.on('response', function (response) {
	  console.log('STATUS: ' + response.statusCode);
	  console.log('HEADERS: ' + JSON.stringify(response.headers));
	  response.setEncoding('utf8');
	  response.on('data', function (chunk) {
	    res.write(chunk);
	  });
	  response.on('end', function (chunk) {
		res.end();
	  });
	});

}).listen(8124, "127.0.0.1");
console.log('Server running at http://127.0.0.1:8124/');