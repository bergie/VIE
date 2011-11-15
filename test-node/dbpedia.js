var vie = require('../dist/vie-latest.debug.js');

exports['test loading Salzburg'] = function(test) {
    var VIE = new vie.VIE();
    VIE.use(new VIE.DBPediaService, 'dbpedia');
    VIE.load({
        entity: '<http://dbpedia.org/resource/Salzburg>'
        }).
        using('dbpedia').
        execute().
        always(function(entity) {
            test.equal(typeof entity, "object");
            test.done();
        });
};
