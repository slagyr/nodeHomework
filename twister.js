var http = require('http');
var fs = require('fs');
var haml = require('haml');
var querystring = require('querystring');


var mainTemplate = haml.compile(fs.readFileSync("./main.haml", "utf8"));
var names = []

exports.addName = function(name)
{
    names[names.length] = name
}

exports.resetNames = function()
{
    names = []
}

exports.getNames = function(name)
{
    return names;
}

withPostData = function(request, callback)
{
    var postData = '';

    request.addListener('data', function(chunk)
    {
        postData += chunk;
    });

    request.addListener('end', function()
    {
        callback(querystring.parse(postData));
    });
}

exports.prepareResponse = function(tweets, names, onCompleteAction)
{
    var remainingNames = [].concat(names);
    var next = remainingNames.shift();
    if(next)
        pullTweets(next, tweets, remainingNames, onCompleteAction);
    else
        onCompleteAction(tweets);
}

pullTweets = function(name, tweets, names, onCompleteAction)
{
    var google = http.createClient(80, 'api.twitter.com');
    var request = google.request('GET', '/1/statuses/user_timeline/' + name + '.json', {'host': 'api.twitter.com'});
    request.end();
    var json = "";
    request.on('response', function (response)
    {
        console.log('STATUS: ' + response.statusCode);
        console.log('HEADERS: ' + JSON.stringify(response.headers));
        var json = "";
        response.setEncoding('utf8');
        response.on('data', function (chunk)
        {
            //                console.log("data chunk: " + chunk);
            json += chunk;
        });
        response.on('end', function (chunk)
        {

            console.log("end chunk: " + chunk);
            if(chunk)
                json += chunk;

            console.log("json: " + json);
            var newTweets = JSON.parse(json);
            console.log("newTweets: " + newTweets);
            tweets = tweets.concat(newTweets);
            prepareResponse(tweets, names, onCompleteAction);
        });
    });
}

exports.process = function(request, response)
{
    if(request.method == "GET")
    {
        response.writeHead(200, {'Content-Type': 'text/html'});
        exports.prepareResponse([], names, function(tweets)
        {
            tweets = tweets.sort(function(a, b)
            {
                dateA = new Date(a['created_at']);
                dateB = new Date(b['created_at']);
                return dateB - dateA;
            })
            response.end(haml.execute(mainTemplate, this, {'names': names, 'tweets': tweets}));
        })
    }
    else
    {
        withPostData(request, function(data)
        {
            var name = data["twitterName"];
            if(name.length > 0)
                exports.addName(name);
            response.writeHead(303, {'Location': '/'});
            response.end();
        })
    }
}

exports.server = http.createServer(function (req, res)
{
    exports.process(req, res);
});
