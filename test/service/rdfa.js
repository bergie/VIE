module("vie.js - RDFa Service");

test("Test simple RDFa parsing", function() {
    var z = new VIE();
    z.use(new z.RdfaService);

    var html = jQuery('#qunit-fixture .rdfa-simple div');

    stop();
    z.load({element: html}).from('rdfa').execute().done(function(entities) {
        ok(entities);
        equal(entities.length, 2);
        var albert = z.entities.get('<http://dbpedia.org/resource/Albert_Einstein>');
        var germany = z.entities.get('<http://dbpedia.org/resource/Germany>');
        equal(albert.id, '<http://dbpedia.org/resource/Albert_Einstein>');
        equal(albert.get('foaf:name'), 'Albert Einstein');
        equal(germany.get('dbp:conventionalLongName'), 'Federal Republic of Germany');

        start();
    });
});

test("Test updating RDFa views", function() {
    var z = new VIE();
    z.use(new z.RdfaService);

    var html = jQuery('#qunit-fixture .rdfa-updating div');
    
    stop();
    z.load({element: html}).from('rdfa').execute().done(function(entities) {
        ok(entities);
        equal(entities.length, 2);

        var germany = z.entities.get('<http://dbpedia.org/resource/Germany>');

        equal(germany.get('dbp:conventionalLongName'), 'Federal Republic of Germany');

        germany.set({'dbp:conventionalLongName': 'Switzerland'});
        equal(germany.get('dbp:conventionalLongName'), 'Switzerland');

        jQuery('[property="dbp:conventionalLongName"]', html).each(function() {
            equal(jQuery(this).html(), 'Switzerland');
        });

        start();
    });
});

test("Test simple RDFa nested tags", function() {
    var z = new VIE();
    z.use(new z.RdfaService);

    var html = jQuery('#qunit-fixture .rdfa-nested div');

    stop();
    z.load({element: html}).from('rdfa').execute().done(function(entities) {
        equal(entities.length, 1);
        equal(jQuery.trim(entities[0].get('dcterms:title')).toUpperCase(), '<span>News item title</span>'.toUpperCase());
        start();
    });
});

test("Test RDFa property content", function() {
    var z = new VIE();
    z.use(new z.RdfaService);

    var html = jQuery('#qunit-fixture .rdfa-property-content div');

    stop();
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

    var html = jQuery('#qunit-fixture .rdfa-wikipedia p');

    stop();
    z.load({element: html}).from('rdfa').execute().done(function(entities) {
        var objectInstance = z.entities.get('<http://www.example.com/books/wikinomics>');
        equal(objectInstance.get('dc:title'), 'Wikinomics');
        equal(objectInstance.get('dc:creator'), 'Don Tapscott');
        start();
    });
});

test("Test RDFa image entitization", function() {
    var options = {};
    if (navigator.userAgent === 'Zombie') {
        options.attributeExistenceComparator = '';
    }
    var z = new VIE();
    z.use(new z.RdfaService(options));

    var html = jQuery('#qunit-fixture .rdfa-image-entitization div');

    stop();
    
    z.load({element: html}).from('rdfa').execute().done(function(entities) {
    	var icons = z.entities.get('<http://example.net/blog/news_item>').get('mgd:icon');
        // Ensure we have the image correctly read
    	
        ok(icons instanceof z.Collection, "Icons should be a collection");
        if (!icons) {
            start();
            return;
        }
        equal(icons.at(0).id, '<http://example.net/image.jpg>');
        
        equal(jQuery('img', html).length, 1);
        
        // Remove it and replace with another image
        icons.remove(icons.at(0));
        equal(jQuery('img', html).length, 0);

        icons.add({'@subject': '<http://example.net/otherimage.jpg>'});
        
        equal(jQuery('img', html).length, 1);
        equal(jQuery('img[src="http://example.net/otherimage.jpg"]', html).length, 1);

        start();
    });
});
