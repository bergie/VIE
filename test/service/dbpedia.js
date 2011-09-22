module("vie.js - DBPedia Service");

test("Test DBPedia connection", function() {
    var z = new VIE();
    ok(z.DBPediaService, "Checking if the DBPedia Service exists.'");
    z.use(new z.DBPediaService);
    ok(z.service('dbpedia'));
});

test("VIE.js DBPediaService - Load", function () {
    var entity = "<http://dbpedia.org/resource/Barack_Obama>";
    var z = new VIE();
    ok (z.DBPediaService);
    equal(typeof z.DBPediaService, "function");
    z.use(new z.DBPediaService());
    stop(10000); // 10 second timeout
    z.load({entity: entity})
    .using('dbpedia').execute().done(function(x) {
        ok(x, "Something returned");
        ok(x[0].isEntity, "Returned is an array of VIE Entities.");
        equals(x[0].id, entity);
        ok(x[0].get("dbonto:abstract").length === 14);
        start();
    })
    .fail(function(f){
        ok(false, f);
        start();
    });
});

