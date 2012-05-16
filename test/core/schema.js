module("vie.js - Schema.org Ontology");

test("Initialization", function() {
    var z = new VIE();
    
    ok(z.loadSchema);
    equal(typeof z.loadSchema, "function");
    
    if (navigator.userAgent === 'Zombie') {
        // ignore this test on the headless browser
        return;
    }
    
    stop();
    z.loadSchema("http://schema.rdfs.org/all.json", {
        baseNS : "http://schema.org/",
        success : function () {
            ok(true, "successfully loaded types!");
            equal(z.types.list().length, 303);
            
            //just pick some and test them:
            ok (z.types.get("Person"));
            ok (z.types.get("Corporation"));
            ok (z.types.get("Corporation").isof("Thing"));
            ok (z.types.get("Organization").subsumes("Corporation"));
            ok (z.types.get("BowlingAlley").isof("Thing"));
            
            ok (z.types.get("Person").id.indexOf("<http://schema.org/") === 0);
            
            
            var hospital = z.types.get("Hospital");
            ok (hospital);
            var hospAttrs = hospital.attributes.list();
            equal( hospAttrs.length, 35);
            
            equal(hospital.attributes.get('description').range.length, 1);
            equal(hospital.attributes.get('description').range[0], "Text");
            equal(hospital.attributes.get('geo').range.length, 2);
            equal(hospital.attributes.get('geo').range[0], "GeoCoordinates");
            equal(hospital.attributes.get('location').range.length, 2);
            equal(hospital.attributes.get('location').range[0], "PostalAddress");
            equal(hospital.attributes.get('location').range[1], "Place");
            
            raises(function () {
                hospital.attributes.remove("description");
            });
            
            z.types.get("Organization").attributes.remove("founders");
            
            equal( hospital.attributes.list().length, 34);
            start();
        },
        error : function (msg) {
            ok(false, msg);
            start();
        }
    });
    
});
