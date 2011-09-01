module("zart.js - RDFa RdfQuery Service");

test("Test RdfQuery RDFa parsing example", function() {
    var z = new Zart();
    z.use(new z.RdfaRdfQueryService);

    var html = jQuery('<p xmlns:dc="http://foo/" xmlns:foaf="http://bar/" id="info">This paper was written by <span rel="dc:creator" resource="#me"><span property="foaf:name">Ben Adida</span>.</span></p>');

    stop();
    z.load({element: html}).from('rdfa').execute().done(function(entities) {
        ok(entities);
        equal(entities.length, 2);
        start();
    });
});

test("Test simple RDFa parsing", function() {
    var z = new Zart();
    z.use(new z.RdfaRdfQueryService);

    var html = jQuery('<div xmlns:dbp="http://dbpedia.org/property/" xmlns:xsd="http://www.w3.org/2001/XMLSchema#" xmlns:foaf="http://xmlns.com/foaf/0.1/" about="http://dbpedia.org/resource/Albert_Einstein"><span property="foaf:name">Albert Einstein</span><span property="dbp:dateOfBirth" datatype="xsd:date">1879-03-14</span><div rel="dbp:birthPlace" resource="http://dbpedia.org/resource/Germany" /><span about="http://dbpedia.org/resource/Germany" property="dbp:conventionalLongName">Federal Republic of Germany</span></div>');

    stop();
    z.load({element: html}).from('rdfa').execute().done(function(entities) {
        ok(entities);
        equal(entities.length, 2);

        equal(entities[0].id, '<http://dbpedia.org/resource/Albert_Einstein>');
        equal(entities[0].get('foaf:name'), 'Albert Einstein');
        equal(entities[1].get('dbp:conventionalLongName'), 'Federal Republic of Germany');

        start();
    });
});
