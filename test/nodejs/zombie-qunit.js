var zombie = require("zombie");
var express = require("express");
var _ = require("underscore")._;

exports['test QUnit with a headless browser'] = function(test) {
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
                _.each(browser.css('#qunit-tests > li'), function(listItem) {
                    var testMessage = listItem._childNodes[0]._childNodes[0].textContent + listItem._childNodes[0]._childNodes[2].textContent;
                    var testState = listItem._attributes._nodes['class']._nodeValue;

                    test.equal(testState, 'pass', testMessage);
                });
                server.close();
                test.done();
            });
        });
    });
};
