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
    var thingy = z.types.add("TestTypeWithSillyName", undefined, []);
    
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
    
    ok(thingy.parent);
    ok(typeof thingy.parent === 'function');
    
    ok(thingy.hierarchy);
    ok(typeof thingy.hierarchy === 'function');
  
});