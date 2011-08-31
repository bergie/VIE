module("zart.js - Type");

test("zart.js - Type API", function() {
    
    var z = new Zart();
  
      // types
  
    ok(z.types);
    ok(typeof z.types === 'object');
    
    ok(z.types.zart);
    
    ok(z.types.add);
    ok(typeof z.types.add === 'function');
    
    ok(z.types.get);
    ok(typeof z.types.get === 'function');
    
    ok(z.types.remove);
    ok(typeof z.types.remove === 'function');
  
    ok(z.types.list);
    ok(typeof z.types.list === 'function');
    
    // Type
    var thingy = z.types.add("TestTypeWithSillyName", []);
    
    ok (thingy);
    ok(thingy instanceof z.Type);
  
    ok(thingy.subsumes);
    ok(typeof thingy.subsumes === 'function');
    
    ok(thingy.isof);
    ok(typeof thingy.isof === 'function');
    
    ok(thingy.extend);
    ok(typeof thingy.extend === 'function');
    
    ok(thingy.attributes);
    ok(typeof thingy.attributes === 'function');
        
    ok(thingy.hierarchy);
    ok(typeof thingy.hierarchy === 'function');
  
    ok(thingy.supertypes);
    ok(typeof thingy.supertypes === 'function');
    
    ok(thingy.subtypes);
    ok(typeof thingy.subtypes === 'function');
    
    ok(thingy.remove);
    ok(typeof thingy.remove === 'function');
});


test("zart.js - Creation/Extension/Removal of types", function() {
    
    var z = new Zart();
    
    equal(z.types.get("TestThingy"), undefined);
    
    var thingy = z.types.add("TestThingy", []);
    
    var persony = thingy.extend("TestPersony", []);
    
    ok(persony);
    ok(persony.isof(thingy));
    ok(thingy.subsumes(persony));
    
    ok (thingy.hierarchy());
    equal (typeof thingy.hierarchy(), 'object');
    var refHierarchy = {
        id : '<' + z.defaultNamespace + "TestThingy" + '>',
        children: [
            {
                id : '<' + z.defaultNamespace + "TestPersony" + '>',
                children: []
            }
        ]
    };
    deepEqual (thingy.hierarchy(), refHierarchy);
    
    ok(z.types.list());
    ok(jQuery.isArray(z.types.list()));
    equal(z.types.list().length, 2);
    equal(z.types.list()[0].id, thingy.id);
    equal(z.types.list()[1].id, persony.id);
    
    var aninamly = thingy.extend("TestAnimaly", []);
    
    var specialCreaturey = persony.extend("SpecialCreaturey", []);
    aninamly.extend(specialCreaturey);
    
    equal(z.types.list().length, 4);
    equal(persony.subtypes().length, 1);
    equal(aninamly.subtypes().length, 1);
    equal(specialCreaturey.supertypes().length, 2);
    
    var veryspecialCreaturey = specialCreaturey.extend("VerySpecialCreatuery", []);
    
    equal(z.types.list().length, 5);
    
    //removes only that type
    z.types.remove(veryspecialCreaturey);
    equal(z.types.list().length, 4);
    
    //recursively removes all types
    z.types.remove(thingy);
    equal(z.types.list().length, 0);
    
    
});