module("Core");


test("zart.js API", 16, function () {
	
	ok(Zart);
	equal(typeof Zart, 'function');
	
    var z = new Zart();
    ok(z);
    ok(z instanceof Zart);
    
    ok(z.use);
	equal(typeof z.use, 'function');
    ok(z.service);
	equal(typeof z.service, 'function');
    ok(z.load);
	equal(typeof z.load, 'function');
    ok(z.save);
	equal(typeof z.save, 'function');
    ok(z.remove);
	equal(typeof z.remove, 'function');
    ok(z.annotate);
	equal(typeof z.annotate, 'function');
    
});

test("zart.js Entities API", 6, function () {
    var z = new Zart();
    ok(z.entities instanceof z.Collection);
    console.log(z.entities);
    equal(z.entities.length, 0);

    z.entities.add({
        '@subject': 'http://example.net/foo',
        'dc:title': 'Bar'
    });
    equal(z.entities.length, 1);

    ok(z.entities.get('http://example.net/foo') instanceof z.Entity);
    equal(z.entities.at(0), z.entities.get('http://example.net/foo'));
    equal(z.entities.at(0).get('dc:title'), 'Bar');
});

test("zart.js Loadable API", 2, function () {
	
    var z = new Zart();
    var x = z.load();
    ok(x);
 	ok(x instanceof Zart.Loadable);
});

test("zart.js Savable API", 2, function () {
	
    var z = new Zart();
    var x = z.save();
    ok(x);
 	ok(x instanceof Zart.Savable);
});

test("zart.js Removable API", 2, function () {
	
    var z = new Zart();
    var x = z.remove();
    ok(x);
 	ok(x instanceof Zart.Removable);
});

test("zart.js Annotatable API", 2, function () {
	
    var z = new Zart();
    var x = z.annotate();
    ok(x);
 	ok(x instanceof Zart.Annotatable);
});
