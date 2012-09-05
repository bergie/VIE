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


test("Test collection reset with RDFa", function() {
    var z = new VIE();
    z.use(new z.RdfaService);

    var html = jQuery('#qunit-fixture .rdfa-collection-reset');

    stop();
    z.load({element: html}).from('rdfa').execute().done(function(entities) {
        var entity = z.entities.get('<http://example.net/collectionreset>');
        ok(entity.isEntity);

        var collection = entity.get('collection');
        ok(collection.isCollection);
        equal(collection.length, 1);
        equal(jQuery('li[about]', html).length, 1);

        entity.set({
          collection: ['<http://example.net/collectionreset/item>']
        });

        collection = entity.get('collection');
        ok(collection.isCollection);
        equal(collection.length, 1);
        equal(jQuery('li[about]', html).length, 1);

        start();
    });
});

test("Test type-specific collection RDFa templates", function () {
    var z = new VIE();
    z.use(new z.RdfaService);

    var html = jQuery('#qunit-fixture .rdfa-collection-twotemplates');

    stop();
    z.load({element: html}).from('rdfa').execute().done(function (entities) {
        var mainEntity = z.entities.get('<http://example.net/mycollection>');
        ok(mainEntity.isEntity);

        var collection = mainEntity.get('section');
        ok(collection.isCollection);
        equal(collection.length, 2);
        equal(jQuery('div[about]', html).length, 3);
        equal(jQuery('h1', html).length, 1);
        equal(jQuery('h2', html).length, 1);

        collection.add({
          '@type': 'first'
        });
        equal(collection.length, 3);
        equal(jQuery('h1', html).length, 2);
        equal(jQuery('h2', html).length, 1);

        collection.remove(collection.at(2));
        equal(collection.length, 2);
        equal(jQuery('h1', html).length, 1);

        collection.add({
          '@type': 'second'
        });
        equal(collection.length, 3);
        equal(jQuery('h2', html).length, 2);
        equal(jQuery('h1', html).length, 1);

        collection.remove(collection.at(2));
        equal(collection.length, 2);
        equal(jQuery('h2', html).length, 1);

        // Add a model of unspecified type, should add using the second template
        collection.add({});
        equal(collection.length, 3);
        equal(jQuery('h2', html).length, 2);
        equal(jQuery('h1', html).length, 1);

        collection.remove(collection.at(2));
        equal(collection.length, 2);
        equal(jQuery('h2', html).length, 1);

        start();
    });
});

test("Test collection with custom RDFa template", function () {
    var z = new VIE();
    z.use(new z.RdfaService);

    var html = jQuery('#qunit-fixture .rdfa-collection-scripttemplate');

    stop();
    z.load({element: html}).from('rdfa').execute().done(function (entities) {
        var mainEntity = z.entities.get('<http://example.net/mycollection>');
        ok(mainEntity.isEntity);

        var collection = mainEntity.get('section');
        ok(collection.isCollection);
        equal(collection.length, 0);
        equal(jQuery('div[rel="section"]', html).children().length, 0);

        // We should not be able to add to DOM without template
        collection.add({});
        equal(jQuery('div[rel="section"]', html).children().length, 0);
        equal(collection.length, 1);
        collection.remove(collection.at(0));
        equal(collection.length, 0);

        // Register a template with the RDFa service
        z.service('rdfa').setTemplate('second', 'section', jQuery('.template', html).html());

        // Now adding should work
        collection.add({
          '@type': 'second'
        });
        equal(jQuery('div[rel="section"]', html).children().length, 1);
        equal(collection.length, 1);
        equal(jQuery('div[rel="section"] h2', html).length, 1);

        collection.remove(collection.at(0));
        equal(jQuery('div[rel="section"]', html).children().length, 0);

        start();
    });
});

test("Test direct RDFa collection", function () {
    var z = new VIE();
    z.use(new z.RdfaService);

    var html = jQuery('#qunit-fixture .rdfa-collection-twotemplates');

    stop();
    z.load({element: html}).from('rdfa').execute().done(function (entities) {
        var mainEntity = z.entities.get('<http://example.net/mycollection>');
        ok(mainEntity.isEntity);

        var collection = mainEntity.get('section');
        ok(collection.isCollection);
        equal(collection.length, 2);

        equal(collection.at(0).get('title'), 'Content');

        equal(jQuery('div[about]', html).length, 3);
        equal(jQuery('h1', html).length, 1);
        equal(jQuery('h2', html).length, 1);

        collection.add({
          '@type': 'first'
        });
        equal(collection.length, 3);
        equal(jQuery('h1', html).length, 2);
        equal(jQuery('h2', html).length, 1);

        collection.remove(collection.at(2));
        equal(collection.length, 2);
        equal(jQuery('h1', html).length, 1);

        collection.add({
          '@type': 'second'
        });
        equal(collection.length, 3);
        equal(jQuery('h2', html).length, 2);
        
        start();
    });
});
