module("vie.js - RDFa Service");

test("Test simple RDFa parsing", function() {
    var z = new VIE();
    z.use(new z.RdfaService());

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
    z.use(new z.RdfaService());

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
    z.use(new z.RdfaService());

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
    z.use(new z.RdfaService());

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
    z.use(new z.RdfaService());

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
    z.use(new z.RdfaService());

    var html = jQuery('#qunit-fixture .rdfa-collection-reset');

    stop();
    z.load({element: html}).from('rdfa').execute().done(function(entities) {
        var entity = z.entities.get('<http://example.net/collectionreset>');
        ok(entity.isEntity);

        var collection = entity.get('collection');
        ok(collection.isCollection);
        equal(collection.length, 1);
        equal(collection.at(0).get('@type')[1].id, '<http://rdfs.org/sioc/ns#Post>');
        equal(jQuery('li[about]', html).length, 1);

        entity.set({
          collection: ['<http://example.net/collectionreset/item>', '<http://example.net/collectionreset/item2>']
        });

        collection = entity.get('collection');
        ok(collection.isCollection);
        equal(collection.length, 2);
        equal(jQuery('li[about]', html).length, 2);
        equal(jQuery('[about="http://example.net/collectionreset/item"]', html).length, 1);
        equal(jQuery('[about="http://example.net/collectionreset/item2"]', html).length, 1);

        // Add a blank node
        collection.add({});
        equal(jQuery('li[about]', html).length, 3);
        var newItem = collection.at(2);
        ok(newItem.isNew());
        newItem.set('@subject', 'http://example.net/collectionreset/item3');
        equal(jQuery('li[about]', html).length, 3);
        equal(jQuery('[about="http://example.net/collectionreset/item"]', html).length, 1);
        equal(jQuery('[about="http://example.net/collectionreset/item2"]', html).length, 1);
        equal(jQuery('[about="http://example.net/collectionreset/item3"]', html).length, 1);

        // Re-reset
        entity.set({
          collection: ['<http://example.net/collectionreset/item>', '<http://example.net/collectionreset/item2>', '<http://example.net/collectionreset/item3>']
        });
        equal(jQuery('li[about]', html).length, 3);
        equal(jQuery('[about="http://example.net/collectionreset/item"]', html).length, 1);
        equal(jQuery('[about="http://example.net/collectionreset/item2"]', html).length, 1);
        equal(jQuery('[about="http://example.net/collectionreset/item3"]', html).length, 1);
        start();
    });
});

test("Test type-specific collection RDFa templates", function () {
    var z = new VIE();
    z.use(new z.RdfaService());

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
    z.use(new z.RdfaService());

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

test("Test collection with custom RDFa template function", function () {
    var z = new VIE();
    z.use(new z.RdfaService());

    var html = jQuery('#qunit-fixture .rdfa-collection-scripttemplate2');

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
        z.service('rdfa').setTemplate('second', 'section', function (entity, callback, collectionView) {
            ok(collectionView instanceof z.view.Collection);
            window.setTimeout(function () {
                callback(jQuery(jQuery.trim(jQuery('.template', html).html())).clone(false));
            }, 0);
        });

        // Now adding should work
        collection.add({
            '@type': 'second'
        });

        window.setTimeout(function () {
            equal(jQuery('div[rel="section"]', html).children().length, 1);
            equal(collection.length, 1);
            equal(jQuery('div[rel="section"] h2', html).length, 1);

            collection.remove(collection.at(0));
            equal(jQuery('div[rel="section"]', html).children().length, 0);

            start();
        }, 1);
    });
});

test("Test direct RDFa collection", function () {
    var z = new VIE();
    z.use(new z.RdfaService());

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

test("Test RDFa datatype parsing", function () {
    var z = new VIE();
    z.use(new z.RdfaService());

    var html = jQuery('#qunit-fixture .rdfa-datatypes');

    stop();
    z.load({element: html}).from('rdfa').execute().done(function (entities) {
        var entity = z.entities.get('<http://example.net/datatypes>');

        ok(_.isBoolean(entity.get('boolean')));
        ok(_.isBoolean(entity.get('boolean2')));
        equal(entity.get('boolean'), false);
        equal(entity.get('boolean2'), true);

        ok(_.isDate(entity.get('date')));
        equal(entity.get('date').getFullYear(), 2012);

        ok(_.isNumber(entity.get('number')));
        equal(entity.get('number'), 123);

        // Test writing as well
        equal(jQuery('[property="boolean"]', html).attr('content'), 'false');
        entity.set('boolean', true);
        equal(jQuery('[property="boolean"]', html).attr('content'), 'true');

        entity.set('date', new Date('1999-05-08T21:00:01Z'));
        equal(jQuery('[property="date"]', html).attr('content'), '1999-05-08T21:00:01.000Z');

        entity.set('number', 42);
        equal(jQuery('[property="number"]', html).text(), '42');

        start();
    });
});

test("Test multiple RDFa instances of same entity", function () {
    var z = new VIE();
    z.use(new z.RdfaService());

    var html = jQuery('#qunit-fixture .rdfa-twoinstances');

    stop();
    z.load({element: html}).from('rdfa').execute().done(function (entities) {
        // Freshly parsed, there should be no recorded changes in the entity
        var entity = z.entities.get('<http://example.net/example>');
        equal(entity.changedAttributes(), false);
        equal(entity.hasChanged('<http://purl.org/dc/terms/description>'), false);

        // Change one value, now changes should be recorded
        entity.set('dcterms:description', 'Baz');
        equal(entity.get('<http://purl.org/dc/terms/description>'), 'Baz');
        equal(entity.hasChanged('<http://purl.org/dc/terms/description>'), true);
        start();
    });
});

test("Test anonymous relation", function () {
    var z = new VIE();
    z.use(new z.RdfaService());

    var html = jQuery('#qunit-fixture .rdfa-anonrelation');

    stop();
    z.load({element: html}).from('rdfa').execute().done(function (entities) {
        start();

        var entity = z.entities.get('<http://example.net/example>');
        ok(entity);
        equal(entity.get('dcterms:title'), 'Foo');

        var relations = entity.get('relations');
        equal(relations.length, 1);
        equal(relations.at(0).get('dcterms:title'), 'Bar');
    });
});

test("Test deep relations", function () {
    var z = new VIE();
    z.use(new z.RdfaService());

    var html = jQuery('#qunit-fixture .rdfa-deeprelation');

    stop();
    z.load({element: html}).from('rdfa').execute().done(function (entities) {
        start();

        var entity = z.entities.get('<http://example.net/example>');
        ok(entity);
        equal(entity.get('dcterms:title'), 'Foo');

        equal(jQuery('div[about]', html).length, 3);

        var relations = entity.get('relations');
        equal(relations.length, 1);

        var first = relations.at(0);
        equal(first.get('dcterms:title'), 'Bar');
        equal(jQuery('[rel="relations"] > div[about]', html).length, 1);

        relations.add({
          'dcterms:title': 'BarFoo'
        });
        equal(relations.length, 2);
        equal(relations.at(1).get('dcterms:title'), 'BarFoo');
        equal(jQuery('[rel="relations"] > div[about]', html).length, 2);
        equal(jQuery('div[property]', jQuery('[rel="relations"] > div[about]', html).get(1)).html(), 'BarFoo');

        relations.at(1).set('dcterms:title', 'BarFooBaz');
        equal(jQuery('div[property]', jQuery('[rel="relations"] > div[about]', html).get(1)).html(), 'BarFooBaz');

        relations.remove(relations.at(1));
        equal(relations.length, 1);
        equal(jQuery('[rel="relations"] > div[about]', html).length, 1);
        equal(jQuery('[rel="relations"] > div[about] div[property]', html).html(), 'Bar');

        var subrelations = first.get('subrelations');
        equal(subrelations.length, 1);
        var second = subrelations.at(0);
        equal(second.get('dcterms:title'), 'Baz');

        equal(jQuery('[rel="subrelations"] div[about]', html).length, 1);

        subrelations.add({
          'dcterms:title': 'BazFoo'
        });
        equal(subrelations.length, 2);
        equal(jQuery('[rel="subrelations"] div[about]', html).length, 2);
        equal(jQuery('div[property]', jQuery('[rel="subrelations"] div[about]', html).get(1)).html(), 'BazFoo');

        subrelations.at(1).set('dcterms:title', 'BazFooBar');
        equal(jQuery('div[property]', jQuery('[rel="subrelations"] > div[about]', html).get(1)).html(), 'BazFooBar');

        subrelations.remove(subrelations.at(1));
        equal(subrelations.length, 1);
        equal(jQuery('[rel="subrelations"] div[about]', html).length, 1);
        equal(jQuery('[rel="subrelations"] > div[about] div[property]', html).html(), 'Baz');
    });
});

test("Test local namespace declaration", function () {
    var z = new VIE();
    z.use(new z.RdfaService());

    var html = jQuery('#qunit-fixture .rdfa-localns');

    stop();
    z.load({element: html}).from('rdfa').execute().done(function (entities) {
        start();
        ok(entities.length);
        var entity = z.entities.at(0);
        ok(entity);
        ok(entity.isof('foo:Bar'));
        equal(entity.get('foo:Baz'), 'Foo');
    });
});
