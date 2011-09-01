module("zart.js - Stanbol Service");

test("Test stanbol connection", function() {
    var z = new Zart();
    ok(z.StanbolService, "Checking if the Stanbol Service exists.'");
    z.use(new z.StanbolService);

    ok(z.service('stanbol'));

    // Entityhub sites list
    z.service('stanbol').getSites
});
