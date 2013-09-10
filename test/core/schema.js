module("vie.js - Schema.org Ontology");

// Update these when Schema.org ontologies change
var schemaOrgNumbers = {
  types: 429,
  hospitalAttribs: 53
};

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
            ok(z.types.list().length >= schemaOrgNumbers.types, "Check for a minimum number of Schema.org types.");

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
            equal(hospAttrs.length, schemaOrgNumbers.hospitalAttribs);
            
            equal(hospital.attributes.get('description').range.length, 1);
            equal(hospital.attributes.get('description').range[0], "Text");
            equal(hospital.attributes.get('geo').range.length, 2);
            equal(hospital.attributes.get('geo').range[0], "GeoCoordinates");
            equal(hospital.attributes.get('location').range.length, 2);
            equal(hospital.attributes.get('location').range[0], "PostalAddress");
            equal(hospital.attributes.get('location').range[1], "Place");
            
            // Test metadata
            ok(hospital.metadata);
            equal(hospital.metadata.label, 'Hospital');
            equal(hospital.metadata.url, 'http://schema.org/Hospital');
            
            ok(hospital.attributes.get('description').metadata);
            equal(hospital.attributes.get('description').metadata.label, 'Description');
            
            raises(function () {
                hospital.attributes.remove("description");
            });
            
            z.types.get("Organization").attributes.remove("founders");
            
            equal(hospital.attributes.list().length, schemaOrgNumbers.hospitalAttribs - 1);
            start();
        },
        error : function (msg) {
            ok(false, msg);
            start();
        }
    });

});

test("Hierarchy Metadata", function() {
    var z = new VIE();
    z.namespaces.addOrReplace('typo3', 'http://typo3.org/ns');

    ok(z.loadSchema);
    equal(typeof z.loadSchema, "function");

    VIE.Util.loadSchemaOrg(z, {
        properties: {},
        types: {
            'typo3:Foo.Bar': {
                id: 'typo3:Foo.Bar',
                metadata: {
                    group: 'Test',
                    other: 'Foo'
                },
                supertypes: ['typo3:Other'],
                subtypes: [],
                specific_properties: [],
                properties: []
            },
            'typo3:Other': {
                id: 'typo3:Other',
                metadata: {
                    some: 'thing',
                    prop2: 'val2'
                },
                subtypes: ['typo3:Foo.Bar'],
                supertypes: [],
                specific_properties: [],
                properties: []
            }
        }
    }, null);

    equal(z.types.get('typo3:Foo.Bar').metadata.group, 'Test');
    equal(z.types.get('typo3:Foo.Bar').metadata.other, 'Foo');
    equal(z.types.get('typo3:Other').metadata.some, 'thing');
    equal(z.types.get('typo3:Other').metadata.prop2, 'val2');
});
