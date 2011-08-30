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
    ok(z["delete"]);
	equal(typeof z["delete"], 'function');
    ok(z.annotate);
	equal(typeof z.annotate, 'function');
    
});

test("zart.js Loadable API", 4, function () {
	
    var z = new Zart();
    var loadable = z.load();
    ok(loadable);
 	ok(loadable instanceof Zart.Loadable);
});