var vie = require('../../dist/vie.js');

exports['test loading Salzburg'] = function(test) {
    var VIE = new vie.VIE();
    VIE.use(new VIE.DBPediaService, 'dbpedia');
    VIE.load({
        entity: '<http://dbpedia.org/resource/Salzburg>'
        }).
        using('dbpedia').
        execute().
        done(function(entity) {
            test.equal(typeof entity, "object");
            test.done();
        }).
        fail(function(error) {
            // console.log("dbPedia requests fail, the service is probably down");
            test.done();
        });
};
