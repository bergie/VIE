module("zart.js - Type");

test("zart.js - Type API", 23, function() {
    
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
    
    ok(thingy.extend);
    ok(typeof thingy.extend === 'function');
    
    ok(thingy.attributes);
    ok(typeof thingy.attributes === 'function');
    
    ok(thingy.parent);
    ok(typeof thingy.parent === 'function');
    
    ok(thingy.hierarchy);
    ok(typeof thingy.hierarchy === 'function');
  
});
/*
test("VIE2.Type initialization", 8, function() {

    var t1 = VIE2.getType('TestType1');
    equal(t1, undefined);
    
    var newType1 = new VIE2.Type('TestType1', undefined, [], {});
    var newType1Singleton = new VIE2.Type('TestType1', undefined, [], {});
    var newType1Getted = new VIE2.Type('TestType1', undefined, [], {});
    var newType2 = new VIE2.Type('TestType2', undefined, [], {});
    
    var t1 = VIE2.getType('TestType1');
    
    ok(t1);
    
    equal(newType1, t1);
    
    equal(newType1, newType1Singleton);
    equal(newType1, newType1Getted);
    
    notEqual(newType1, newType2);
    
    equal(newType1.id, '<' + VIE2.baseNamespace + 'TestType1>');
    equal(newType1.sid, 'TestType1');
    
});

test("VIE2.unregisterType()", 2, function () {
    
    var newType1 = new VIE2.Type('TestType1', undefined, [], {});
    var t1 = VIE2.getType('TestType1');
    
    ok(t1);
    
    VIE2.unregisterType('TestType1');
    var t2 = VIE2.getType('TestType1');
    
    equal(t2, undefined);
        
});

test("VIE2.Type.listAttrs()", 2, function () {
    
    var newType1 = new VIE2.Type('TestTypeAttr1', undefined, [
        {'id'       : 'test',
         'datatype' : 'string'
         }], {});
         
     var newType1 = new VIE2.Type('TestTypeAttr2', undefined, [
        {'id'       : 'test',
         'datatype' : 'string'
         },
         {'id'       : 'test2',
         'datatype' : 'string'
         }], {});
         
    var t1 = VIE2.getType('TestTypeAttr1');
    var t2 = VIE2.getType('TestTypeAttr2');
    
    equal(t1.listAttrs().length, 1);
    equal(t2.listAttrs().length, 2);
    
    VIE2.unregisterType('TestTypeAttr1');
    VIE2.unregisterType('TestTypeAttr2');
        
});

test("VIE2.Type.getAttr()", 2, function () {
    
    var newType1 = new VIE2.Type('TestTypeAttr1', undefined, [
        {'id'       : 'test',
         'datatype' : 'string'
         },
         {'id'       : 'test2',
         'datatype' : 'string'
         }], {});
         
    var t1 = VIE2.getType('TestTypeAttr1');
    
    ok(t1.getAttr('test'));
    
    raises(function(){
        t1.getAttr('notKnownAttribute');
    });
    
    VIE2.unregisterType('TestTypeAttr1');
        
});

test("VIE2.getType()", 4, function () {
    
    var newType1 = new VIE2.Type('TestType1', undefined, [], {});
    
    var t1 = VIE2.getType('TestType1');
    var t2 = VIE2.getType('test:TestType1');
    var t3 = VIE2.getType('<' + VIE2.baseNamespace + 'TestType1>');
    var t4 = VIE2.getType(VIE2.baseNamespace + 'TestType1');
    
    ok(t1);
    
    equal(t1, t2);
    equal(t2, t3);
    equal(t3, t4);
    
});


test("VIE2.Type.getParent()", 11, function () {
    
    var newType1 = new VIE2.Type('TestTypeAttr1', undefined, [
        {'id'       : 'test',
         'datatype' : 'string'
         }], {});
         
     var newType2 = new VIE2.Type('TestTypeAttr2', 'TestTypeAttr1', [
        {'id'       : 'test',
         'datatype' : 'string'
         },
         {'id'       : 'test2',
         'datatype' : 'string'
         }], {});
         
     var newType3 = new VIE2.Type('TestTypeAttr3', ['TestTypeAttr1', 'TestTypeAttr2'], [
        {'id'       : 'test',
         'datatype' : 'string'
         },
         {'id'       : 'test2',
         'datatype' : 'string'
         }], {});
         
     ok(newType1);
     ok(newType2);
     ok(newType3);
         
    equal(newType1.getParent(), undefined);
    ok($.isArray(newType2.getParent()));
    equal(newType2.getParent().length, 1);
    equal(newType2.getParent()[0].id, newType1.id);
    ok($.isArray(newType3.getParent()));
    equal(newType3.getParent().length, 2);
    equal(newType3.getParent()[0].id, newType1.id);
    equal(newType3.getParent()[1].id, newType2.id);
    
    VIE2.unregisterType('TestTypeAttr1');
    VIE2.unregisterType('TestTypeAttr2');
    VIE2.unregisterType('TestTypeAttr3');
        
});

test("VIE2.Type.listChildren()", 2, function () {
    
    var newType1 = new VIE2.Type('TestTypeAttr1', undefined, [
        {'id'       : 'test',
         'datatype' : 'string'
         }], {});
         
     var newType2 = new VIE2.Type('TestTypeAttr2', 'TestTypeAttr1', [
        {'id'       : 'test',
         'datatype' : 'string'
         },
         {'id'       : 'test2',
         'datatype' : 'string'
         }], {});
         
    equal(newType1.listChildren().length, 1);
    equal(newType2.listChildren().length, 0);
    
    VIE2.unregisterType('TestTypeAttr1');
    VIE2.unregisterType('TestTypeAttr2');
        
});

test("VIE2.Type.isTypeOf()", 7, function () {
    
    var newType1 = new VIE2.Type('TestTypeAttr1', undefined, [
        {'id'       : 'test',
         'datatype' : 'string'
         }], {});
         
     var newType2 = new VIE2.Type('TestTypeAttr2', 'TestTypeAttr1', [
        {'id'       : 'test',
         'datatype' : 'string'
         },
         {'id'       : 'test2',
         'datatype' : 'string'
         }], {});
         
    equal(newType1.isTypeOf('TestTypeAttr1'), true);
    equal(newType1.isTypeOf('TestTypeAttr2'), false);
    
    equal(newType1.isTypeOf(undefined), false);
    
    equal(newType1.isTypeOf(newType1), true);
    equal(newType1.isTypeOf(newType2), false);
    
    equal(newType2.isTypeOf(newType2), true);
    equal(newType2.isTypeOf(newType1), true);

    
    VIE2.unregisterType('TestTypeAttr1');
    VIE2.unregisterType('TestTypeAttr2');
        
});

test("VIE2.Type.subsumesTypes()", 5, function () {
    
    var newType1 = new VIE2.Type('TestTypeAttr1', undefined, [
        {'id'       : 'test',
         'datatype' : 'string'
         }], {});
         
     var newType2 = new VIE2.Type('TestTypeAttr2', 'TestTypeAttr1', [
        {'id'       : 'test',
         'datatype' : 'string'
         },
         {'id'       : 'test2',
         'datatype' : 'string'
         }], {});
         
    equal(newType1.subsumesTypes('TestTypeAttr1'), true);
    equal(newType1.subsumesTypes('TestTypeAttr2'), true);
    equal(newType1.subsumesTypes(['TestTypeAttr1', 'TestTypeAttr2']), true);
    
    equal(newType2.subsumesTypes('TestTypeAttr1'), false);
    
    equal(newType1.subsumesTypes(undefined), false);
        
    VIE2.unregisterType('TestTypeAttr1');
    VIE2.unregisterType('TestTypeAttr2');
        
});

test("VIE2.Type.toHierarchyObject()", 7, function () {
    
    var newType1 = new VIE2.Type('TestTypeAttr1', undefined, [
        {'id'       : 'test',
         'datatype' : 'string'
         }], {});
         
     var newType2 = new VIE2.Type('TestTypeAttr2', 'TestTypeAttr1', [
        {'id'       : 'test',
         'datatype' : 'string'
         },
         {'id'       : 'test2',
         'datatype' : 'string'
         }], {});
    
    var t1Hierarchy = newType1.toHierarchyObject();
    var t2Hierarchy = newType2.toHierarchyObject();
         
    ok(t1Hierarchy instanceof Object);
    ok(typeof t1Hierarchy === 'object');
    
    equal(t1Hierarchy.id, newType1.id);
    equal(t1Hierarchy.children.length, newType1.listChildren().length);
    equal(t1Hierarchy.children[0].id, newType2.id);
    
    equal(t2Hierarchy.id, newType2.id);
    equal(t2Hierarchy.children.length, 0);
    
    VIE2.unregisterType('TestTypeAttr1');
    VIE2.unregisterType('TestTypeAttr2');
        
});
*/