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

test("zart.js Entities API", 7, function () {
    var z = new Zart();
    ok(z.entities instanceof z.Collection);
    equal(z.entities.length, 0);

    z.entities.add({
        '@subject': 'http://example.net/foo',
        'dc:title': 'Bar'
    });
    equal(z.entities.length, 1);

    ok(z.entities.get('http://example.net/foo') instanceof z.Entity);
    equal(z.entities.at(0), z.entities.get('http://example.net/foo'));
    equal(z.entities.at(0).get('dc:title'), 'Bar');
    equal(z.entities.at(0).get('@type'), 'Thing');
});

Zart.prototype.MockService = function () {
    this.zart = null;
    this.name = 'mock';
}
Zart.prototype.MockService.prototype.load = function(loadable) {
    var correct = loadable instanceof this.zart.Loadable;
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
Zart.prototype.MockService.prototype.save = function(savable) {
    var correct = savable instanceof this.zart.Savable;
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

test("zart.js Service API", 6, function () {
    var z = new Zart();
    z.use(new z.MockService);
    ok(z.service('mock'));
    equal(typeof z.service('mock').load, 'function');

    raises(function() {
        z.service('mock').load({});
    }, "calling load() with non-Loadable value should throw an error");
    z.service('mock').load(z.load({}));

    z.use(new z.MockService, "foo");
    ok(z.service('foo'));
    equal(typeof z.service('foo').load, 'function');

    raises(function() {
        z.service('bar');
    }, "Calling undefined service should throw an error");
});

test("zart.js Loadable API", 3, function () {
    var z = new Zart();
    var x = z.load({});
    ok(x);
    ok(x instanceof z.Loadable);

    z.use(new z.MockService());
    z.load({mockresult: "success"}).using("mock").execute().success(function(result){
        equal(result, "success");
        start();
    });
    stop();
/*
    z.load({mockresult: "fail"}).using("mock").success(function(result){
        ok(false, "Should fail here, success shouldn't be called.");
        start();
    }).fail(function(result){
        equal(result, "fail");
        start();
    });
    stop();

    z.load({mockresult: "fail"}).using("mock").then(function(result){
        ok(true);
        start();
    })
    stop();
*/
});

test("zart.js Savable API", function () {
    var z = new Zart();
    var x = z.save();
    ok(x);
    ok(x instanceof z.Savable);

    z.use(new z.MockService());
    var l = z.save({mockresult: "success"});
    l.using("mock");
    l.success(function(result){
        equal(result, "success");
        start();
    });
    l.execute();
    stop();
});

test("zart.js Removable API", 2, function () {
    var z = new Zart();
    var x = z.remove();
    ok(x);
    ok(x instanceof z.Removable);
/*
    z.use(new z.MockService());
    var l = z.remove({mockresult: "success"});
    l.using("mock");
    l.success(function(result){
        equal(result, "success");
        start();
    });
    l.execute();
    stop();
*/
});

test("zart.js Annotatable API", 2, function () {
    var z = new Zart();
    var x = z.annotate();
    ok(x);
     ok(x instanceof z.Annotatable);
});
