module("vie.js - DBPedia Service");

test("Test DBPedia connection", function() {
    var z = new VIE();
    ok(z.DBPediaService, "Checking if the DBPedia Service exists.'");
    z.use(new z.DBPediaService());
    ok(z.service('dbpedia'));
});

test("VIE.js DBPediaService - Load", function () {
    if (navigator.userAgent === 'Zombie') {
       return;
    } 
    var entity = "<http://dbpedia.org/resource/Barack_Obama>";
    var z = new VIE();
    ok (z.DBPediaService);
    equal(typeof z.DBPediaService, "function");
    z.use(new z.DBPediaService());
    stop();
    z
    .load({entity: entity})
    .using('dbpedia')
    .execute()
    .done(function(x) {
        ok(x, "Something returned");
        ok(x.isEntity);
        start();
    })
    .fail(function(f){
        ok(false, f.message);
        start();
    });
});

