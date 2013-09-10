module("Core - Namespaces");

test("VIE namespace", function () {
    var v = new VIE();
    
   ok(v);
   ok(v.namespaces);
   
   ok(v.namespaces.add);
   equal(typeof v.namespaces.add, "function");
   ok(v.namespaces.addOrReplace);
   equal(typeof v.namespaces.addOrReplace, "function");
   ok(v.namespaces.get);
   equal(typeof v.namespaces.get, "function");
   ok(v.namespaces.getPrefix);
   equal(typeof v.namespaces.getPrefix, "function");
   ok(v.namespaces.contains);
   equal(typeof v.namespaces.contains, "function");
   ok(v.namespaces.containsNamespace);
   equal(typeof v.namespaces.containsNamespace, "function");
   ok(v.namespaces.update);
   equal(typeof v.namespaces.update, "function");
   ok(v.namespaces.updateNamespace);
   equal(typeof v.namespaces.updateNamespace, "function");
   ok(v.namespaces.remove);
   equal(typeof v.namespaces.remove, "function");
   ok(v.namespaces.removeNamespace);
   equal(typeof v.namespaces.removeNamespace, "function");
   ok(v.namespaces.toObj);
   equal(typeof v.namespaces.toObj, "function");
   ok(v.namespaces.curie);
   equal(typeof v.namespaces.curie, "function");
   ok(v.namespaces.uri);
   equal(typeof v.namespaces.uri, "function");
   ok(v.namespaces.isCurie);
   equal(typeof v.namespaces.isCurie, "function");
   ok(v.namespaces.isUri);
   equal(typeof v.namespaces.isUri, "function");
   
   
});


test ("Getter/setter for base namespace", function () {
    var v = new VIE();
    
    equal(typeof v.namespaces.base(), "string");
    
    v.namespaces.base("http://this.is-a-default.namespace/");
    equal(v.namespaces.base(), "http://this.is-a-default.namespace/");
    
    raises(function () {
        v.namespaces.base({"test" : "http://this.should.fail/"});
    });
    v.namespaces.add("", "http://this.is-another-default.namespace/");
    equal(v.namespaces.base(), "http://this.is-another-default.namespace/");
});

test ("Manually adding namespaces", function () {
    var v = new VIE();
    
    var reference = jQuery.extend(v.namespaces.toObj(), {'test' : 'http://this.is.a/test#'});

    v.namespaces.add("test","http://this.is.a/test#");
    
    deepEqual(v.namespaces.toObj(), reference, "Manually adding namespaces.");
    strictEqual(v.namespaces.get("test"), "http://this.is.a/test#", "Manually adding namespaces.");
});

test ("Manually adding multiple namespaces", function () {
    var v = new VIE();
    
    var reference = jQuery.extend(v.namespaces.toObj(), {'test' : 'http://this.is.a/test#', "test2": "http://this.is.another/test#"});

    v.namespaces.add({
        "test": "http://this.is.a/test#",
        "test2": "http://this.is.another/test#"
    });
    
    deepEqual(v.namespaces.toObj(), reference, "Manually adding namespaces.");
    strictEqual(v.namespaces.get("test"), "http://this.is.a/test#", "Manually adding namespaces.");
    strictEqual(v.namespaces.get("test2"), "http://this.is.another/test#", "Manually adding namespaces.");
});

test ("Manually adding duplicate", function () {
    var v = new VIE();
    var reference = jQuery.extend(v.namespaces.toObj(), {'test' : 'http://this.is.a/test#'});
    v.namespaces.add("test", "http://this.is.a/test#");
    v.namespaces.add("test", "http://this.is.a/test#");
    deepEqual(v.namespaces.toObj(), reference, "Manually adding namespaces.");
    strictEqual(v.namespaces.get("test"), "http://this.is.a/test#", "Manually adding namespaces.");
});

test ("Manually adding duplicate (key)", function () {
    var v = new VIE();
    v.namespaces.add("test", "http://this.is.a/test#");
    v.namespaces.add("test1", "http://this.is.a/test#");
    equal(v.namespaces.get('test'), 'http://this.is.a/test#');
    equal(v.namespaces.get('test1'), 'http://this.is.a/test#');
});

test ("Manually adding wrong duplicate (value)", function () {
    var v = new VIE();
    v.namespaces.add("test", "http://this.is.a/test#");
    raises(function () {
        v.namespaces.add("test", "http://this.is.another/test#");
    });
});

test ("Manually adding wrong duplicate (key) - addOrReplace", function () {
    var v = new VIE();
    v.namespaces.add("test", "http://this.is.a/test#");
    v.namespaces.addOrReplace("test1", "http://this.is.a/test#");
    
    equal(v.namespaces.get('test'), 'http://this.is.a/test#');
    equal(v.namespaces.get("test1"), "http://this.is.a/test#");
});

test ("Manually adding wrong duplicate (value) - addOrReplace", function () {
    var v = new VIE();
    
    v.namespaces.add("test", "http://this.is.a/test#");
    v.namespaces.addOrReplace("test", "http://this.is.a/test2#");
    
    equal(v.namespaces.get("test"), "http://this.is.a/test2#");
    
});

test ("Tests getter methods in Namespaces.", function () {
    var v = new VIE();
    v.namespaces.add("test", "http://this.is.a/test#");
    
    equal(v.namespaces.getPrefix("http://this.is.a/test#"), "test");
    equal(v.namespaces.get("test"), "http://this.is.a/test#");
    equal(v.namespaces.get("foo"), undefined);
    ok(v.namespaces.containsNamespace("http://this.is.a/test#"));
});

test ("Manually removing namespaces", function () {
    var v = new VIE();
    v.namespaces.add("test", "http://this.is.a/test#");
    var reference = v.namespaces.toObj();
    delete reference["test"];
     
    v.namespaces.remove("test");
   
    deepEqual(v.namespaces.toObj(), reference, "Manually removing namespaces.");
    strictEqual(v.namespaces['test'], undefined, "Manually removing namespaces.");

    v = new VIE();
    v.namespaces.add("test", "http://this.is.a/test#");
    var reference = v.namespaces.toObj();
    delete reference["test"];
     
    v.namespaces.removeNamespace("http://this.is.a/test#");
   
    deepEqual(v.namespaces.toObj(), reference, "Manually removing namespaces.");
    strictEqual(v.namespaces['test'], undefined, "Manually removing namespaces.");
});

test ("CURIE <-> URI", function () {

    var v = new VIE();
    v.namespaces.add("test", "http://this.is.a/test#");
    
    var uri = "<http://this.is.a/test#foo>";
    var curie = "test:foo";
    var scurie = "[test:foo]";

    // URI -> CURIE
    equal(v.namespaces.curie(uri), curie);
    equal(v.namespaces.curie(uri, false), v.namespaces.curie(uri));
    equal(v.namespaces.curie(uri, true), scurie);
    
    // CURIE -> URI
    equal(v.namespaces.uri(curie), uri);
    equal(v.namespaces.uri(scurie), uri);
    
    ok(v.namespaces.isUri(uri));
    ok(!v.namespaces.isUri(curie));
    ok(!v.namespaces.isUri(scurie));

    ok(!v.namespaces.isCurie(uri));
    ok(v.namespaces.isCurie(curie));
    ok(v.namespaces.isCurie(scurie));
    
});

test('Double prefixed CURIE <-> URI', function () {
    var v = new VIE();
    v.namespaces.add('typo3', 'http://www.typo3.org/ns/2011/Flow3/Packages/TYPO3/Content/');

    var curie = 'typo3:TYPO3.TYPO3:Text';
    var curie2 = 'typo3:TYPO3.TYPO3.FOO3:Text';

    var uri = '<http://www.typo3.org/ns/2011/Flow3/Packages/TYPO3/Content/TYPO3.TYPO3:Text>';
    var uri2 = '<http://www.typo3.org/ns/2011/Flow3/Packages/TYPO3/Content/TYPO3.TYPO3.FOO3:Text>';

    // URI -> CURIE
    equal(v.namespaces.curie(uri), curie);
    equal(v.namespaces.curie(uri2), curie2);

    // CURIE -> URI
    equal(v.namespaces.uri(curie), uri);
    equal(v.namespaces.uri(curie2), uri2);

    // CURIE -> CURIE
    equal(v.namespaces.curie(curie), curie);
    equal(v.namespaces.curie(curie2), curie2);

    // URI -> URI
    equal(v.namespaces.uri(uri), uri);
    equal(v.namespaces.uri(uri2), uri2);

    // URI -> prefix
    equal(v.namespaces.getPrefix(uri), 'typo3');
    equal(v.namespaces.getPrefix(curie), 'typo3');

    // CURIE -> URI -> CURIE
    equal(v.namespaces.curie(v.namespaces.uri(curie)), curie);
    equal(v.namespaces.curie(v.namespaces.uri(curie2)), curie2);

    ok(v.namespaces.isUri(uri));
    ok(v.namespaces.isUri(uri2));
    ok(!v.namespaces.isUri(curie));
    ok(!v.namespaces.isUri(curie2));

    ok(!v.namespaces.isCurie(uri));
    ok(!v.namespaces.isCurie(uri2));
    ok(v.namespaces.isCurie(curie));
    ok(v.namespaces.isCurie(curie2));
});

test('Sub-namespaces', function () {
    var v = new VIE()
    v.namespaces.addOrReplace('sc', 'http://schema.org/');
    v.namespaces.addOrReplace('cw', 'http://schema.org/CreativeWork');

    // Resolve to URI
    equal(v.namespaces.uri('sc:WebPage'), '<http://schema.org/WebPage>');
    equal(v.namespaces.uri('cw:audience'), '<http://schema.org/CreativeWorkaudience>');
});
