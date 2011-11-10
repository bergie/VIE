VIE.prototype.RdfaRdfQueryService = function(options) {
    if (!options) {
        options = {};
    }
    this.vie = null;
    this.name = 'rdfardfquery';
};

VIE.prototype.RdfaRdfQueryService.prototype = {
    
    analyze: function(analyzable) {
        analyzable.reject("Not yet implemented");
    },
        
    load : function(loadable) {
        analyzable.reject("Not yet implemented");
    },

    save : function(savable) {
        var correct = savable instanceof this.vie.Savable;
        if (!correct) {
            analyzable.reject("Invalid Savable passed");
        }
    
        if (!savable.options.element) {
            analyzable.reject("Unable to write entity to RDFa, no element given");
        }
    
        if (!savable.options.entity) {
            analyzable.reject("Unable to write to RDFa, no entity given");
        }
        
        if (!jQuery.rdf) {
            analyzable.reject("No rdfQUery found.");
        }
        
        var entity = savable.options.entity;
        
        var triples = [];
        triples.push(entity.getSubject() + " a " + entity.get('@type'));
        //TODO: add all attributes!
        jQuery(savable.options.element).rdfa(triples);
    
        savable.resolve();
    }
    
};
