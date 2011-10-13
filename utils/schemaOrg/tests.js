module("vie.js - Schema.org Ontology");

test("Initialization", function() {
    var z = new VIE();
    
    ok(z.loadSchemaOrg);
    equal(typeof z.loadSchemaOrg, "function");
    
    z.loadSchemaOrg();
    
    equal(z.types.list().length, 296);
    
    //just pick some and test them:
    ok (z.types.get("Person"));
    ok (z.types.get("Corporation"));
    ok (z.types.get("Corporation").isof("Thing"));
    ok (z.types.get("Organization").subsumes("Corporation"));
    
    ok (z.types.get("Person").id.indexOf("<http://schema.org/") === 0);
    
    
    var hospital = z.types.get("Hospital");
    ok (hospital);
    equal( hospital.attributes.list().length, 27);
    
    equal(hospital.attributes.get('description').range.length, 1);
    equal(hospital.attributes.get('description').range[0], "Text");
    equal(hospital.attributes.get('geo').range.length, 1);
    equal(hospital.attributes.get('geo').range[0], "GeoCoordinates");
    equal(hospital.attributes.get('location').range.length, 2);
    equal(hospital.attributes.get('location').range[0], "Place");
    equal(hospital.attributes.get('location').range[1], "PostalAddress");
    
    raises(function () {
        hospital.attributes.remove("description");
    });
    
    z.types.get("Organization").attributes.remove("founders");
    
    equal( hospital.attributes.list().length, 26);
});
