var jQuery = require('jquery');
var vie = require('../../dist/vie.js');

exports['test annotations'] = function(test) {
    var html = jQuery('<p>This is a small test, where Steve Jobs sings a song.</p>');

    var VIE = new vie.VIE();
    VIE.use(new VIE.StanbolService, 'stanbol');
    VIE.analyze({
            element: html
        }).
        using('stanbol').
        execute().
        done(function(entities) {
            test.equal(entities.length, 1);
            var steveFound = false;
            for (property in entities[0]) {
                if (property === '<http://dbpedia.org/resource/Steve_Jobs>') {
                    steveFound = true;
                }
            }
            test.ok(steveFound, 'We need to find http://dbpedia.org/resource/Steve_Jobs from text');
        }).
        then(function() {
            test.done();
        }).
        fail(function(e){
            console.error(e);
            test.ok(false, "request failed");
            test.done();
        });
};
