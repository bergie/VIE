
(function(){

    VIE.prototype.RdfaRdfQueryService = function(options) {
        var defaults = {
            name : 'rdfardfquery',
            namespaces : {},
            rules : []
        };
        /* the options are merged with the default options */
        this.options = jQuery.extend(true, defaults, options ? options : {});

        this.views = [];

        this.vie = null; /* will be set via VIE.use(); */
        /* overwrite options.name if you want to set another name */
        this.name = this.options.name;
};

VIE.prototype.RdfaRdfQueryService.prototype = {

    init: function(){

        for (var key in this.options.namespaces) {
            var val = this.options.namespaces[key];
            this.vie.namespaces.add(key, val);
        }

        this.rules = jQuery.extend([], VIE.Util.transformationRules(this));
        this.rules = jQuery.merge(this.rules, (this.options.rules) ? this.options.rules : []);
    },

    analyze: function(analyzable) {
        // in a certain way, analyze is the same as load
        return this.load(analyzable);
    },

    load : function(loadable) {
        var service = this;
        var correct = loadable instanceof this.vie.Loadable || loadable instanceof this.vie.Analyzable;
        if (!correct) {
            throw new Error("Invalid Loadable/Analyzable passed");
        }

        var element = loadable.options.element ? loadable.options.element : jQuery(document);
        try {
            var rdf = jQuery(element).find("[about],[typeof]").rdfa();

            jQuery.each(jQuery(element).xmlns(), function(prefix, ns){
                service.vie.namespaces.addOrReplace(prefix, ns.toString());
            });

            var entities = VIE.Util.rdf2Entities(this, rdf);

            loadable.resolve(entities);
        } catch (e) {
            loadable.reject(e);
        }
    },

    save : function(savable) {
        var correct = savable instanceof this.vie.Savable;
        if (!correct) {
            savable.reject("Invalid Savable passed");
        }

        if (!savable.options.element) {
            savable.reject("Unable to write entity to RDFa, no element given");
        }

        if (!savable.options.entity) {
            savable.reject("Unable to write to RDFa, no entity given");
        }

        if (!jQuery.rdf) {
            savable.reject("No rdfQuery found.");
        }
        var entity = savable.options.entity;

        var triples = [];
        var type = entity.get('@type');
        type = (jQuery.isArray(type))? type[0] : type;
        type = type.id;
        triples.push(entity.getSubject() + " a " + type);
        //TODO: add all attributes!
        jQuery(savable.options.element).rdfa(triples);

        savable.resolve();
    }

};

})();
