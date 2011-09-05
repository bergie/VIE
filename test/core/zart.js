module("Core");

test("zart.js API", function () {

    notEqual(typeof Zart, 'undefined', "No Zart object found! Please ensure that you build the project first by running 'ant'.");
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
    ok(z.analyze);
    equal(typeof z.analyze, 'function');

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
Zart.prototype.MockService.prototype.remove = function(removable) {
    var correct = removable instanceof this.zart.Removable;
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
Zart.prototype.MockService.prototype.analyze = function(analyzable) {
    var correct = analyzable instanceof this.zart.Analyzable;
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

test("zart.js Service API", 8, function () {
    var z = new Zart();
    z.use(new z.MockService());
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

test("zart.js Loadable API", 2, function () {
    var z = new Zart();
    var x = z.load({});
    ok(x);
    ok(x instanceof z.Loadable);
});

test("zart.js Loadable API - success", 1, function () {
    var z = new Zart();
    z.use(new z.MockService());

    stop(1000); // 1 second timeout
    z.load({mockresult: "success"}).using("mock").execute().success(function(result){
        equal(result, "success");
        start();
    });
});

test("zart.js Loadable API - fail", 1, function () {
    var z = new Zart();
    z.use(new z.MockService());
    stop(1000); // 1 second timeout
    z.load({mockresult: "fail"}).using("mock").execute()
    .fail(function(result){
        equal(result, "fail");
        start();
    });
});

test("zart.js Loadable API - always", 1, function () {
    var z = new Zart();
    z.use(new z.MockService());
    stop(1000); // 1 second timeout
    z.load({mockresult: "fail"}).using("mock").execute()
    .always(function(result){
        ok(true);
        start();
    });
});

test("zart.js Savable API", 2, function () {
    var z = new Zart();
    var x = z.save();
    ok(x);
    ok(x instanceof z.Savable);
});

test("zart.js Savable API - success", 1, function () {
    var z = new Zart();
    z.use(new z.MockService());

    stop(1000); // 1 second timeout
    z.save({mockresult: "success"}).using("mock").execute().success(function(result){
        equal(result, "success");
        start();
    });
});

test("zart.js Savable API - fail", 1, function () {
    var z = new Zart();
    z.use(new z.MockService());

    stop(1000); // 1 second timeout
    z.save({mockresult: "fail"}).using("mock").fail(function(result){
        equal(result, "fail");
        start();
    }).execute();
});

test("zart.js Savable API - always", 1, function () {
    var z = new Zart();
    z.use(new z.MockService());

    stop(1000); // 1 second timeout
    z.save({mockresult: "fail"}).using("mock")
    .always(function(result){
        ok(true);
        start();
    }).execute();
});

test("zart.js Removable API", 2, function () {
    var z = new Zart();
    var x = z.remove();
    ok(x);
    ok(x instanceof z.Removable);
});

test("zart.js Removable API - success", 1, function () {
    var z = new Zart();
    z.use(new z.MockService());

    stop(1000); // 1 second timeout
    z.remove({mockresult: "success"}).using("mock").execute().success(function(result){
        equal(result, "success");
        start();
    });
});

test("zart.js Removable API - fail", 1, function () {
    var z = new Zart();
    z.use(new z.MockService());

    stop(1000); // 1 second timeout
    z.remove({mockresult: "fail"}).using("mock")
    .fail(function(result){
        equal(result, "fail");
        start();
    }).execute();
});

test("zart.js Removable API - always", 1, function () {
    var z = new Zart();
    z.use(new z.MockService());

    stop(1000); // 1 second timeout
    z.remove({mockresult: "fail"}).using("mock")
    .always(function(result){
        ok(true);
        start();
    }).execute();
});

test("zart.js Analyzable API", 2, function () {
    var z = new Zart();
    var x = z.analyze();
    ok(x);
    ok(x instanceof z.Analyzable);
});

test("zart.js Analyzable API - success", 1, function () {
    var z = new Zart();
    z.use(new z.MockService());

    stop(1000); // 1 second timeout
    z.analyze({mockresult: "success"}).using("mock").execute().success(function(result){
        equal(result, "success");
        start();
    });
});

test("zart.js Analyzable API - fail", 1, function () {
    var z = new Zart();
    z.use(new z.MockService());

    stop(1000); // 1 second timeout
    z.analyze({mockresult: "fail"}).using("mock")
    .fail(function(result){
        equal(result, "fail");
        start();
    }).execute();
});

test("zart.js Analyzable API - always", 1, function () {
    var z = new Zart();
    z.use(new z.MockService());

    stop(1000); // 1 second timeout
    z.analyze({mockresult: "fail"}).using("mock")
    .always(function(result){
        ok(true);
        start();
    }).execute();
});

