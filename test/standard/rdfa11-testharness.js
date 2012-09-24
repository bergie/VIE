// These tests are adapted from
// http://rdfa.digitalbazaar.com/test-suite/ 
module("vie.js - RDFa 1.1 Test Suite");

test("Test #1 (required): Predicate establishment with @property", function() {
    var z = new VIE();
    z.use(new z.RdfaService);
    
    z.namespaces.add("dcterms", "http://purl.org/dc/terms/");

    var html = jQuery('#qunit-fixture .rdfa11-1 p');

    stop();
    z.load({element: html}).from('rdfa').execute().done(function(entities) {
        ok(entities);
        equal(entities.length, 1);
        equal(entities[0].id, '<photo1.jpg>');
        equal(entities[0].get('dc:creator'), 'Mark Birbeck');
        start();
    });
});

test("Test #6 (required): @rel and @rev", function() {
    //TODO:  Skip for now, not supported in VIE
    expect(0);
    return;
    var z = new VIE();
    z.use(new z.RdfaService);

    z.namespaces.add("dcterms", "http://purl.org/dc/terms/");
    z.namespaces.add("foaf", "http://xmlns.com/foaf/0.1/");

    var html = jQuery('<p>This photo was taken by <a about="photo1.jpg" rel="dc:creator" rev="foaf:img" href="http://www.blogger.com/profile/1109404">Mark Birbeck</a>.</p>');

    stop();
    z.load({element: html}).from('rdfa').execute().done(function(entities) {
        ok(entities);
        equal(entities.length, 2);

        equal(entities[0].id, '<photo1.jpg>');
        equal(entities[0].get('dc:creator'), '<http://www.blogger.com/profile/1109404>');

        equal(entities[1].id, '<http://www.blogger.com/profile/1109404>');
        equal(entities[1].get('foaf:img'), '<photo1.jpg>');
        start();
    });
});

test("Test #7 (required): @rel, @rev, @property, @content", function() {
    //TODO:  Skip for now, not supported in VIE
    expect(0);
    return;
    var z = new VIE();
    z.use(new z.RdfaService);

    z.namespaces.add("dcterms", "http://purl.org/dc/terms/");
    z.namespaces.add("foaf", "http://xmlns.com/foaf/0.1/");
    
    var html = jQuery('<p>This photo was taken by <a about="photo1.jpg" property="dc:title" content="Portrait of Mark" rel="dc:creator" rev="foaf:img" href="http://www.blogger.com/profile/1109404">Mark Birbeck</a>.</p>');

    stop();
    z.load({element: html}).from('rdfa').execute().done(function(entities) {
        ok(entities);
        equal(entities.length, 2);

        equal(entities[0].id, '<photo1.jpg>');
        equal(entities[0].get('dc:creator'), '<http://www.blogger.com/profile/1109404>');
        equal(entities[0].get('dc:title'), 'Portrait of Mark'); 

        equal(entities[1].id, '<http://www.blogger.com/profile/1109404>');
        equal(entities[1].get('foaf:img'), '<photo1.jpg>');
        start();
    });
});

test("Test #9 (required): @rev", function() {
    //TODO:  Skip for now, not supported in VIE
    expect(0);
    return;
    var z = new VIE();
    z.use(new z.RdfaService);

    z.namespaces.add("dcterms", "http://purl.org/dc/terms/");
    z.namespaces.add("foaf", "http://xmlns.com/foaf/0.1/");
    
    var html = jQuery('<link about="http://example.org/people#Person1" rev="foaf:knows" href="http://example.org/people#Person2" />');

    stop();
    z.load({element: html}).from('rdfa').execute().done(function(entities) {
        ok(entities);
        equal(entities.length, 1);

        equal(entities[0].id, '<http://example.org/people#Person2>');
        equal(entities[0].get('foaf:knows'), '<http://example.org/people#Person1>');
        start();
    });
});

test("Test #10 (required): @rel, @rev, @href", function() {
    //TODO: Skip for now, not supported in VIE
    expect(0);
    return;
    var z = new VIE();
    z.use(new z.RdfaService);

    z.namespaces.add("dcterms", "http://purl.org/dc/terms/");
    z.namespaces.add("foaf", "http://xmlns.com/foaf/0.1/");
    
    var html = jQuery('<link about="http://example.org/people#Person1" rel="foaf:knows" rev="foaf:knows" href="http://example.org/people#Person2" />');

    stop();
    z.load({element: html}).from('rdfa').execute().done(function(entities) {
        ok(entities);
        equal(entities.length, 2);

        equal(entities[0].id, '<http://example.org/people#Person1>');
        equal(entities[0].get('foaf:knows'), '<http://example.org/people#Person2>');

        equal(entities[1].id, '<http://example.org/people#Person2>');
        equal(entities[1].get('foaf:knows'), '<http://example.org/people#Person1>');

        start();
    });
});
