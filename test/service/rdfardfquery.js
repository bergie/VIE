module("vie.js - RDFa RDFQuery Service");

test("Test simple RDFa parsing", function() {
    var z = new VIE();
    z.use(new z.RdfaRdfQueryService);

    var html = jQuery('<div xmlns:xsd="http://www.w3.org/2001/XMLSchema/" xmlns:foaf="http://xmlns.com/foaf/0.1/" xmlns:dbp="http://dbpedia.org/property/" about="http://dbpedia.org/resource/Albert_Einstein"><span property="foaf:name">Albert Einstein</span><span property="dbp:dateOfBirth" datatype="xsd:date">1879-03-14</span><div rel="dbp:birthPlace" resource="http://dbpedia.org/resource/Germany" /><span about="http://dbpedia.org/resource/Germany" property="dbp:conventionalLongName">Federal Republic of Germany</span></div>');

    stop();
    z.load({element: html}).from('rdfardfquery').execute().done(function(entities) {
        ok(entities);
        equal(entities.length, 2);

        equal(entities[0].id, '<http://dbpedia.org/resource/Albert_Einstein>');
        equal(entities[0].get('foaf:name'), 'Albert Einstein');
        equal(entities[1].get('dbp:conventionalLongName'), 'Federal Republic of Germany');
    	ok(z.entities.get('<http://dbpedia.org/resource/Germany>'));
        equal(z.entities.get('<http://dbpedia.org/resource/Germany>').id, entities[1].id);

        start();
    });
});

test("Test updating RDFa views", function() {
    var z = new VIE();
    z.use(new z.RdfaRdfQueryService);

    var html = jQuery('<div xmlns:xsd="http://www.w3.org/2001/XMLSchema/" xmlns:foaf="http://xmlns.com/foaf/0.1/" xmlns:dbp="http://dbpedia.org/property/" about="http://dbpedia.org/resource/Albert_Einstein"><span property="foaf:name">Albert Einstein</span><span property="dbp:dateOfBirth" datatype="xsd:date">1879-03-14</span><div rel="dbp:birthPlace" resource="http://dbpedia.org/resource/Germany" /><span about="http://dbpedia.org/resource/Germany" property="dbp:conventionalLongName">Federal Republic of Germany</span></div>');
    
    stop();
    z.load({element: html}).from('rdfardfquery').execute().done(function(entities) {
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
});

test("Test simple RDFa nested tags", function() {
    var z = new VIE();
    z.use(new z.RdfaRdfQueryService);

    var html = jQuery('<div xmlns:dcterms="http://purl.org/dc/terms/" id="myarticle" typeof="http://rdfs.org/sioc/ns#Post" about="http://example.net/blog/news_item"><h1 property="dcterms:title"><span>News item title</span></h1></div>');

    stop();
    z.load({element: html}).from('rdfardfquery').execute().done(function(entities) {
        equal(entities.length, 1);
        equal(entities[0].get('dcterms:title'), '<span>News item title</span>');
        start();
    });
});

test("Test RDFa property content", function() {
    var z = new VIE();
    z.use(new z.RdfaRdfQueryService);

    var html = jQuery('<div xmlns:iks="http://iks-project.eu/ontology/" xmlns:foaf="http://xmlns.com/foaf/0.1/" about="http://twitter.com/bergie"><span property="foaf:name">Henri Bergius</span><span property="iks:online" content="0"></span></div>');

    stop();
    z.load({element: html}).from('rdfardfquery').execute().done(function(entities) {
        equal(entities.length, 1);
        equal(entities[0].get('iks:online'), 0);

        entities[0].set({'iks:online': 1});
        equal(entities[0].get('iks:online'), 1);
        equal(jQuery('[property="iks:online"]', html).attr('content'), 1);
        equal(jQuery('[property="iks:online"]', html).text(), '');

        start();
    });
});

test("Test RDFa example from Wikipedia", function() {
    var z = new VIE();
    z.use(new z.RdfaRdfQueryService);

    var html = jQuery('<p xmlns:dc="http://purl.org/dc/elements/1.1/" about="http://www.example.com/books/wikinomics">In his latest book <cite property="dc:title">Wikinomics</cite>, <span property="dc:creator">Don Tapscott</span> explains deep changes in technology, demographics and business. The book is due to be published in <span property="dc:date" content="2006-10-01">October 2006</span>.</p>');

    stop();
    z.load({element: html}).from('rdfardfquery').execute().done(function(entities) {
        var objectInstance = z.entities.get('<http://www.example.com/books/wikinomics>');
        equal(objectInstance.get('dc:title'), 'Wikinomics');
        equal(objectInstance.get('dc:creator'), 'Don Tapscott');
        start();
    });
});

test("Test RDFa image entitization", function() {
    var z = new VIE();
    z.use(new z.RdfaRdfQueryService);

    var html = jQuery('<div xmlns:rdfs="http://www.w3.org/1999/02/22-rdf-syntax-ns#type" xmlns:sioc="http://rdfs.org/sioc/ns#" xmlns:mgd="http://midgard-project.org/ontology/" xmlns:dcterms="http://purl.org/dc/terms/" id="myarticle" typeof="http://rdfs.org/sioc/ns#Post" about="http://example.net/blog/news_item"><h1 property="dcterms:title"><span>News item title</span></h1><span rel="mgd:icon"><img typeof="mgd:photo" src="http://example.net/image.jpg" /></span></div>');

    stop();
    z.load({element: html}).from('rdfardfquery').execute().done(function(entities) {
        var icons = z.entities.get('<http://example.net/blog/news_item>').get('mgd:icon');

        // Ensure we have the image correctly read
        ok(icons instanceof z.Collection, "Icons should be a Collection");
        equal(icons.at(0).id, '<http://example.net/image.jpg>');

        icons.remove(icons.at(0));
        equal(jQuery('img', html).length, 0);

        icons.add({'@subject': '<http://example.net/otherimage.jpg>'});
        equal(jQuery('img', html).length, 1);
        equal(jQuery('img[src="http://example.net/otherimage.jpg"]', html).length, 1);

        start();
    });
});

/**
 * This test doesn't work with QUnit
test("Test global entity with a base URL", function() {
    var z = new VIE();
    z.use(new z.RdfaRdfQueryService);

    var html = jQuery('<html><head><base href="http://www.example.org/jo/blog" /><title>Jo\'s Friends and Family Blog</title><link rel="foaf:primaryTopic" href="#bbq" /><meta property="dc:creator" content="Jo" /></head><body>...</body></html>');

    stop();
    z.load({element: html}).from('rdfardfquery').execute().done(function(entities) {
        ok(entities);
        equal(entities.length, 1);
        equal(entities[0].get('dc:creator'), 'Jo');
        equal(entities[0].id, '<http://www.example.org/jo/blog>');

        start();
    });
});
*/
