Zart.prototype.RdfaRdfQueryService = function(options) {
    if (!options) {
        options = {};
    }
    this.zart = null;
    this.name = 'rdfa';

    if (typeof jQuery.rdf !== 'function') {
        throw "RdfQuery is not loaded";
    }
};

Zart.prototype.RdfaRdfQueryService.prototype.load = function(loadable) {
    var service = this;
    var correct = loadable instanceof this.zart.Loadable;
    if (!correct) {
        throw "Invalid Loadable passed";
    }

    var element = loadable.options.element ? loadable.options.element : jQuery(document);

    var rdf = jQuery(element).rdfa();

    var namespaces = {};
    jQuery.each(jQuery(element).xmlns(), function(prefix, ns) {
        namespaces[prefix] = ns.toString();
    });

    var entities = {}
    rdf.where('?subject ?property ?object').each(function() {
        var subject = this.subject.toString();
        if (!entities[subject]) {
            entities[subject] = {
                '@subject': subject
            };
        }
        var propertyUri = this.property.toString();

        var propertyCurie = jQuery.createCurie(propertyUri.substring(1, propertyUri.length - 1), {namespaces: namespaces});
        entities[subject][propertyCurie] = this.object.toString();
    });

    zartEntities = [];
    jQuery.each(entities, function() {
        zartEntities.push(new service.zart.Entity(this));
    });
    loadable.resolve(zartEntities);
};
