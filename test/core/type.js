module("zart.js - Type");

test("zart.js - Type API", function() {
    
    var z = new Zart();
  
      // types
  
    ok(z.types);
    ok(typeof z.types === 'object');
    
    ok(z.types.zart);
    ok(z.types.zart instanceof Zart);
    
    ok(z.types.add);
    ok(typeof z.types.add === 'function');
    
    ok(z.types.get);
    ok(typeof z.types.get === 'function');
    
    ok(z.types.remove);
    ok(typeof z.types.remove === 'function');
  
    ok(z.types.list);
    ok(typeof z.types.list === 'function');
    ok(z.types.toArray);
    ok(typeof z.types.toArray === 'function');
    
    // Type
    var thingy = z.types.add("TestTypeWithSillyName");
    
    ok (thingy);
    ok(thingy instanceof z.Type);
  
    ok(thingy.zart);
    ok(thingy.zart instanceof Zart);
    
    ok(thingy.id);
    ok(typeof thingy.id === 'string');
    ok(z.namespaces.isUri(thingy.id));
    
    ok(thingy.subsumes);
    ok(typeof thingy.subsumes === 'function');
    
    ok(thingy.isof);
    ok(typeof thingy.isof === 'function');
    
    ok(thingy.inherit);
    ok(typeof thingy.inherit === 'function');
    
    ok(thingy.attributes);
    ok(thingy.attributes instanceof z.Attributes);
        
    ok(thingy.hierarchy);
    ok(typeof thingy.hierarchy === 'function');
  
    ok(thingy.supertypes);
    ok(thingy.supertypes instanceof z.Types);
    
    ok(thingy.subtypes);
    ok(thingy.subtypes instanceof z.Types);
    
    ok(thingy.remove);
    ok(typeof thingy.remove === 'function');
});


test("zart.js - Creation/Extension/Removal of types", function() {

    var z = new Zart();
    
    equal(z.types.get("TestThingy"), undefined);
    
    var thingy = z.types.add("TestThingy");

    var persony = z.types.add("TestPersony").inherit("TestThingy");
    
    ok(persony);
    ok(persony.isof(thingy));
    ok(thingy.subsumes(persony));
    
    ok (thingy.hierarchy());
    equal (typeof thingy.hierarchy(), 'object');
    var refHierarchy = {
        id : '<' + z.namespaces.get("default") + "TestThingy" + '>',
        subtypes: [
            {
                id : '<' + z.namespaces.get("default") + "TestPersony" + '>',
                subtypes: []
            }
        ]
    };
    deepEqual (thingy.hierarchy(), refHierarchy);
    
    ok(z.types.list());
    ok(jQuery.isArray(z.types.list()));
    equal(z.types.list().length, 2);
    equal(z.types.list()[0].id, thingy.id);
    equal(z.types.list()[1].id, persony.id);
    
    var animaly = z.types.add("TestAnimaly").inherit(thingy);
    
    var specialCreaturey = z.types.add("SpecialCreatuery").inherit(persony).inherit(animaly);
    
    equal(z.types.list().length, 4);
    equal(persony.subtypes.list().length, 1);
    equal(animaly.subtypes.list().length, 1);
    equal(specialCreaturey.supertypes.list().length, 2);
    
    var specialCreaturey2 = z.types.add("SpecialCreatuery2").inherit([persony, animaly]);
    equal(z.types.list().length, 5);
    equal(persony.subtypes.list().length, 2);
    equal(animaly.subtypes.list().length, 2);
    equal(specialCreaturey2.supertypes.list().length, 2);
    
    var veryspecialCreaturey = z.types.add("VerySpecialCreatuery").inherit("SpecialCreatuery");
    
    equal(z.types.list().length, 6);
    
    //removes only that type
    z.types.remove(veryspecialCreaturey);
    equal(z.types.list().length, 5);
    
    //recursively removes all types
    z.types.remove(thingy);
    equal(z.types.list().length, 0);
    
    
});