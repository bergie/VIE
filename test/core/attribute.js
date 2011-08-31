module("zart.js - Attribute");

test("zart.js - Attribute API", function() {
    
    var z = new Zart();
    var thingy = z.types.add("TestTThingy", [
        {
            id: "name",
            range: "xsd:string"
        }
    ]);
    
    var attributes = thingy.attributes;
    
    ok(attributes);
    ok(attributes instanceof z.Attributes);
    
    ok(attributes.zart);
    ok(attributes.zart instanceof Zart);
    
    ok(attributes.add);
    ok(typeof attributes.add === 'function');
    
    ok(attributes.extend);
    ok(typeof attributes.extend === 'function');
    
    ok(attributes.get);
    ok(typeof attributes.get === 'function');
    
    ok(attributes.list);
    ok(typeof attributes.list === 'function');

    ok(attributes.remove);
    ok(typeof attributes.remove === 'function');
    
    var name = thingy.attributes.get('name');

    ok (name);
    ok (name instanceof z.Attribute);
    
    ok (name.zart);
    ok (name.zart instanceof Zart);
    
    ok(name.id);
    equal(typeof name.id, 'string');
    
    ok(name.sid);
    equal(typeof name.sid, 'string');
    
    ok(name.extend);
    equal(typeof name.extend, 'function');
    
    ok(name.applies);
    equal(typeof name.applies, 'function');
    
    ok(name.range);
    ok(jQuery.isArray(name.range));
    
    ok(name.remove);
    equal(typeof name.remove, 'function');
    
});

test("zart.js - Creation/Alteration/Removal of Attributes", function() {
    
    var z = new Zart();
    
    var tt1 = z.types.add("TestType1", [
        {
            id: "attr0",
            range: "xsd:string"
        }
    ]);
    var tt2 = z.types.add("TestType2", [
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
    ]);
    var tt3 = z.types.add("TestType3", [
        {
            id: "attr0",
            range: "xsd:integer"
        },
        {
            id: "attr1",
            range: "xsd:string"
        }

    ]);
    var tt4 = z.types.add("TestType4", [
        {
            id: "attr0",
            range: "xsd:double"
        }
    ]);
    
    var tt5 = tt2.extend("TestType5", []);
    tt3.extend(tt5);
    
    var tt6 = tt3.extend("TestType6", [
        {
            id: "attr3",
            range: "xsd:string"
        }
    ]);
    tt4.extend(tt6);
    
    //setting up ends here
    //now start testing
    
    ok(tt1);
    ok(tt2);
    ok(tt3);
    ok(tt4);
    ok(tt5);
    ok(tt6);
    
    ok (tt1.attributes);
    ok(tt1.attributes instanceof z.Attributes);
    ok(jQuery.isArray(tt1.attributes.list()));
    
    equal(tt1.attributes.list().length, 1);
    equal(tt2.attributes.list().length, 3);
    equal(tt3.attributes.list().length, 2);
    equal(tt4.attributes.list().length, 1);
    equal(tt5.attributes.list().length, 3);
    equal(tt6.attributes.list().length, 4);
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
    equal(tt5.attributes.get('attr0').range.length, 1);
    equal(tt5.attributes.get('attr0').range[0], "xsd:integer");
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