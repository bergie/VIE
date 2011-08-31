module("zart.js - Schema.org Ontology");

test("Initialization", function() {
    var z = new Zart();
    
    ok(z.loadSchemaOrg);
    equal(typeof z.loadSchemaOrg, "function");
    
    z.loadSchemaOrg();
    
    equal(z.types.list().length, 296);
    
    //just pick some and test them:
    ok (z.types.get("Person"));
    ok (z.types.get("Corporation"));
    debugger;
    ok (z.types.get("Corporation").isof("Thing"));
    ok (z.types.get("Organization").subsumes("Corporation"));
    
});
