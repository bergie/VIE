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

    console.log(jQuery(element).rdfa(), element);

    loadable.reject();
};
