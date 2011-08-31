module("zart.js - RDFa RdfQuery Service");

test("Test RdfQuery RDFa parsing example", function() {
    var z = new Zart();
    z.use(new z.RdfaRdfQueryService);

    var html = jQuery('<p id="info">This paper was written by <span rel="dc:creator" resource="#me"><span property="foaf:name">Ben Adida</span>.</span></p>');

    z.load({element: html}).from('rdfa').execute().done(function(entities) {
        start();
    });
    stop();
});

test("Test simple RDFa parsing", function() {
    var z = new Zart();
    z.use(new z.RdfaRdfQueryService);

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
