module("zart.js - RDFa Service");

asyncTest("Test RDFa parsing", function() {
    var z = new Zart();
    z.use(z.RdfaService);

    var html = jQuery('<div about="http://dbpedia.org/resource/Albert_Einstein"><span property="foaf:name">Albert Einstein</span><span property="dbp:dateOfBirth" datatype="xsd:date">1879-03-14</span><div rel="dbp:birthPlace" resource="http://dbpedia.org/resource/Germany" /><span about="http://dbpedia.org/resource/Germany" property="dbp:conventionalLongName">Federal Republic of Germany</span></div>');

    z.load({element: html}).from('rdfa').execute().done(function(entities) {
        ok(entities);
        start();
    });
});

