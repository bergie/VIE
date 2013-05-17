module("Core - Entity");

test('toJSONLD export to JSON', function() {
    var z = new VIE();
    z.namespaces.add('example', 'http://example.net/foo/');
    z.namespaces.add("foaf", "http://xmlns.com/foaf/0.1/");

    var person = z.types.add("foaf:Person").inherit(z.types.get('owl:Thing'));
    var musician = z.types.add("example:Musician").inherit(z.types.get('owl:Thing'));

    z.entities.add({
        '@subject': 'http://example.net/Madonna',
        '@type': ['foaf:Person', 'example:Musician']
    });

    var model = z.entities.get('http://example.net/Madonna');

    var exportedJson = JSON.stringify(model.toJSONLD());
    var parsedJson = JSON.parse(exportedJson);

    equal(parsedJson['@subject'], '<http://example.net/Madonna>');
    deepEqual(parsedJson['@type'], ['<http://xmlns.com/foaf/0.1/Person>', '<http://example.net/foo/Musician>']);
});
