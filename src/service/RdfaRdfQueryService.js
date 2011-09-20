/* TODO: give same functionality as RdfaService or remove

VIE.prototype.RdfaRdfQueryService = function(options) {
    if (!options) {
        options = {};
    }
    this.vie = null;
    this.name = 'rdfa';

    if (typeof jQuery.rdf !== 'function') {
        throw "RdfQuery is not loaded";
    }
};

VIE.prototype.RdfaRdfQueryService.prototype = {

    load: function(loadable){
        var service = this;
        var correct = loadable instanceof this.vie.Loadable;
        if (!correct) {
            throw "Invalid Loadable passed";
        }
        
        var element = loadable.options.element ? loadable.options.element : jQuery(document);
        
        var rdf = jQuery(element).rdfa();
        
        jQuery.each(jQuery(element).xmlns(), function(prefix, ns){
            service.vie.namespaces.addOrReplace(prefix, ns.toString());
        });
        
        var entities = {}
        rdf.where('?subject ?property ?object').each(function(){
            var subject = this.subject.toString();
            if (!entities[subject]) {
                entities[subject] = {
                    '@subject': subject
                };
            }
            var propertyUri = this.property.toString();
            
            var val;
            if (typeof this.object.value === "string") {
                val = this.object.value;
            }
            else {
                val = this.object.toString();
            }
            if (!entities[subject][propertyUri]) {
                entities[subject][propertyUri] = val;
            }
            else 
                if (!_.isArray(entities[subject][propertyUri])) {
                    entities[subject][propertyUri] = [entities[subject][propertyUri]];
                    entities[subject][propertyUri].push(val);
                }
                else {
                    entities[subject][propertyUri].push(val);
                }
        });
        
        var vieEntities = [];
        jQuery.each(entities, function(){
            vieEntities.push(service.vie.entities.addOrUpdate(this));
        });
        loadable.resolve(vieEntities);
    }
};


*/