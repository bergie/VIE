module("Core - Entity");

test('toJSONLD export to JSON', function() {
    var z = new VIE();

    z.entities.add({
        '@subject': 'http://example.net/foo',
        'dc:title': 'Bar'
    });

    var model = z.entities.get('http://example.net/foo');

    var jsonLd = model.toJSONLD();
    var exportedJson = JSON.stringify(jsonLd);

    var parsedJson = JSON.parse(exportedJson);

    equal(parsedJson['@subject'], '<http://example.net/foo>');
    equal(parsedJson['@type'], '<http://www.w3.org/2002/07/owl#Thing>');
});
