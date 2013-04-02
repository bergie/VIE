module("Core");

test("vie.js API", function () {

	equal(typeof VIE, 'function', "Test if global VIE object is available! Please ensure that you build the project first by running 'ant'.");
    
    var v = new VIE();
    ok(v);
    ok(v instanceof VIE);

    ok(v.use);
    equal(typeof v.use, 'function');
    ok(v.service);
    equal(typeof v.service, 'function');
    ok(v.load);
    equal(typeof v.load, 'function');
    ok(v.save);
    equal(typeof v.save, 'function');
    ok(v.remove);
    equal(typeof v.remove, 'function');
    ok(v.analyze);
    equal(typeof v.analyze, 'function');


});

test("vie.js Entities API", function () {
	var z = new VIE();
    z.namespaces.add('dc', 'http://purl.org/dc/elements/1.1/');
    z.namespaces.add('iks', 'http://www.iks-project.eu/#');
    ok(z.entities instanceof z.Collection);
    equal(z.entities.vie, z);
    equal(z.entities.length, 0);
    z.entities.add({
        '@subject': 'http://example.net/foo',
        'dc:title': 'Bar'
    });

    equal(z.entities.length, 1);
    equal(z.entities.at(0).id, z.entities.get('http://example.net/foo').id);
    equal(z.entities.at(0).get('dc:title'), 'Bar');
    equal(z.entities.at(0).get('http://purl.org/dc/elements/1.1/title'), 'Bar');

    z.entities.at(0).set({'http://purl.org/dc/elements/1.1/title': 'Baz'});
    equal(z.entities.at(0).get('dc:title'), 'Baz');
    equal(z.entities.at(0).get('http://purl.org/dc/elements/1.1/title'), 'Baz');

    ok(z.entities.at(0).has('dc:title'));
    ok(z.entities.at(0).has('http://purl.org/dc/elements/1.1/title'));
    equal(z.entities.at(0).has('dc:foo'), false);
    
    equal(z.entities.at(0).get('@type').id, z.types.get('owl:Thing').id);

    z.entities.at(0).set({
      'iks:foo': ''
    });
    ok(z.entities.at(0).has('iks:foo'));   
    equal(z.entities.at(0).get('iks:foo'), '');
    equal(typeof z.entities.at(0).get('iks:foo'), 'string');
});


test("vie.js Entities API -  id/getSubject()", function () {
    var z = new VIE();
    z.namespaces.add('dc', 'http://purl.org/dc/elements/1.1/');
    
    var empty = new z.Entity();
    ok(empty);

    ok(empty.isNew());

    equal(empty.vie, z);

    // FIXME: This should be made to pass
    // equal(empty.id, null);

    // getSubject should still return a _:bnode
    ok(empty.getSubject().substring(0, 2), "_:");
    equal(empty.get("@type").id, z.types.get("owl:Thing").id);

    var e = new z.Entity({"@subject" : "owl:TestId"});
    ok(e);
    equal(e.id, e.getSubject());
    equal(e.id, "<http://www.w3.org/2002/07/owl#TestId>");

    var e = new z.Entity({"@subject" : "<http://www.w3.org/2002/07/owl#TestId>"});
    ok(e);
    equal(e.id, e.getSubject());
    equal(e.id, "<http://www.w3.org/2002/07/owl#TestId>");
    
    var e = new z.Entity({"@subject" : "<TestId>"});
    ok(e);
    equal(e.id, e.getSubject());
    equal(e.id, "<TestId>");
    
    var e = new z.Entity({"@subject" : "TestId"});
    ok(e);
    equal(e.id, e.getSubject());
    equal(e.id, "<TestId>");
    
});

test('vie.js Entities API - forceChanged', function () {
    var z = new VIE();

    var entity = new z.Entity();
    equal(entity.hasChanged(), false);
    equal(entity.isNew(), true);

    entity.forceChanged(true);
    equal(entity.hasChanged(), true);

    entity.forceChanged(false);
    equal(entity.hasChanged(), false);
});

test("vie.js Entities API - addOrUpdate", function () {
    var z = new VIE();
    z.namespaces.add('dc', 'http://purl.org/dc/elements/1.1/');
    equal(z.entities.length, 0);

    z.entities.add({
        '@subject': 'http://example.net/foo',
        'dc:title': 'Bar'
    });

    z.entities.addOrUpdate({
        '@subject': 'http://example.net/foo',
        'dc:propertyB': "Some String"
    });
    equal(z.entities.get("http://example.net/foo").get('dc:title'), 'Bar');
    equal(z.entities.get("http://example.net/foo").get('dc:propertyB'), 'Some String');
});


test("vie.js Entities API - isof", function () {
    var z = new VIE();
    z.namespaces.add('example', 'http://example.net/foo/');
    z.namespaces.add("foaf", "http://xmlns.com/foaf/0.1/");
    ok(z.entities instanceof z.Collection);
    equal(z.entities.length, 0);
    
    var person = z.types.add("foaf:Person").inherit(z.types.get('owl:Thing'));
                
    var musician = z.types.add("example:Musician").inherit(z.types.get('owl:Thing'));

    z.entities.add({
        '@subject': 'http://example.net/Madonna',
        '@type': ['example:Musician', 'foaf:Person']
    });

    //implement namespace resolution for @type and other references
    ok(z.entities.get('http://example.net/Madonna').isof('foaf:Person'));
    ok(z.entities.get('http://example.net/Madonna').isof('example:Musician'));
});

test("vie.js Entity API - setOrAdd", function () {
    var z = new VIE();
    z.entities.add({
        '@subject': 'http://example.org/EricClapton'
    });
    var clapton = z.entities.get('http://example.org/EricClapton');
    clapton.setOrAdd('plays', 'guitar');
    equal(typeof z.entities.get('http://example.org/EricClapton').get('plays'), "string", "Single values are stored as they are");

    clapton.setOrAdd('plays', 'vocals');
    ok(z.entities.get('http://example.org/EricClapton').get('plays') instanceof Array, "Multiple values are stored as Arrays");

    clapton.unset('plays');
    ok(!clapton.get('plays'), "Property unset");

    clapton.setOrAdd({'plays': 'guitar'});
    equal(typeof clapton.get('plays'), "string", "Single values are stored as they are");

    clapton.setOrAdd({'plays': 'vocals'});
    ok(clapton.get('plays') instanceof Array, "Multiple values are stored as Arrays");
    equal(clapton.get('plays').length, 2);

    clapton.setOrAdd({'plays': 'vocals'});
    equal(clapton.get('plays').length, 3, "Same value twice is the same value and needs to be added twice.");
});

test("vie.js Entities API - set()", function () {
    var z = new VIE();
    z.namespaces.add('example', 'http://example.net/foo/');
    z.namespaces.add("foaf", "http://xmlns.com/foaf/0.1/");
    
    var Person = z.types.add("foaf:Person").inherit(z.types.get('owl:Thing'));
           
    var madonna = z.entities.addOrUpdate({
        '@subject': 'http://example.net/Madonna',
        '@type': 'foaf:Person'
    });
    
    /* literals */
    
    madonna.set({"name" : "Madonna"}); // set literal with object notation
    equal(madonna.get("name"), "Madonna");
    
    madonna.unset("name");
    equal(madonna.get("name"), undefined);
    
    madonna.set("name", "Madonna Louise Ciccone"); // set literal with simple notation
    equal(madonna.get("name"), "Madonna Louise Ciccone");
    madonna.unset("name");
    
    madonna.set("name", ["Madonna", "Madonna Louise Ciccone"]); // set mulitple literals at the same time
    equal(madonna.get("name").length, 2);
    madonna.unset("name");
    
    madonna.set("name", "Madonna");
    madonna.set("name", "Madonna Louise Ciccone"); // overwrite existing literal
    equal(madonna.get("name"), "Madonna Louise Ciccone");
    madonna.unset("name");
    
    madonna.set("name", "Madonna");
    madonna.set("name", ["Madonna", "Madonna Louise Ciccone"]); // overwrite existing literal
    equal(madonna.get("name").length, 2);
    madonna.unset("name");
    
    var britney = z.entities.addOrUpdate({
        '@subject': 'http://example.net/Britney',
        '@type': 'foaf:Person'
    });
    
    madonna.set("knows", britney); // set an entity
    ok(madonna.get("knows").isCollection);
    equal(madonna.get("knows").size(), 1);
    equal(madonna.get("knows").at(0).getSubject(), britney.getSubject());
    
    
    var courtney = z.entities.addOrUpdate({
        '@subject': 'http://example.net/Courtney',
        '@type': 'foaf:Person'
    });
    
    madonna.set("knows", courtney); // set another entity
    ok(madonna.get("knows").isCollection);
    equal(madonna.get("knows").size(), 1);
    equal(madonna.get("knows").at(0).getSubject(), courtney.getSubject());

    // Set with array of subject URIs, should still be a collection
    var originalCollection = madonna.get("knows");
    madonna.set({
      knows: [courtney.getSubject()]
    });
    ok(madonna.get("knows").isCollection);
    equal(madonna.get("knows").size(), 1);
    equal(madonna.get("knows").at(0).getSubject(), courtney.getSubject());
    equal(madonna.get("knows"), originalCollection);
});

test("vie.js Entities API - setOrUpdate with entities", function () {
    var z = new VIE();
    z.namespaces.add('example', 'http://example.net/foo/');
    z.namespaces.add("foaf", "http://xmlns.com/foaf/0.1/");
    
    var Person = z.types.add("foaf:Person").inherit(z.types.get('owl:Thing'));
           
    var madonna = z.entities.addOrUpdate({
        '@subject': 'http://example.net/Madonna',
        '@type': 'foaf:Person'
    });
        
    var britney = z.entities.addOrUpdate({
        '@subject': 'http://example.net/Britney',
        '@type': 'foaf:Person'
    });
    
    var courtney = z.entities.addOrUpdate({
        '@subject': 'http://example.net/Courtney',
        '@type': 'foaf:Person'
    });
    
    madonna.setOrAdd("knows", britney);
    madonna.setOrAdd("knows", courtney);
    
    
    var friends = madonna.get("knows");
    equal(madonna.get("knows").size(), 2);
    equal(madonna.get("knows").at(0).getSubject(), britney.getSubject());
    equal(madonna.get("knows").at(1).getSubject(), courtney.getSubject());
    ok(friends);
    
});

test("vie.js Entity API - addTo", function () {
    var z = new VIE();
    
    var clapton = new z.Entity({
        '@subject': 'http://example.org/EricClapton'
    });
    
    ok(clapton.addTo);
    ok(typeof clapton.addTo === "function");
    
    var sizeBefore = z.entities.size();
    clapton.addTo(z.entities);
    var sizeAfter = z.entities.size();
    equal(sizeAfter, sizeBefore + 1);
    z.entities.remove(clapton);
    clapton.addTo(z.entities, true);
    sizeAfter = z.entities.size();
    equal(sizeAfter, sizeBefore + 1);
});

VIE.prototype.MockService = function () {
    this.vie = null;
    this.name = 'mock';
}
VIE.prototype.MockService.prototype.load = function(loadable) {
    var correct = loadable instanceof this.vie.Loadable;
    if (!correct) {
        throw "Invalid Loadable passed";
    }
    var result = loadable.options.mockresult;
    if (result === "success") {
        loadable.resolve(result);
    } else {
        loadable.reject(result);
    }
};
VIE.prototype.MockService.prototype.save = function(savable) {
    var correct = savable instanceof this.vie.Savable;
    if (!correct) {
        throw "Invalid Savable passed";
    }
    var result = savable.options.mockresult;
    if (result === "success")
        savable.resolve(result);
    else {
        savable.reject(result);
    }
};
VIE.prototype.MockService.prototype.remove = function(removable) {
    var correct = removable instanceof this.vie.Removable;
    if (!correct) {
        throw "Invalid Removable passed";
    }
    var result = removable.options.mockresult;
    if (result === "success")
        removable.resolve(result);
    else {
        removable.reject(result);
    }
};
VIE.prototype.MockService.prototype.analyze = function(analyzable) {
    var correct = analyzable instanceof this.vie.Analyzable;
    if (!correct) {
        throw "Invalid Analyzable passed";
    }
    var result = analyzable.options.mockresult;
    if (result === "success")
        analyzable.resolve(result);
    else {
        analyzable.reject(result);
    }
};

test("vie.js Service API", 10, function () {
    var z = new VIE();

    equal(z.hasService('mock'), false);
    z.use(new z.MockService());
    ok(z.hasService('mock'));
    ok(z.service('mock'));
    equal(typeof z.service('mock').load, 'function');

    raises(function() {
        z.service('mock').load({});
    }, "calling load() with non-Loadable value should throw an error");
    z.service('mock').load(z.load({}));

    equal(typeof z.getServicesArray, 'function');
    ok(z.getServicesArray() instanceof Array);

    z.use(new z.MockService, "foo");
    ok(z.service('foo'));
    equal(typeof z.service('foo').load, 'function');

    raises(function() {
        z.service('bar');
    }, "Calling undefined service should throw an error");
});

test("vie.js Loadable API", 2, function () {
    var z = new VIE();
    var x = z.load({});
    ok(x);
    ok(x instanceof z.Loadable);
});

test("vie.js Loadable API - success", 1, function () {
    var z = new VIE();
    z.use(new z.MockService());

    stop();
    z.load({mockresult: "success"}).using("mock").execute().success(function(result){
        equal(result, "success");
        start();
    });
});

test("vie.js Loadable API - fail", 1, function () {
    var z = new VIE();
    z.use(new z.MockService());
    stop();
    z.load({mockresult: "fail"}).using("mock").execute()
    .fail(function(result){
        equal(result, "fail");
        start();
    });
});

test("vie.js Loadable API - always", 1, function () {
    var z = new VIE();
    z.use(new z.MockService());
    stop();
    z.load({mockresult: "fail"}).using("mock").execute()
    .always(function(result){
        ok(true);
        start();
    });
});

test("vie.js Savable API", 2, function () {
    var z = new VIE();
    var x = z.save();
    ok(x);
    ok(x instanceof z.Savable);
});

test("vie.js Savable API - success", 1, function () {
    var z = new VIE();
    z.use(new z.MockService());

    stop();
    z.save({mockresult: "success"}).using("mock").execute().success(function(result){
        equal(result, "success");
        start();
    });
});

test("vie.js Savable API - fail", 1, function () {
    var z = new VIE();
    z.use(new z.MockService());

    stop();
    z.save({mockresult: "fail"}).using("mock").fail(function(result){
        equal(result, "fail");
        start();
    }).execute();
});

test("vie.js Savable API - always", 1, function () {
    var z = new VIE();
    z.use(new z.MockService());

    stop();
    z.save({mockresult: "fail"}).using("mock")
    .always(function(result){
        ok(true);
        start();
    }).execute();
});

test("vie.js Removable API", 2, function () {
    var z = new VIE();
    var x = z.remove();
    ok(x);
    ok(x instanceof z.Removable);
});

test("vie.js Removable API - success", 1, function () {
    var z = new VIE();
    z.use(new z.MockService());

    stop();
    z.remove({mockresult: "success"}).using("mock").execute().success(function(result){
        equal(result, "success");
        start();
    });
});

test("vie.js Removable API - fail", 1, function () {
    var z = new VIE();
    z.use(new z.MockService());

    stop();
    z.remove({mockresult: "fail"}).using("mock")
    .fail(function(result){
        equal(result, "fail");
        start();
    }).execute();
});

test("vie.js Removable API - always", 1, function () {
    var z = new VIE();
    z.use(new z.MockService());

    stop();
    z.remove({mockresult: "fail"}).using("mock")
    .always(function(result){
        ok(true);
        start();
    }).execute();
});

test("vie.js Analyzable API", 2, function () {
    var z = new VIE();
    var x = z.analyze();
    ok(x);
    ok(x instanceof z.Analyzable);
});

test("vie.js Analyzable API - success", 1, function () {
    var z = new VIE();
    z.use(new z.MockService());

    stop();
    z.analyze({mockresult: "success"}).using("mock").execute().success(function(result){
        equal(result, "success");
        start();
    });
});

test("vie.js Analyzable API - fail", 1, function () {
    var z = new VIE();
    z.use(new z.MockService());

    stop();
    z.analyze({mockresult: "fail"}).using("mock")
    .fail(function(result){
        equal(result, "fail");
        start();
    })
    .success(function(f){
        ok(false, "succeed, should have failed!");
        start();
    })
    .execute();
});

test("vie.js Analyzable API - always", 1, function () {
    var z = new VIE();
    z.use(new z.MockService());

    stop();
    z.analyze({mockresult: "fail"}).using("mock")
    .always(function(result){
        ok(true);
        start();
    }).execute();
});

test("vie.js Generate Typed Entity Classes", function () {
    var v = new VIE();
    v.types.add("Person");
    var TypedEntityClass = v.getTypedEntityClass("Person");

    var Person = new TypedEntityClass({"name": "Sebastian"});
    ok(Person.isEntity);
    ok(Person instanceof TypedEntityClass);
    ok(Person.isof("Person"));
    equal(Person.get("@type").id, "<" + v.namespaces.base() + "Person" + ">");
    ok(Person instanceof Backbone.Model);

    var SecondPerson = new TypedEntityClass({"name": "Henri"});
    ok(SecondPerson.isEntity);
    ok(SecondPerson instanceof TypedEntityClass);
    ok(SecondPerson.isof("Person"));
    equal(Person.get('name'), 'Sebastian');
    equal(SecondPerson.get('name'), 'Henri');
    ok(Person.cid !== SecondPerson.cid);
});
