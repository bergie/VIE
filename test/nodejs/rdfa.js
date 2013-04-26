var jQuery = require('jquery');
var vie = require('../../dist/vie.js');
var VIE = new vie.VIE({classic: true});
VIE.use(new VIE.RdfaService({attributeExistenceComparator: ''}), 'rdfa');
VIE.namespaces.add('dc', 'http://purl.org/dc/elements/1.1/');
VIE.namespaces.add('foaf', 'http://xmlns.com/foaf/0.1/');
VIE.namespaces.add('cal', 'http://www.w3.org/2002/12/cal#');
VIE.namespaces.add('mgd', 'http://www.midgard-project.org/midgard2/10.05');
VIE.namespaces.add('dbp', 'http://dbpedia.org/resource/');

// Until https://github.com/tmpvar/jsdom/issues/issue/81 is fixed you need to uncomment the following:
//VIE.RDFa.predicateSelector = '[property]';

exports['test inheriting subject'] = function(test) {
    var html = jQuery('<div about="http://dbpedia.org/resource/Albert_Einstein"><span property="foaf:name">Albert Einstein</span><span property="dbp:dateOfBirth" datatype="xsd:date">1879-03-14</span><div rel="dbp:birthPlace" resource="http://dbpedia.org/resource/Germany" /><span about="http://dbpedia.org/resource/Germany" property="dbp:conventionalLongName">Federal Republic of Germany</span></div>');

    var jsonldEntities = VIE.RDFa.readEntities(html);
    test.equal(jsonldEntities.length, 2, "This RDFa defines two entities but they don't get parsed to JSON");
    test.equal(jsonldEntities[1]['<http://xmlns.com/foaf/0.1/name>'], 'Albert Einstein');
    test.equal(jsonldEntities[0]['<http://dbpedia.org/resource/conventionalLongName>'], 'Federal Republic of Germany');
    test.equal(jsonldEntities[1]['<http://dbpedia.org/resource/birthPlace>'], jsonldEntities[0]['@subject'], "Check that the relation between the person and the birthplace was read correctly");

    var backboneEntities = VIE.RDFaEntities.getInstances(html);
    test.equal(backboneEntities.length, 2, "This RDFa defines two entities but they don't get to Backbone");
    test.equal(backboneEntities[1].get('foaf:name'), 'Albert Einstein');
    test.equal(backboneEntities[1].get('dbp:birthPlace') instanceof VIE.Collection, true, "Birthplace is a relation, so it should become a collection");
    test.equal(backboneEntities[1].get('dbp:birthPlace').at(0).get('dbp:conventionalLongName'), 'Federal Republic of Germany');
    test.equal(backboneEntities[0].get('dbp:conventionalLongName'), 'Federal Republic of Germany');
    
    // Test also resource collections
    var switzerlandEntity = VIE.EntityManager.getByJSONLD({
        '@subject': '<http://dbpedia.org/resource/Switzerland>',
        'dbp:conventionalLongName': 'Swiss Confederation'
    });
    backboneEntities[1].get('dbp:birthPlace').add(VIE.EntityManager.getBySubject('<http://dbpedia.org/resource/Switzerland>'));
    test.equal(backboneEntities[1].get('dbp:birthPlace').length, 2);
    test.equal(backboneEntities[1].get('dbp:birthPlace').get(switzerlandEntity.cid).get('dbp:conventionalLongName'), 'Swiss Confederation');

    VIE.cleanup();
    test.done();
};

exports['test subject singletons'] = function(test) {
   var html = jQuery('<div about="http://dbpedia.org/resource/Albert_Einstein"><span property="foaf:name">Albert Einstein</span><span property="dbp:dateOfBirth" datatype="xsd:date">1879-03-14</span><div rel="dbp:birthPlace" resource="http://dbpedia.org/resource/Germany" /><span about="http://dbpedia.org/resource/Germany" property="dbp:conventionalLongName">Federal Republic of Germany</span></div>');

    var backboneEntities = VIE.RDFaEntities.getInstances(html);

    test.equal(backboneEntities[1].get('foaf:name'), 'Albert Einstein');

    var individualInstance = VIE.EntityManager.getBySubject('<http://dbpedia.org/resource/Albert_Einstein>');
    test.equal(individualInstance.get('foaf:name'), 'Albert Einstein');

    individualInstance.set({'foaf:name': 'Al Einstein'});
    test.equal(backboneEntities[1].get('foaf:name'), 'Al Einstein');
    
    var countryInstance = VIE.EntityManager.getBySubject('<http://dbpedia.org/resource/Germany>');
    test.equal(countryInstance.id, '<http://dbpedia.org/resource/Germany>');

    // And then the interesting bit, check that it changed in the HTML as well
    jQuery('[property="foaf:name"]', html).each(function() {
        test.equal(jQuery(this).html(), 'Al Einstein', 'Check that the change actually affected the HTML');
    });

    VIE.cleanup();
    test.done();
};

exports['test updating views'] = function(test) {
    var html = jQuery('<div about="http://dbpedia.org/resource/Albert_Einstein"><span property="foaf:name">Albert Einstein</span><span property="dbp:dateOfBirth" datatype="xsd:date">1879-03-14</span><div rel="dbp:birthPlace" resource="http://dbpedia.org/resource/Germany" /><span about="http://dbpedia.org/resource/Germany" property="dbp:conventionalLongName">Federal Republic of Germany</span></div>');

    var backboneEntities = VIE.RDFaEntities.getInstances(html);
    
    test.equal(VIE.EntityManager.entities.length, 2);

    // Ensure we got the value
    test.equal(backboneEntities[0].get('dbp:conventionalLongName'), 'Federal Republic of Germany');

    // Change the value
    backboneEntities[0].set({'dbp:conventionalLongName': 'Switzerland'});

    // Ensure that it was changed in the model
    test.equal(backboneEntities[0].get('dbp:conventionalLongName'), 'Switzerland');
    var entityViaJSONLD = VIE.EntityManager.getByJSONLD(backboneEntities[0].toJSONLD());
    test.equal(VIE.EntityManager.entities.length, 2);

    // And then the interesting bit, check that it changed in the HTML as well
    jQuery('[property="dbp:conventionalLongName"]', html).each(function() {
        test.equal(jQuery(this).html(), 'Switzerland', 'Check that the change actually affected the HTML');
    });

    VIE.cleanup();
    test.done();
};

exports['test global entity'] = function(test) {
    var html = jQuery('<html><head><title>Jo\'s Friends and Family Blog</title><link rel="foaf:primaryTopic" href="#bbq" /><meta property="dc:creator" content="Jo" /></head><body>...</body></html>');

    var jsonldEntities = VIE.RDFa.readEntities(html);
    test.equal(jsonldEntities.length, 1);
    
    // We should find the dc:creator from this. Unfortunately there is no subject as this isn't on browser
    test.equal(jsonldEntities[0]['<http://purl.org/dc/elements/1.1/creator>'], 'Jo');
    test.equal(jsonldEntities[0]['@subject'].substr(0, 7), '_:bnode');
    VIE.cleanup();

    var html2 = jQuery('<html><head><title>Jo\'s Blog</title></head><body><h1><span property="dc:creator">Jo</span>\'s blog</h1><p>Welcome to my blog.</p></body></html>');

    jsonldEntities = VIE.RDFa.readEntities(html2);
    
    // We should find the dc:creator from this. Unfortunately there is no subject as this isn't on browser
    test.equal(jsonldEntities.length, 1);
    test.equal(jsonldEntities[0]['<http://purl.org/dc/elements/1.1/creator>'], 'Jo');

    VIE.cleanup();
    test.done();
};

/*
exports['test global entity with base URL'] = function(test) {
    var html = jQuery('<html><head><base href="http://www.example.org/jo/blog" /><title>Jo\'s Friends and Family Blog</title><link rel="foaf:primaryTopic" href="#bbq" /><meta property="dc:creator" content="Jo" /></head><body>...</body></html>');

    var jsonldEntities = VIE.RDFa.readEntities(html);
    
    // We should find the dc:creator from this. Unfortunately there is no subject as this isn't on browser
    test.equal(jsonldEntities[0]['<http://purl.org/dc/elements/1.1/creator>'], 'Jo');
    test.equal(jsonldEntities[0]['@subject'], '<http://www.example.org/jo/blog>');

    VIE.cleanup();
    test.done();
};
*/

exports['test about and anonymous'] = function(test) {
    var html = jQuery('<html><head><title>Jo\'s Friends and Family Blog</title><link rel="foaf:primaryTopic" href="#bbq" /><meta property="dc:creator" content="Jo" /></head><body><p about="#bbq" typeof="cal:Vevent">I\'m holding<span property="cal:summary">one last summer barbecue</span>, on <span property="cal:dtstart" content="2007-09-16T16:00:00-05:00" datatype="xsd:dateTime">September 16th at 4pm</span>.</p></body></html>');

    var jsonldEntities = VIE.RDFa.readEntities(html);
    test.equal(jsonldEntities.length, 2);
    test.equal(jsonldEntities[0]['@type'][0], '<http://www.w3.org/2002/12/cal#Vevent>');
    test.equal(jsonldEntities[0]['@subject'], '<#bbq>');
    test.ok(jsonldEntities[0]['<http://www.w3.org/2002/12/cal#dtstart>']);
    test.equal(jsonldEntities[0]['<http://www.w3.org/2002/12/cal#dtstart>'].toISOString(), new Date('2007-09-16T16:00:00-05:00').toISOString());
    
    var objectInstance = VIE.EntityManager.getByJSONLD(jsonldEntities[0]);
    test.equal(objectInstance.id, '<#bbq>');
    test.equal(objectInstance.isof('cal:Vevent'), true);

    VIE.cleanup();
    test.done();
};

exports['test example from README'] = function(test) {
    var html = jQuery('<div id="myarticle" typeof="http://rdfs.org/sioc/ns#Post" about="http://example.net/blog/news_item"><h1 property="dcterms:title">News item title</h1><div property="sioc:content">News item contents</div></div>');

    var objectInstance = VIE.RDFaEntities.getInstance(html);

    test.equal(objectInstance.get('dcterms:title'), 'News item title');

    objectInstance.set({'dcterms:title': 'Hello, world'});

    test.equal(objectInstance.get('dcterms:title'), 'Hello, world');

    // And then the interesting bit, check that it changed in the HTML as well
    jQuery('[property="dcterms:title"]', html).each(function() {
        test.equal(jQuery(this).html(), 'Hello, world', 'Check that the change actually affected the HTML');
    });

    VIE.cleanup();
    test.done();
};

exports['test simple example with nested tags'] = function(test) {
    var html = jQuery('<div id="myarticle" typeof="http://rdfs.org/sioc/ns#Post" about="http://example.net/blog/news_item"><h1 property="dcterms:title"><span>News item title</span></h1></div>');

    var objectInstance = VIE.RDFaEntities.getInstance(html);

    test.equal(objectInstance.get('dcterms:title'), '<span>News item title</span>');

    VIE.cleanup();
    test.done();
};

exports['test property content'] = function(test) {
  var html = jQuery('<div about="http://twitter.com/bergie"><span property="foaf:name">Henri Bergius</span><span property="iks:online" content="0"></span></div>');
  var person = VIE.RDFaEntities.getInstance(html);
  test.equal(person.get('iks:online'), 0);

  person.set({'iks:online': 1});

  test.equal(jQuery('[property="iks:online"]', html).attr('content'), 1);
  test.equal(jQuery('[property="iks:online"]', html).text(), '');

  VIE.cleanup();
  test.done();
};

exports['test example from wikipedia'] = function(test) {
    var html = jQuery('<p xmlns:dc="http://purl.org/dc/elements/1.1/" about="http://www.example.com/books/wikinomics">In his latest book <cite property="dc:title">Wikinomics</cite>, <span property="dc:creator">Don Tapscott</span> explains deep changes in technology, demographics and business. The book is due to be published in <span property="dc:date" content="2006-10-01">October 2006</span>.</p>');

    VIE.RDFaEntities.getInstances(html);
    var objectInstance = VIE.EntityManager.getBySubject('<http://www.example.com/books/wikinomics>');

    test.equal(objectInstance.get('dc:title'), 'Wikinomics');
    test.equal(objectInstance.get('dc:creator'), 'Don Tapscott');

    VIE.cleanup();
    test.done();
};

exports['test jsonld'] = function(test) {
    var json = '{"@subject": "<http://www.example.com/books/wikinomics>","dc:title": "Wikinomics","dc:creator": "Don Tapscott","dc:date": "2006-10-01"}';

    var objectInstance = VIE.EntityManager.getByJSONLD(json);

    test.equal(objectInstance.get('dc:title'), 'Wikinomics');
    test.equal(objectInstance.get('dc:creator'), 'Don Tapscott');
    
    test.equal(objectInstance.id, '<http://www.example.com/books/wikinomics>');
    
    var jsonld = objectInstance.toJSONLD();
    test.equal(jsonld['@subject'], '<http://www.example.com/books/wikinomics>');

    var invalidInstance = VIE.EntityManager.getByJSONLD('foo');
    test.equal(invalidInstance, null);

    VIE.cleanup();
    test.done();
};

exports['test iri wrapping'] = function(test) {
    var jsonld = {
        '@subject': 'foo:bar',
        'dc:title': 'Foo bar'
    };
    
    var objectInstance1 = VIE.EntityManager.getByJSONLD(jsonld);
    var objectInstance2 = VIE.EntityManager.getBySubject('foo:bar');
    var objectInstance3 = VIE.EntityManager.getBySubject('<foo:bar>');
    
    test.equal(objectInstance2.get('dc:title'), objectInstance1.get('dc:title'));
    test.equal(objectInstance3.get('dc:title'), objectInstance1.get('dc:title')); 
    
    VIE.cleanup();
    test.done();
};

exports['test unknown subject'] = function(test) {
    var json = '{"@subject": "<http://www.example.com/books/wikinomics>","dc:title": "Wikinomics","dc:creator": "Don Tapscott","dc:date": "2006-10-01"}';

    var objectInstance = VIE.EntityManager.getByJSONLD(json);

    var secondInstance = VIE.EntityManager.getBySubject('<http://foo/bar>');
    
    var thirdInstance = VIE.EntityManager.getBySubject('<http://www.example.com/books/wikinomics>');
    
    test.equal(secondInstance, undefined);
    test.equal(thirdInstance, objectInstance);
    
    VIE.cleanup();
    test.done();
};

/*
exports['test image entitization'] = function(test) {
    var html = jQuery('<div id="myarticle" typeof="http://rdfs.org/sioc/ns#Post" about="http://example.net/blog/news_item"><h1 property="dcterms:title"><span>News item title</span></h1><span rel="mgd:icon"><img typeof="mgd:photo" src="http://example.net/image.jpg" /></span></div>');

    var objectInstance = VIE.RDFaEntities.getInstance(html);
    
    var icons = objectInstance.get('mgd:icon');

    // Ensure we have the image correctly read
    test.equal(icons.at(0).getSubject(), '<http://example.net/image.jpg>');
    
    // Remove it and replace with another image
    icons.remove(icons.at(0));
    test.equal(jQuery('img', html).length, 0); 

    icons.add({'@subject': 'http://example.net/otherimage.jpg'});

    test.equal(jQuery('img', html).length, 1);    
    test.equal(jQuery('img[src="http://example.net/otherimage.jpg"]', html).length, 1);

    VIE.cleanup();
    test.done();
};
*/

exports['test list inside a list'] = function(test) {
    var html = jQuery('<div about="http://example.net/page"><ol rel="dc:hasPart" rev="dc:partOf"><li about="http://example.net/page#first"><span rel="foaf:depiction"><img src="http://example.net/image.jpg" /></span><span property="dc:title">First part</span></li></ol></div>');
    
    VIE.RDFaEntities.getInstances(html);
    var objectInstance = VIE.EntityManager.getBySubject('http://example.net/page');
    var parts = objectInstance.get('dc:hasPart');
    test.equal(parts.length, 1);
    
    parts.remove(parts.at(0));
    test.equal(parts.length, 0);
    
    parts.add({'@subject': 'http://example.net/page#second', 'foaf:depiction': ['<http://example.net/otherimage.jpg>'], 'dc:title': 'Second part'});
   
    test.equal(jQuery('li', html).length, 1);

    /*
    FIXME: We need to decide if we still want to support autocollectivization
    test.equal(jQuery('li img', html).length, 1);
    test.equal(jQuery('li img', html).attr('src'), 'http://example.net/otherimage.jpg');
    */
    
    VIE.cleanup();
    test.done();
};

exports['test adding anonymous elements to list'] = function(test) {
    var html = jQuery('<div about="http://example.net/page"><ol rel="dc:hasPart" rev="dc:partOf"><li about="http://example.net/page#first"><span rel="foaf:depiction"><img src="http://example.net/image.jpg" /></span><span property="dc:title">First part</span></li></ol></div>');
    
    VIE.RDFaEntities.getInstances(html);
    var objectInstance = VIE.EntityManager.getBySubject('http://example.net/page');
    var parts = objectInstance.get('dc:hasPart');
    test.equal(parts.length, 1);
    
    parts.add({'foaf:depiction': ['<http://example.net/otherimage.jpg>'], 'dc:title': 'Second part'});

    test.equal(parts.at(1).toJSONLD()['@subject'].indexOf('_:bnode'), 0);
    test.equal(objectInstance.toJSONLD()['<http://purl.org/dc/elements/1.1/hasPart>'][1], parts.at(1).toJSONLD()['@subject']);
    /*
    FIXME: We need to decide if we still want to support autocollectivization
    test.equal(jQuery('li img', html).length, 2);
    */
    
    VIE.cleanup();
    test.done();
};

exports['test list inside a list with two lists'] = function(test) {
    var html = jQuery('<div><div about="http://example.net/page"><ol rel="dc:hasPart" rev="dc:partOf"><li about="http://example.net/page#first"><span rel="foaf:depiction"><img src="http://example.net/image.jpg" /></span><span property="dc:title">First part</span></li></ol></div><div about="http://example.net/secondpage"><ol rel="dc:hasPart" rev="dc:partOf"><li about="#foo"><span property="dc:title">First part of second</span></li></ol></div></div>');
    var orig = html.html();
    VIE.RDFaEntities.getInstances(html);
    test.equal(orig, html.html(), 'HTML must not change by reading');
    var objectInstance = VIE.EntityManager.getBySubject('http://example.net/page');
    var parts = objectInstance.get('dc:hasPart');
    test.equal(parts.length, 1);
    
    var item = parts.at(0);
    var image = item.get('foaf:depiction');
    test.equal(image.length, 1);
    
    var secondInstance = VIE.EntityManager.getBySubject('http://example.net/secondpage');
    var secondParts = secondInstance.get('dc:hasPart');
    
    secondParts.remove(secondParts.at(0));
    test.equal(secondParts.length, 0);
    
    secondParts.add(item);
    
    // Test the internal state
    test.equal(parts.length, 1, "Ensure first part has only the original item");
    test.equal(secondParts.length, 1, "Ensure second part has only the added item");
    test.equal(image.length, 1, "Ensure the item only has the original image");
    
    // Test the DOM
    test.equal(jQuery('[about="http://example.net/page"] li', html).length, parts.length, "Ensure list in DOM of first part is same as the number of items in the part");
    test.equal(jQuery('[about="http://example.net/secondpage"] li', html).length, secondParts.length, "Ensure list in DOM of second part is same as the number of items in the part");
    test.equal(jQuery('li img', html).length, 1, "Ensure we only have the single image");
    
    VIE.cleanup();
    test.done();
};

/*exports['test relation example'] = function(test) {
    var html = jQuery('<div about="http://www.blogger.com/profile/1109404" rel="foaf:img"><img src="photo1.jpg" rel="license" resource="http://creativecommons.org/licenses/by/2.0/" property="dc:creator" content="Mark Birbeck" /></div>');
    VIE.RDFaEntities.getInstances(html);

    var profile = VIE.EntityManager.getBySubject('http://www.blogger.com/profile/1109404');
    var images = profile.get('foaf:img');
    test.equal(images.length, 1);
    test.equal(images.at(0).get('dc:creator'), 'Mark Birbeck');

    test.equal(images.at(0).id, '<photo1.jpg>');
    var licenses = images.at(0).get('license');
    test.equal(licenses.length, 1);

    VIE.cleanup();
    test.done();
}*/

exports['test table rows'] = function(test) {
    VIE.cleanup();

    var html = jQuery('<table border="1" width="100%" vocab="http://iks.demo.eu/" typeof="Table" about="Table42" rel="foaf:member"><tr about="SebastianG" typeof="Person"><td><span property="name">Sebastian</span></td><td><a href="http://www.dfki.de" property="affiliation">DFKI</a></td><td><span property="gender">m</span></td></tr></table>');

    VIE.RDFaEntities.getInstances(html);

    test.equal(VIE.EntityManager.entities.length, 2);
    test.equal(jQuery('tr', html).length, 1);

    var table = VIE.EntityManager.getBySubject('Table42');
    table.get('foaf:member').add({
        gender: 'm',
        name: 'Henri Bergius',
        id: 'bergie'
    });

    test.equal(jQuery('tr', html).length, 2);

    table.get('foaf:member').remove(table.get('foaf:member').at(1));

    test.equal(jQuery('tr', html).length, 1);

    VIE.cleanup();
    test.done();
};
