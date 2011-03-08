var jQuery = require('jquery');
var VIE = require('../vie.js');

// Until https://github.com/tmpvar/jsdom/issues/issue/81 is fixed
VIE.RDFa.predicateSelector = '[property]';

exports['test inheriting subject'] = function(test) {
    var html = jQuery('<div about="http://dbpedia.org/resource/Albert_Einstein"><span property="foaf:name">Albert Einstein<span><span property="dbp:dateOfBirth" datatype="xsd:date">1879-03-14</span><div rel="dbp:birthPlace" resource="http://dbpedia.org/resource/Germany" /><span about="http://dbpedia.org/resource/Germany" property="dbp:conventionalLongName">Federal Republic of Germany</span></div>');

    var entities = VIE.RDFa.readEntities(html);
    test.equal(entities.length, 2, "This RDFa defines two entities but they don't get parsed to JSON");

    var entities = VIE.RDFaEntities.getInstances(html);
    test.equal(entities.length, 2, "This RDFa defines two entities but they don't get to Backbone");

    test.done();
};
