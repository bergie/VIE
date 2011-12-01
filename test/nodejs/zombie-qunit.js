var zombie = require("zombie");
var express = require("express");
var _ = require("underscore")._;

var qunitResults;

exports.setUp = function(callback) {
    var server = express.createServer();
    server.configure(function() {
        server.use(express.errorHandler());
        server.use("/", express.static(__dirname + "/../../"));
        server.use("/", express.directory(__dirname + "/../../"));
        server.use(express.logger());
    });
    server.listen(3000, function() {
        var location = "http://localhost:3000/test/index.html";
        var browser = new zombie.Browser({debug: false});
        browser.visit(location, function(err, browser, status) {
            // Start QUnit
            browser.fire('load', browser.window);

            browser.wait(function(err, browser) {
                qunitResults = browser.css('#qunit-tests > li');
                console.log(qunitResults.length);
                server.close();
                callback();
            });
        });
    });
};

exports['Client-side VIE tests with a headless browser'] = function(test) {
    _.each(qunitResults, function(listItem) {
        var testGroup = listItem._childNodes[0]._childNodes[0].textContent + ': ' + listItem._childNodes[0]._childNodes[2].textContent;
        _.each(listItem._childNodes[2]._childNodes, function(individualTest) {
            var testMessage = individualTest.textContent;
            var testState = individualTest._attributes._nodes['class']._nodeValue;
            test.equal(testState, 'pass', testGroup + ': ' + testMessage);
        });
    });
    test.done();
};
