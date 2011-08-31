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
    
    ok(name.range);
    ok(jQuery.isArray(name.range));
    
    ok(name.remove);
    equal(typeof name.remove, 'function');
    
});

test("zart.js - Creation/Alteration/Removal of Attributes", function() {
    
    var z = new Zart();
    
    var thingy = z.types.add("TestThingy", [
        {
            id: "name",
            range: "xsd:string"
        }
    ]);
    
    var persony = thingy.extend("TestPersony", [
        {
            id: "knows",
            range: "TestPersony"
        }
    ]);
    
    var animaly = thingy.extend("TestAnimaly", [
        {
            id: "knows",
            range: "TestAnimaly"
        }
    ]);
    
    var animaly2 = thingy.extend("TestAnimaly2", [
        {
            id: "knows",
            range: "TestAnimaly"
        }
    ]);
    
    var creaturey = persony.extend("TestCreaturey", [
        {
            id: "name",
            range: "xsd:integer"
        },
        {
            id: "label",
            range: "xsd:string"
        }
    ]);
    
    animaly.extend(creaturey);
    animaly2.extend(creaturey);
    
    ok(creaturey.attributes);
    ok(creaturey.attributes instanceof z.Attributes);
    ok(jQuery.isArray(creaturey.attributes.list()));
    equal(creaturey.attributes.list().length, 3);

    equal(creaturey.attributes.get('name').range.length, 1);
    equal(creaturey.attributes.get('name').range[0], "xsd:integer");
    equal(creaturey.attributes.get('label').range.length, 1);
    equal(creaturey.attributes.get('label').range[0], "xsd:string");
    
    ok(creaturey.attributes.get('knows'));
    equal(creaturey.attributes.get('knows').range.length, 2);
    equal(creaturey.attributes.get('knows').range[0], "TestAnimaly");
    equal(creaturey.attributes.get('knows').range[1], "TestPersony");
    
    equal(creaturey.attributes.get('unknownAttribute'), undefined);
    
});