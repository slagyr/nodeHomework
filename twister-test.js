var vows = require('vows'),
        assert = require('assert');
twister = require('./twister');

function Response(callback)
{
    this.callback = callback;
    this.status = -1;
    this.headers = {};
    this.body = ""

    this.writeHead = function(status, headers)
    {
        this.status = status;
        this.headers = headers;
    }

    this.end = function(content)
    {
        this.body += content;
        this.callback(null, this);
    }
}

function Request(method, path)
{
    this.method = method;
    this.path = path;
    this.body = "";

    this.addListener = function(event, action) {
        if(event == "data")
            action(this.body);
        else
            action();
    }
}

get = function(path, callback)
{
    twister.process(new Request("GET", path), new Response(callback));
};

post = function(path, body, callback)
{
    request = new Request("POST", path);
    request.body = body;
    twister.process(request, new Response(callback));
};

assertContains = function(body, text)
{
    assert.ok(body.indexOf(text) != -1);
}

twister.prepareResponse = function(tweets, names, callback) {
    callback(tweets)
}

vows.describe('Twister').addBatch({
    'first page load': {
        topic: function ()
        {
            twister.resetNames();
            get("/", this.callback)
        },
        'give status 200': function (response)
        {
            assert.equal(response.status, 200);
        },
        'be HTML': function (response)
        {
            assert.equal(response.headers["Content-Type"], "text/html");
        },
        'has a good title': function (response)
        {
            assertContains(response.body, "<title>Twister</title>");
        },
        'has a form': function(response)
        {
            assertContains(response.body, "<form");
        },
        'have no names': function(response)
        {
            assertContains(response.body, "<div id=\"names\"></div>");
        }
    },

    'with names': {
        topic: function ()
        {
            twister.resetNames();
            twister.addName("Joe");
            twister.addName("Blow");
            get("/", this.callback)
        },
        "show names": function(response)
        {
            assertContains(response.body, "<div id=\"names\">Joe, Blow</div>");
        }
    },

    'adding a name': {
        topic: function ()
        {
            twister.resetNames();
            post("/", "twitterName=Joe", this.callback)
        },
        "stores name": function(response)
        {
            assert.equal(twister.getNames().length, 1);
            assert.equal(twister.getNames()[0], "Joe");
        },
        "redirect to /": function(response)
        {
            assert.equal(response.status, 303);
            assert.equal(response.headers["Location"], "/");            
        }
    },

    'adding an invalid name': {
        topic: function(){
            twister.resetNames();
            post("/", "twitterName=", this.callback)
        },
        "ignores name": function(response)
        {
            assert.equal(twister.getNames().length, 0);
        }
    }

}).run();