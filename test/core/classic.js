module("Core - VIE 1.x API");

test("Disabled Classic API", function () {
    var v = new VIE({classic: false});
    ok(v);
    equal(typeof v.EntityManager, "undefined");
    equal(typeof v.RDFa, "undefined");
    equal(typeof v.RDFaEntities, "undefined");
    equal(typeof v.cleanup, "undefined");
});

test("Enabled Classic API", function() {
    var v = new VIE({classic: true});
    ok(v);
    ok(v.EntityManager);
    ok(v.RDFa);
    ok(v.RDFaEntities);
    ok(v.cleanup);
});
