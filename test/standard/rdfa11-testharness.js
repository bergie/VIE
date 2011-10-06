// These tests are adapted from
// http://rdfa.digitalbazaar.com/test-suite/ 
module("vie.js - RDFa 1.1 parsing tests");

test("Test #1 (required): Predicate establishment with @property", function() {
    var z = new VIE();
    z.use(new z.RdfaService);

    var html = jQuery('<p>This photo was taken by <span class="author" about="photo1.jpg" property="dc:creator">Mark Birbeck</span>.</p>');

    stop(1000); // 1 second timeout
    z.load({element: html}).from('rdfa').execute().done(function(entities) {
        ok(entities);
        equal(entities.length, 1);

        equal(entities[0].id, '<photo1.jpg>');
        equal(entities[0].get('dc:creator'), 'Mark Birbeck');
        start();
    });
});

test("Test #6 (required): @rel and @rev", function() {
    var z = new VIE();
    z.use(new z.RdfaService);

    var html = jQuery('<p>This photo was taken by <a about="photo1.jpg" rel="dc:creator" rev="foaf:img" href="http://www.blogger.com/profile/1109404">Mark Birbeck</a>.</p>');

    stop(1000); // 1 second timeout
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
    var z = new VIE();
    z.use(new z.RdfaService);

    var html = jQuery('<p>This photo was taken by <a about="photo1.jpg" property="dc:title" content="Portrait of Mark" rel="dc:creator" rev="foaf:img" href="http://www.blogger.com/profile/1109404">Mark Birbeck</a>.</p>');

    stop(1000); // 1 second timeout
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
