var jQuery = require('jquery');
var VIE = require('../vie.js');

// Until https://github.com/tmpvar/jsdom/issues/issue/81 is fixed
VIE.RDFa.predicateSelector = '[property]';

exports['test inheriting subject'] = function(test) {
    var html = jQuery('<div about="http://dbpedia.org/resource/Albert_Einstein"><span property="foaf:name">Albert Einstein</span><span property="dbp:dateOfBirth" datatype="xsd:date">1879-03-14</span><div rel="dbp:birthPlace" resource="http://dbpedia.org/resource/Germany" /><span about="http://dbpedia.org/resource/Germany" property="dbp:conventionalLongName">Federal Republic of Germany</span></div>');

    var jsonldEntities = VIE.RDFa.readEntities(html);
    test.equal(jsonldEntities.length, 2, "This RDFa defines two entities but they don't get parsed to JSON");

    test.equal(jsonldEntities[1]['foaf:name'], 'Albert Einstein');
    test.equal(jsonldEntities[0]['dbp:conventionalLongName'], 'Federal Republic of Germany');

    var backboneEntities = VIE.RDFaEntities.getInstances(html);
    test.equal(backboneEntities.length, 2, "This RDFa defines two entities but they don't get to Backbone");

    test.equal(backboneEntities[1].get('foaf:name'), 'Albert Einstein');
    test.equal(backboneEntities[0].get('dbp:conventionalLongName'), 'Federal Republic of Germany');

    VIE.cleanup();

    test.done();
};

exports['test updating views'] = function(test) {
    var html = jQuery('<div about="http://dbpedia.org/resource/Albert_Einstein"><span property="foaf:name">Albert Einstein</span><span property="dbp:dateOfBirth" datatype="xsd:date">1879-03-14</span><div rel="dbp:birthPlace" resource="http://dbpedia.org/resource/Germany" /><span about="http://dbpedia.org/resource/Germany" property="dbp:conventionalLongName">Federal Republic of Germany</span></div>');

    var backboneEntities = VIE.RDFaEntities.getInstances(html);

    // Ensure we got the value
    test.equal(backboneEntities[0].get('dbp:conventionalLongName'), 'Federal Republic of Germany');

    // Change the value
    backboneEntities[0].set({'dbp:conventionalLongName': 'Switzerland'});

    // Ensure that it was changed in the model
    test.equal(backboneEntities[0].get('dbp:conventionalLongName'), 'Switzerland');

    // And then the interesting bit, check that it changed in the HTML as well
    jQuery('[property="dbp:conventionalLongName"]', html).each(function() {
        test.equal(jQuery(this).html(), 'Switzerland', 'Check that the change actually affected the HTML');
    });

    VIE.cleanup();

    test.done();
};
