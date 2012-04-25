//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     (c) 2011 Sebastian Germesin, IKS Consortium
//     (c) 2011 Szaby Grünwald, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://viejs.org/

// Classic VIE API bindings to new VIE
VIE.prototype.ClassicRDFa = function(vie) {
    this.vie = vie;
};

VIE.prototype.ClassicRDFa.prototype = {
    readEntities: function(selector) {
        var jsonEntities = [];
        var entities = this.vie.RDFaEntities.getInstances(selector);
        _.each(entities, function(entity) {
            jsonEntities.push(entity.toJSONLD());
        });
        return jsonEntities;
    },

    findPredicateElements: function(subject, element, allowNestedPredicates) {
        return this.vie.services.rdfa.findPredicateElements(subject, element, allowNestedPredicates);
    },

    getPredicate: function(element) {
        return this.vie.services.rdfa.getElementPredicate(element);
    },

    getSubject: function(element) {
        return this.vie.services.rdfa.getElementSubject(element);
    }
};

VIE.prototype.ClassicRDFaEntities = function(vie) {
    this.vie = vie;
};

VIE.prototype.ClassicRDFaEntities.prototype = {
    getInstances: function(selector) {
        if (!this.vie.services.rdfa) {
            this.vie.use(new this.vie.RdfaService());
        }
        var foundEntities = null;
        var loaded = false;
        this.vie.load({element: selector}).from('rdfa').execute().done(function(entities) {
            foundEntities = entities;
            loaded = true;
        });

        while (!loaded) {
        }

        return foundEntities;
    },

    getInstance: function(selector) {
        var instances = this.getInstances(selector);
        if (instances && instances.length) {
            return instances.pop();
        }
        return null;
    }
};

VIE.prototype.ClassicEntityManager = function(vie) {
    this.vie = vie;
    this.entities = this.vie.entities;
};

VIE.prototype.ClassicEntityManager.prototype = {
    getBySubject: function(subject) {
        return this.vie.entities.get(subject);
    },

    getByJSONLD: function(json) {
        if (typeof json === 'string') {
            try {
                json = jQuery.parseJSON(json);
            } catch (e) {
                return null;
            }
        }
        return this.vie.entities.addOrUpdate(json);
    },

    initializeCollection: function() {
        return;
    }
};
