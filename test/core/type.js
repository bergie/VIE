module("VIE - Type");

test("VIE - Type API", function() {
    
    var v = new VIE();
  
      // types
  
    ok(v.types);
    ok(typeof v.types === 'object');

    ok(v.types.vie);
    ok(v.types.vie instanceof VIE);
    
    ok(v.types.add);
    ok(typeof v.types.add === 'function');
    
    ok(v.types.addOrOverwrite);
    ok(typeof v.types.addOrOverwrite === 'function');
    
    ok(v.types.get);
    ok(typeof v.types.get === 'function');
    
    ok(v.types.remove);
    ok(typeof v.types.remove === 'function');
  
    ok(v.types.list);
    ok(typeof v.types.list === 'function');
    ok(v.types.toArray);
    ok(typeof v.types.toArray === 'function');
    
    ok(v.types.sort);
    ok(typeof v.types.sort === 'function');
    
    // Type
    var thingy = v.types.add("TestTypeWithSillyName");
    
    ok (thingy);
    ok(thingy instanceof v.Type);
  
    ok(thingy.vie);
    ok(thingy.vie instanceof VIE);
    
    ok(thingy.id);
    ok(typeof thingy.id === 'string');
    ok(v.namespaces.isUri(thingy.id));
    
    ok(thingy.subsumes);
    ok(typeof thingy.subsumes === 'function');
    
    ok(thingy.isof);
    ok(typeof thingy.isof === 'function');
    
    ok(thingy.inherit);
    ok(typeof thingy.inherit === 'function');
    
    ok(thingy.attributes);
    ok(thingy.attributes instanceof v.Attributes);
        
    ok(thingy.hierarchy);
    ok(typeof thingy.hierarchy === 'function');
  
    ok(thingy.supertypes);
    ok(thingy.supertypes instanceof v.Types);
    
    ok(thingy.subtypes);
    ok(thingy.subtypes instanceof v.Types);
    
    ok(thingy.toString);
    ok(typeof thingy.toString === 'function');
    
    ok (thingy.instance);
    ok(typeof thingy.instance === "function");
});


test("VIE - Creation/Extension/Removal of types", function() {

    var v = new VIE();

    equal(v.types.get("TestThingy"), undefined);
    
    var thingy = v.types.add("TestThingy");

    var persony = v.types.add("TestPersony").inherit("TestThingy");
    ok(persony);
    ok(persony.isof(thingy));
    equal(persony.isof('dbpedia:nonsensetype'), false);
    equal(persony.isof(new v.Type('dbpedia:nonsensetype')), false);

    ok(thingy.subsumes(persony));
    
    ok (thingy.hierarchy());
    equal (typeof thingy.hierarchy(), 'object');
    var refHierarchy = {
        id : '<' + v.namespaces.base() + "TestThingy" + '>',
        subtypes: [
            {
                id : '<' + v.namespaces.base() + "TestPersony" + '>',
                subtypes: []
            }
        ]
    };
    deepEqual (thingy.hierarchy(), refHierarchy);
    
    ok(v.types.list());
    ok(jQuery.isArray(v.types.list()));
    equal(v.types.list().length, 3);
    equal(v.types.list()[0].id, v.types.get('owl:Thing').id);
    equal(v.types.list()[1].id, thingy.id);
    equal(v.types.list()[2].id, persony.id);
    
    var animaly = v.types.add("TestAnimaly").inherit(thingy);
    
    var specialCreaturey = v.types.add("SpecialCreatuery").inherit(persony).inherit(animaly);

    equal(v.types.list().length, 5);
    equal(persony.subtypes.list().length, 1);
    equal(animaly.subtypes.list().length, 1);
    equal(specialCreaturey.supertypes.list().length, 2);
    
    var specialCreaturey2 = v.types.add("SpecialCreatuery2").inherit([persony, animaly]);
    equal(v.types.list().length, 6);
    equal(persony.subtypes.list().length, 2);
    equal(animaly.subtypes.list().length, 2);
    equal(specialCreaturey2.supertypes.list().length, 2);
    
    var veryspecialCreaturey = v.types.add("VerySpecialCreatuery").inherit("SpecialCreatuery");
    
    equal(v.types.list().length, 7);
    
    //removes only that type
    v.types.remove(veryspecialCreaturey);
    equal(v.types.list().length, 6);
    
    //removes only that type
    v.types.remove("SpecialCreatuery");
    equal(v.types.list().length, 5);
    
    //recursively removes all types
    v.types.remove(thingy);
    equal(v.types.list().length, 1);
    
    //you cannot remove owl:Thing
    v.types.remove("owl:Thing");
    equal(v.types.list().length, 1);
});

test("VIE - Instantiation of types", function() {

    var v = new VIE();

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

    var type1Instance = tt1.instance();
    
    var type2Instance = tt2.instance({"attr0" : "This is a test."});
    
    ok(type1Instance);
    ok(type2Instance);
    ok(type1Instance.isEntity);
    ok(type2Instance.isEntity);
    equal(type2Instance.get("attr0"), "This is a test.");
});

test("VIE - Type Sorting", function () {
    var v = new VIE();
    v.namespaces.add("xsd", "http://www.w3.org/2001/XMLSchema#");
    var tt1 = v.types.add("TestType1", []);
    var tt2 = v.types.add("TestType2", []).inherit(tt1);
    var tt3 = v.types.add("TestType3", []).inherit(tt1);
    var tt4 = v.types.add("TestType4", []).inherit(tt1);
    
    var tt5 = v.types.add("TestType5", []).inherit([tt2, tt3]);
    var tt6 = v.types.add("TestType6", []).inherit([tt3, tt4]);
    
    var array = ["TestType5", "TestType2", "TestType4", "TestType6", "TestType3", "TestType1"];
    
    var shuffle = $.merge([], array);
    shuffle.sort(function() {return 0.5 - Math.random();});
    

    var sortedArrayAsc1 = v.types.sort(array);
    var sortedArrayAsc2 = v.types.sort(shuffle);

    var sortedArrayDesc1 = v.types.sort(array, true);
    var sortedArrayDesc2 = v.types.sort(shuffle, true);

    ok(sortedArrayAsc1);
    ok(sortedArrayAsc2);
    
    ok(sortedArrayDesc1);
    ok(sortedArrayDesc2);
    
    var test = function (arr) {
        for (var i = 0; i < arr.length; i++) {
            for (var j = 0; j < i-1; j++) {
                if (v.types.get(arr[i]).subsumes(arr[j]))
                    return false;
            }
        }
        return true;
    };

    ok(test(sortedArrayAsc1.reverse()));
    ok(test(sortedArrayAsc2.reverse()));
    ok(test(sortedArrayDesc1));
    ok(test(sortedArrayDesc2));
    
    ok(v.types.sort([]));
    equal(v.types.sort([]).length, [].length);
    
    equal(v.types.sort(["TestType1"]).length, 1);
    equal(v.types.sort(["TestType1"])[0], "TestType1");

    
});

test("VIE - Type form schema generation", function () {
    var v = new VIE();
    v.namespaces.add("xsd", "http://www.w3.org/2001/XMLSchema#");

    // Define an 'article' type
    var article = new v.Type("Article");
    var person = new v.Type("Person");

    // Define some properties
    var title = new v.Attribute("title", ["xsd:string"], article, 1, 1);
    var content = new v.Attribute("content", ["xsd:string"], article, 0, 1);
    var published = new v.Attribute("published", ["xsd:dateTime"], article, 0, 1);
    var author = new v.Attribute("author", [person], article, 1, 1);
    article.attributes.add([title, content, published, author]);

    // Tell VIE about the type
    v.types.add([person, article]);

    // Check that the type information looks correct
    equal(article.attributes.toArray().length, 4);
    equal(v.types.toArray().length, 3);

    // Create an entity with the type
    var entity = new v.Entity({'@type': 'Article'});
    ok(entity.vie);
    ok(entity.vie.types);

    // Generate a Backbone Form schema for the entity
    var schema = VIE.Util.getFormSchema(entity);
    ok(schema.published);
    equal(schema.published.type, 'DateTime');
    author = new schema.author.model();
    ok(author.isEntity);
});

test("VIE - Type based validation", function () {
    var v = new VIE();
    v.namespaces.add("xsd", "http://www.w3.org/2001/XMLSchema#");

    // Define an 'article' type
    var article = new v.Type("Article");
    var person = new v.Type("Person");

    // Define some properties
    var title = new v.Attribute("title", ["xsd:string"], article, 1, 1);
    var content = new v.Attribute("content", ["xsd:string"], article, 0, 1);
    var published = new v.Attribute("published", ["xsd:dateTime"], article, 0, 1);
    var author = new v.Attribute("author", [person], article, 1, 1);
    article.attributes.add([title, content, published, author]);

    // Tell VIE about the types
    v.types.add([person, article]);

    // Create an entity with the type
    var entity = new v.Entity({'@type': 'Article'});
    ok(entity);

    // Check validation of required properties
    var results = entity.validate(entity.attributes);
    ok(results);
    if (results !== undefined) {
      ok(_.isArray(results));
      equal(results.length, 2);
    }

    // Ensure that minimum checks also affect empty values
    entity.set('title', '');
    results = entity.validate(entity.attributes);
    ok(results);
    if (results !== undefined) {
      ok(_.isArray(results));
      equal(results.length, 2);
    }
    equal(entity.has('title'), false);

    // Make the model valid again by setting the required fields
    entity.set({
      'title': 'Hello, world',
      'author': '<foo>'
    });
    equal(entity.validate(entity.attributes), undefined);

    // Check validation of max number of items
    entity.set('content', ['one', 'two']);
    // Plain set should not work as the model is not valid
    equal(entity.has('content'), false);

    // Check validation error event
    stop();
    var checkError = function (ent, res) {
        equal(ent, entity, 'Validation errors should return correct entity');
        ok(_.isArray(res));
        equal(res.length, 1);
        entity.off('invalid', checkError);
        start();
    };
    entity.on('invalid', checkError);
    entity.set('content', ['one', 'two']);

    // Set invalid data without validation
    entity.set('content', ['one', 'two'], {
      silent: true 
    });
    equal(entity.has('content'), true);
    results = entity.validate(entity.attributes);
    ok(results);
    if (results !== undefined) {
      ok(_.isArray(results));
      equal(results.length, 1);
    }
});
