module("VIE - Attribute");

test("VIE - Attribute API", function() {
    
    var v = new VIE();
    v.namespaces.add("xsd", "http://www.w3.org/2001/XMLSchema#");
    var thingy = v.types.add("TestTThingy", [
        {
            id: "name",
            range: "xsd:string"
        }
    ]);
    
    var attributes = thingy.attributes;
    
    ok(attributes);
    ok(attributes instanceof v.Attributes);
    
    ok(attributes.vie);
    ok(attributes.vie instanceof VIE);
    
    ok(attributes.add);
    ok(typeof attributes.add === 'function');
    
    ok(attributes.get);
    ok(typeof attributes.get === 'function');
    
    ok(attributes.toArray);
    ok(typeof attributes.toArray === 'function');
    ok(attributes.list);
    ok(typeof attributes.list === 'function');

    ok(attributes.remove);
    ok(typeof attributes.remove === 'function');
    
    
    var name = attributes.get('name');

    ok (name);
    ok (name instanceof v.Attribute);
    
    
    ok (name.vie);
    ok (name.vie instanceof VIE);
    
    ok(name.id);
    equal(typeof name.id, 'string');
    
    ok (name.min !== undefined);
    equal (typeof name.min, "number");
    
    ok (name.max);
    equal (typeof name.max, "number");
        
    ok(name.applies);
    equal(typeof name.applies, 'function');
    
    ok(name.range);
    ok(jQuery.isArray(name.range));
        
});

test("VIE - Creation/Alteration/Removal of Attributes", function() {
    
    var v = new VIE();
    v.namespaces.add("xsd", "http://www.w3.org/2001/XMLSchema#");
    
    var tt1 = v.types.add("TestType1", [
        {
            id: "attr0",
            range: "xsd:string"
        }
    ]);
    var tt2 = v.types.add("TestType2", [
        {
            id: "attr0",
            range: "xsd:string"
        },
        {
            id: "attr1",
            range: "xsd:string"
        },
        {
            id: "attr2",
            range: "xsd:string"
        }
    ]).inherit(tt1);
    var tt3 = v.types.add("TestType3", [
        {
            id: "attr0",
            range: "xsd:integer"
        },
        {
            id: "attr1",
            range: "xsd:string"
        }

    ]).inherit(tt1);
    var tt4 = v.types.add("TestType4", [
        {
            id: "attr0",
            range: "xsd:double"
        }
    ]).inherit(tt1);
    
    var tt5 = v.types.add("TestType5", []).inherit([tt2, tt3]);
    var tt6 = v.types.add("TestType6", [
        {
            id: "attr3",
            range: "xsd:string"
        }
    ]).inherit([tt3, tt4]);
    
    //setting up ends here
    //now start testing
    
    ok(tt1);
    ok(tt2);
    ok(tt3);
    ok(tt4);
    ok(tt5);
    ok(tt6);
    
    ok (tt1.attributes);
    ok(tt1.attributes instanceof v.Attributes);
    ok(jQuery.isArray(tt1.attributes.list()));
    
    equal(tt1.attributes.list().length, 1);
    equal(tt2.attributes.list().length, 3);
    equal(tt3.attributes.list().length, 2);
    equal(tt4.attributes.list().length, 1);
    equal(tt5.attributes.list().length, 3);
    equal(tt6.attributes.list().length, 3);
    equal(tt6.attributes.list("xsd:string").length, 2);
    
    equal(tt6.attributes.list("xsd:string").length, 2);
    
    equal(tt1.attributes.get('attr0').range.length, 1);
    equal(tt1.attributes.get('attr0').range[0], "xsd:string");
    equal(tt2.attributes.get('attr0').range.length, 1);
    equal(tt2.attributes.get('attr0').range[0], "xsd:string");
    equal(tt2.attributes.get('attr1').range.length, 1);
    equal(tt2.attributes.get('attr1').range[0], "xsd:string");
    equal(tt2.attributes.get('attr2').range.length, 1);
    equal(tt2.attributes.get('attr2').range[0], "xsd:string");
    equal(tt3.attributes.get('attr0').range.length, 1);
    equal(tt3.attributes.get('attr0').range[0], "xsd:integer");
    equal(tt3.attributes.get('attr1').range.length, 1);
    equal(tt3.attributes.get('attr1').range[0], "xsd:string");
    equal(tt4.attributes.get('attr0').range.length, 1);
    equal(tt4.attributes.get('attr0').range[0], "xsd:double");
    equal(tt5.attributes.get('attr0').range.length, 2);
    equal(tt5.attributes.get('attr0').range[0], "xsd:string");
    equal(tt5.attributes.get('attr0').range[1], "xsd:integer");
    equal(tt5.attributes.get('attr1').range.length, 1);
    equal(tt5.attributes.get('attr1').range[0], "xsd:string");
    equal(tt5.attributes.get('attr2').range.length, 1);
    equal(tt5.attributes.get('attr2').range[0], "xsd:string");
    equal(tt6.attributes.get('attr0').range.length, 2);
    equal(tt6.attributes.get('attr0').range[0], "xsd:integer");
    equal(tt6.attributes.get('attr0').range[1], "xsd:double");
    equal(tt6.attributes.get('attr1').range.length, 1);
    equal(tt6.attributes.get('attr1').range[0], "xsd:string");
    equal(tt6.attributes.get('attr3').range.length, 1);
    equal(tt6.attributes.get('attr3').range[0], "xsd:string");
    
    equal(tt1.attributes.get('unknownAttribute'), undefined);
    
});


test("VIE - Attributes min and max", function() {
    
     var v = new VIE();
    v.namespaces.add("xsd", "http://www.w3.org/2001/XMLSchema#");
    
    var tt1 = v.types.add("TestType1", [
        {
            id: "attr0",
            range: "xsd:string"
        }
    ]);
    
    ok(tt1);
    ok(tt1.attributes.get("attr0"));
    ok(tt1.attributes.get("attr0").min !== undefined);
    equal(tt1.attributes.get("attr0").min, 0);
    ok(tt1.attributes.get("attr0").max !== undefined);
    equal(tt1.attributes.get("attr0").max, 1);
    
    var tt2 = v.types.add("TestType2", [
        {
            id: "attr0",
            range: "xsd:string",
            min: 3,
            max: 4
        }
    ]);
    
    ok(tt2);
    ok(tt2.attributes.get("attr0"));
    ok(tt2.attributes.get("attr0").min !== undefined);
    equal(tt2.attributes.get("attr0").min, 3);
    ok(tt2.attributes.get("attr0").max !== undefined);
    equal(tt2.attributes.get("attr0").max, 4);
    
    var tt3 = v.types.add("TestType3", [
        {
            id: "attr0",
            range: "xsd:string",
            min: 3,
            max: 3
        }
    ]);
    
    ok(tt3);
    ok(tt3.attributes.get("attr0"));
    ok(tt3.attributes.get("attr0").min !== undefined);
    equal(tt3.attributes.get("attr0").min, 3);
    ok(tt3.attributes.get("attr0").max !== undefined);
    equal(tt3.attributes.get("attr0").max, 3);
    
    var tt4 = v.types.add("TestType4", [
        {
            id: "attr0",
            range: "xsd:string",
            min: -1,
            max: 3
        }
    ]);
    
    ok(tt4);
    ok(tt4.attributes.get("attr0"));
    ok(tt4.attributes.get("attr0").min !== undefined);
    equal(tt4.attributes.get("attr0").min, 0);
    ok(tt4.attributes.get("attr0").max !== undefined);
    equal(tt4.attributes.get("attr0").max, 3);
    
    var tt5 = v.types.add("TestType5", [
        {
            id: "attr0",
            range: "xsd:string",
            min: 15,
            max: 3
        }
    ]);
    
    ok(tt5);
    ok(tt5.attributes.get("attr0"));
    ok(tt5.attributes.get("attr0").min !== undefined);
    equal(tt5.attributes.get("attr0").min, 15);
    ok(tt5.attributes.get("attr0").max !== undefined);
    equal(tt5.attributes.get("attr0").max, 15);

    var tt6 = v.types.add("TestType6", [
        {
          id: "attr0",
          range: "xsd:string",
          min: 4,
          max: -1
        }
    ]);

    ok(tt6);
    equal(tt6.attributes.get("attr0").min, 4);
    equal(tt6.attributes.get("attr0").max, Number.MAX_VALUE);
});


test("VIE - Attributes min and max (inheritance)", function() {
    var v = new VIE();
    v.namespaces.add("xsd", "http://www.w3.org/2001/XMLSchema#");
    
    v.types.add("Table", [
        {
            id: "leg",
            range: "xsd:string",
            min: 1,
            max: -1
        }
    ]);
    
    v.types.add("ObjectWithADrawer", [
        {
            id: "drawer",
            range: "xsd:string",
            min: 1,
            max: 1
        }
    ]);
    
    v.types.add("TableWithADrawer").inherit(["Table", "ObjectWithADrawer"]);
    
    var twad = v.types.get("TableWithADrawer");
    equal(twad.attributes.get("leg").min, 1);
    equal(twad.attributes.get("leg").max, Number.MAX_VALUE);
    equal(twad.attributes.get("drawer").min, 1);
    equal(twad.attributes.get("drawer").max, 1);
    
    v.types.add("ThreeLeggedFurniture", [
        {
            id: "leg",
            range: "xsd:string",
            min: 3,
            max: 3
        }
    ]);
    
    v.types.add("ThreeLeggedTableWithADrawer").inherit(["TableWithADrawer", "ThreeLeggedFurniture"]);
    
    var tltwad = v.types.get("ThreeLeggedTableWithADrawer");
    equal(tltwad.attributes.get("leg").min, 3);
    equal(tltwad.attributes.get("leg").max, 3);
    equal(tltwad.attributes.get("drawer").min, 1);
    equal(tltwad.attributes.get("drawer").max, 1);
    
    
    v.types.add("FourLeggedFurniture", [
        {
            id: "leg",
            range: "xsd:string",
            min: 4,
            max: 4
        }
    ]);
    
    raises(function () {
        v.types.add("FourLeggedTableWithADrawer")
        .inherit(["TableWithADrawer", "FourLeggedFurniture", "ThreeLeggedFurniture"]);
    });
    
});

