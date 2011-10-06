var jQuery = require('jquery');
var vie = require('../dist/vie-latest.debug.js');

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
            test.equal(entities.length, 3);
        }).
        then(function() {
            test.done();
        });
};
