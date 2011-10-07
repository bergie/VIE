module("vie.js - RDFa Service");

test("Test simple RDFa parsing", function() {
    var z = new VIE();
    z.use(new z.RdfaService);

    var html = jQuery('<div xmlns:foaf="http://xmlns.com/foaf/0.1/" xmlns:dbp="http://dbpedia.org/property/" about="http://dbpedia.org/resource/Albert_Einstein"><span property="foaf:name">Albert Einstein</span><span property="dbp:dateOfBirth" datatype="xsd:date">1879-03-14</span><div rel="dbp:birthPlace" resource="http://dbpedia.org/resource/Germany" /><span about="http://dbpedia.org/resource/Germany" property="dbp:conventionalLongName">Federal Republic of Germany</span></div>');

    stop(1000); // 1 second timeout
    z.load({element: html}).from('rdfa').execute().done(function(entities) {
        ok(entities);
        equal(entities.length, 2);

        equal(entities[1].id, '<http://dbpedia.org/resource/Albert_Einstein>');
        equal(entities[1].get('foaf:name'), 'Albert Einstein');
        equal(entities[0].get('dbp:conventionalLongName'), 'Federal Republic of Germany');

        equal(z.entities.get('<http://dbpedia.org/resource/Germany>').id, entities[0].id);

        start();
    });
});

test("Test updating RDFa views", function() {
    var z = new VIE();
    z.use(new z.RdfaService);

    var html = jQuery('<div xmlns:foaf="http://xmlns.com/foaf/0.1/" xmlns:dbp="http://dbpedia.org/property/" about="http://dbpedia.org/resource/Albert_Einstein"><span property="foaf:name">Albert Einstein</span><span property="dbp:dateOfBirth" datatype="xsd:date">1879-03-14</span><div rel="dbp:birthPlace" resource="http://dbpedia.org/resource/Germany" /><span about="http://dbpedia.org/resource/Germany" property="dbp:conventionalLongName">Federal Republic of Germany</span></div>');
    
    stop(1000); // 1 second timeout
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
});

test("Test simple RDFa nested tags", function() {
    var z = new VIE();
    z.use(new z.RdfaService);

    var html = jQuery('<div xmlns:dcterms="http://purl.org/dc/terms/" id="myarticle" typeof="http://rdfs.org/sioc/ns#Post" about="http://example.net/blog/news_item"><h1 property="dcterms:title"><span>News item title</span></h1></div>');

    stop(1000); // 1 second timeout
    z.load({element: html}).from('rdfa').execute().done(function(entities) {
        equal(entities.length, 1);
        equal(entities[0].get('dcterms:title'), '<span>News item title</span>');
        start();
    });
});

test("Test RDFa property content", function() {
    var z = new VIE();
    z.use(new z.RdfaService);

    var html = jQuery('<div xmlns:iks="http://iks-project.eu/ontology/" xmlns:foaf="http://xmlns.com/foaf/0.1/" about="http://twitter.com/bergie"><span property="foaf:name">Henri Bergius</span><span property="iks:online" content="0"></span></div>');

    stop(1000); // 1 second timeout
    z.load({element: html}).from('rdfa').execute().done(function(entities) {
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
    z.use(new z.RdfaService);

    var html = jQuery('<p xmlns:dc="http://purl.org/dc/elements/1.1/" about="http://www.example.com/books/wikinomics">In his latest book <cite property="dc:title">Wikinomics</cite>, <span property="dc:creator">Don Tapscott</span> explains deep changes in technology, demographics and business. The book is due to be published in <span property="dc:date" content="2006-10-01">October 2006</span>.</p>');

    stop(1000); // 1 second timeout
    z.load({element: html}).from('rdfa').execute().done(function(entities) {
        var objectInstance = z.entities.get('<http://www.example.com/books/wikinomics>');
        equal(objectInstance.get('dc:title'), 'Wikinomics');
        equal(objectInstance.get('dc:creator'), 'Don Tapscott');
        start();
    });
});

test("Test RDFa image entitization", function() {
    var z = new VIE();
    z.namespaces.add('mgd', 'http://midgard-project.org/ontology/');
    z.namespaces.add('dcterms', 'http://purl.org/dc/terms/');
    z.use(new z.RdfaService);

    var html = jQuery('<div id="myarticle" typeof="http://rdfs.org/sioc/ns#Post" about="http://example.net/blog/news_item"><h1 property="dcterms:title"><span>News item title</span></h1><span rel="mgd:icon"><img typeof="mgd:photo" src="http://example.net/image.jpg" /></span></div>');

    stop(1000); // 1 second timeout
    debugger;
    z.load({element: html}).from('rdfa').execute().done(function(entities) {
    	var icons = z.entities.get('<http://example.net/blog/news_item>').get('mgd:icon');
        // Ensure we have the image correctly read
    	
        ok(icons instanceof Array, "Icons should be an array");
        equal(icons[0].id, '<http://example.net/image.jpg>');
        
        equal(jQuery('img', html).length, 1);

        z.entities.get('<http://example.net/blog/news_item>').unset("mgd:icon");
        
        equal(jQuery('img', html).length, 1);

        icons.push('<http://example.net/otherimage.jpg>');
        z.entities.get('<http://example.net/blog/news_item>').set({
            "mgd:icon" : icons
        });
        
        equal(jQuery('img', html).length, 0);
        
        equal(jQuery('img[src="http://example.net/otherimage.jpg"]', html).length, 0);

        start();
    });
});
