module("zart.js - RDFa Service");

test("Test simple RDFa parsing", function() {
    var z = new Zart();
    z.use(new z.RdfaService);

    var html = jQuery('<div about="http://dbpedia.org/resource/Albert_Einstein"><span property="foaf:name">Albert Einstein</span><span property="dbp:dateOfBirth" datatype="xsd:date">1879-03-14</span><div rel="dbp:birthPlace" resource="http://dbpedia.org/resource/Germany" /><span about="http://dbpedia.org/resource/Germany" property="dbp:conventionalLongName">Federal Republic of Germany</span></div>');

    z.load({element: html}).from('rdfa').execute().done(function(entities) {
        ok(entities);
        equal(entities.length, 2);

        equal(entities[1].id, '<http://dbpedia.org/resource/Albert_Einstein>');
        equal(entities[1].get('foaf:name'), 'Albert Einstein');
        equal(entities[0].get('dbp:conventionalLongName'), 'Federal Republic of Germany');

        start();
    });
    stop();
});

test("Test updating RDFa views", function() {
    var z = new Zart();
    z.use(new z.RdfaService);

    var html = jQuery('<div about="http://dbpedia.org/resource/Albert_Einstein"><span property="foaf:name">Albert Einstein</span><span property="dbp:dateOfBirth" datatype="xsd:date">1879-03-14</span><div rel="dbp:birthPlace" resource="http://dbpedia.org/resource/Germany" /><span about="http://dbpedia.org/resource/Germany" property="dbp:conventionalLongName">Federal Republic of Germany</span></div>');
    z.load({element: html}).from('rdfa').execute().done(function(entities) {
        ok(entities);
        equal(entities.length, 2);

        equal(entities[0].get('dbp:conventionalLongName'), 'Federal Republic of Germany');

        entities[0].set({'dbp:conventionalLongName': 'Switzerland'});
        equal(entities[0].get('dbp:conventionalLongName'), 'Switzerland');

        jQuery('[property="dbp:conventionalLongName"]', html).each(function() {
            equal(jQuery(this).html(), 'Switzerland');
        });

        start();
    });
    stop();
});

/**
 * This test doesn't work with QUnit
test("Test global entity with a base URL", function() {
    var z = new Zart();
    z.use(new z.RdfaService);

    var html = jQuery('<html><head><base href="http://www.example.org/jo/blog" /><title>Jo\'s Friends and Family Blog</title><link rel="foaf:primaryTopic" href="#bbq" /><meta property="dc:creator" content="Jo" /></head><body>...</body></html>');

    z.load({element: html}).from('rdfa').execute().done(function(entities) {
        ok(entities);
        equal(entities.length, 1);
        equal(entities[0].get('dc:creator'), 'Jo');
        equal(entities[0].id, '<http://www.example.org/jo/blog>');

        start();
    });
    stop();
});
*/
