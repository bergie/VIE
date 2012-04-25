//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     (c) 2011 Sebastian Germesin, IKS Consortium
//     (c) 2011 Szaby Grünwald, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://viejs.org/

// ## VIE - RdfaService service
// The RdfaService service allows ...

(function(){

// ## VIE.RdfaService(options)
// This is the constructor to instantiate a new service.  
// **Parameters**:  
// *{object}* **options** Optional set of fields, ```namespaces```, ```rules```, ```url```, or ```name```.  
// **Throws**:  
// *nothing*  
// **Returns**:  
// *{VIE.RdfaService}* : A **new** VIE.RdfaService instance.  
// **Example usage**:  
//
//     var rdfaService = new vie.RdfaService({<some-configuration>});
VIE.prototype.RdfaService = function(options) {
    var defaults = {
        name : 'rdfa',
        namespaces : {},
        subjectSelector : "[about],[typeof],[src],html",
        predicateSelector : "[property],[rel]",
        /* default rules that are shipped with this service */
        rules : []
    };
    /* the options are merged with the default options */
    this.options = jQuery.extend(true, defaults, options ? options : {});

    this.views = [],

    this.vie = null; /* will be set via VIE.use(); */
    /* overwrite options.name if you want to set another name */
    this.name = this.options.name;
};

VIE.prototype.RdfaService.prototype = {
    
// ### init()
// This method initializes certain properties of the service and is called
// via ```VIE.use()```.  
// **Parameters**:  
// *nothing*  
// **Throws**:  
// *nothing*  
// **Returns**:  
// *{VIE.RdfaService}* : The VIE.RdfaService instance itself.  
// **Example usage**:  
//
//     var rdfaService = new vie.RdfaService({<some-configuration>});
//     rdfaService.init();
    init: function(){

        for (var key in this.options.namespaces) {
            var val = this.options.namespaces[key];
            this.vie.namespaces.add(key, val);
        }
        
        this.rules = jQuery.merge([], VIE.Util.transformationRules(this));
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

        var element;
        if (!loadable.options.element) {
            if (typeof document === 'undefined') { 
                return loadable.resolve([]);
            }
            element = jQuery(document);
        } else {
            element = loadable.options.element;
        }
    
        var ns = this.xmlns(element);
        for (var prefix in ns) {
            this.vie.namespaces.addOrReplace(prefix, ns[prefix]);
        }
        var entities = [];
        var entityElements = jQuery(this.options.subjectSelector, element).add(jQuery(element).filter(this.options.subjectSelector)).each(function() {
            var entity = service._readEntity(jQuery(this));
            if (entity) {
                entities.push(entity);
            }
        });
        loadable.resolve(entities);
    },

    save : function(savable) {
        var correct = savable instanceof this.vie.Savable;
        if (!correct) {
            throw "Invalid Savable passed";
        }
    
        if (!savable.options.element) {
            // FIXME: we could find element based on subject
            throw "Unable to write entity to RDFa, no element given";
        }
    
        if (!savable.options.entity) {
            throw "Unable to write to RDFa, no entity given";
        }
    
        this._writeEntity(savable.options.entity, savable.options.element);
        savable.resolve();
    },
    
    _readEntity : function(element) {
        var subject = this.getElementSubject(element);
        var type = this._getElementType(element);
        var predicate, value, valueCollection;
        var entity = this._readEntityPredicates(subject, element, false);
        if (jQuery.isEmptyObject(entity)) {
            return null;
        }
        var vie = this.vie;
        for (predicate in entity) {
            value = entity[predicate];
            if (!_.isArray(value)) {
                continue;
            }
            valueCollection = new this.vie.Collection();
            _.each(value, function(valueItem) {
                var linkedEntity = vie.entities.addOrUpdate({'@subject': valueItem});
                valueCollection.addOrUpdate(linkedEntity);
            });
            entity[predicate] = valueCollection;
        }
        entity['@subject'] = subject;
        if (type) {
            entity['@type'] = type;
        }
        var entityInstance = new this.vie.Entity(entity);
        entityInstance = this.vie.entities.addOrUpdate(entityInstance, {
          updateOptions: {
            silent: true
          }
        });
        this._registerEntityView(entityInstance, element);
        return entityInstance;
    },
    
    _writeEntity : function(entity, element) {
        var service = this;
        this.findPredicateElements(this.getElementSubject(element), element, true).each(function() {
            var predicateElement = jQuery(this);
            var predicate = service.getElementPredicate(predicateElement);
            if (!entity.has(predicate)) {
                return true;
            }
    
            var value = entity.get(predicate);
            if (value && value.isCollection) {
                // Handled by CollectionViews separately
                return true;
            }
            if (value === service.readElementValue(predicate, predicateElement)) {
                return true;
            }
            service.writeElementValue(predicate, predicateElement, value);
        });
        return true;
    },
    
    _getViewForElement : function(element, collectionView) {
        var viewInstance;
        jQuery.each(this.views, function() {
            if (jQuery(this.el).get(0) === element.get(0)) {
                if (collectionView && !this.template) {
                    return true;
                }
                viewInstance = this;
                return false;
            }
        });
        return viewInstance;
    },
    
    _registerEntityView : function(entity, element) {
        if (!element.length) {
            return;
        }

        var service = this;
        var viewInstance = this._getViewForElement(element);
        if (viewInstance) {
            return viewInstance;
        }
    
        viewInstance = new this.vie.view.Entity({
            model: entity,
            el: element,
            tagName: element.get(0).nodeName,
            vie: this.vie,
            service: this.name
        });
        this.views.push(viewInstance);
    
        // Find collection elements and create collection views for them
        _.each(entity.attributes, function(value, predicate) {
            var attributeValue = entity.fromReference(entity.get(predicate));
            if (attributeValue && attributeValue.isCollection) {
                jQuery.each(service.getElementByPredicate(predicate, element), function() {
                    service._registerCollectionView(attributeValue, jQuery(this), entity);
                });
            }
        });
        return viewInstance;
    },
    
    _registerCollectionView : function(collection, element, entity) {
        var viewInstance = this._getViewForElement(element, true);
        if (viewInstance) {
            return viewInstance;
        }
    
        var entityTemplate = element.children(':first-child');
    
        viewInstance = new this.vie.view.Collection({
            owner: entity,
            collection: collection,
            model: collection.model,
            el: element,
            template: entityTemplate,
            service: this,
            tagName: element.get(0).nodeName
        });
        this.views.push(viewInstance);
        return viewInstance;
    },
    
    _getElementType : function (element) {
        var type;
        if (jQuery(element).attr('typeof') !== this.options.attributeExistenceComparator) {
            type = jQuery(element).attr('typeof');
            if (type.indexOf("://") !== -1) {
                return "<" + type + ">";
            } else {
                return type;
            }
        }
        return null;
    },
    
    getElementSubject : function(element) {
        var service = this;
        if (typeof document !== 'undefined') { 
            if (element === document) {
                return document.baseURI;
            }
        }
        var subject = undefined;
        var matched = null;
        jQuery(element).closest(this.options.subjectSelector).each(function() {
            matched = this;
            if (jQuery(this).attr('about') !== service.options.attributeExistenceComparator) {
                subject = jQuery(this).attr('about');
                return true;
            }
            if (jQuery(this).attr('src') !== service.options.attributeExistenceComparator) {
                subject = jQuery(this).attr('src');
                return true;
            }
            if (jQuery(this).attr('typeof') !== service.options.attributeExistenceComparator) {
                return true;
            }
            // We also handle baseURL outside browser context by manually
            // looking for the `<base>` element inside HTML head.
            if (jQuery(this).get(0).nodeName === 'HTML') {
                jQuery('base', this).each(function() {
                    subject = jQuery(this).attr('href');
                });
            }
        });

        if (!subject) {
            if (matched === element) {
                // Workaround for https://github.com/assaf/zombie/issues/235
                return service.getElementSubject(jQuery(element).parent());
            }
            return undefined;
        }
                
        if (typeof subject === 'object') {
            return subject;
        }
        if (subject.indexOf('_:') === 0) {
            return subject;
        }
        if (subject.indexOf('<') === 0) {
            return subject;
        }
        return "<" + subject + ">";
    },
    
    setElementSubject : function(subject, element) {
        if (jQuery(element).attr('src')) {
            return jQuery(element).attr('src', subject);
        }
        return jQuery(element).attr('about', subject);
    },
    
    getElementPredicate : function(element) {
        var predicate;
        element = jQuery(element);
        predicate = element.attr('property');
        if (!predicate) {
            predicate = element.attr('rel');
        }
        return predicate;
    },
    
    getElementBySubject : function(subject, element) {
        var service = this;
        return jQuery(element).find(this.options.subjectSelector).add(jQuery(element).filter(this.options.subjectSelector)).filter(function() {
            if (service.getElementSubject(jQuery(this)) !== subject) {
                return false;
            }
     
            return true;
        });
    },
    
    getElementByPredicate : function(predicate, element) {
        var service = this;
        var subject = this.getElementSubject(element);
        return jQuery(element).find(this.options.predicateSelector).add(jQuery(element).filter(this.options.predicateSelector)).filter(function() {
            var foundPredicate = service.getElementPredicate(jQuery(this));
            if (service.vie.namespaces.curie(foundPredicate) !== service.vie.namespaces.curie(predicate)) {
                return false;
            }
    
            if (service.getElementSubject(this) !== subject) {
                return false;
            }
     
            return true;
        });
    },
    
    _readEntityPredicates : function(subject, element, emptyValues) {
        var service = this;
        var entityPredicates = {};
    
        this.findPredicateElements(subject, element, true).each(function() {
            var predicateElement = jQuery(this);
            var predicate = service.getElementPredicate(predicateElement);
            if (predicate === '') {
                return;
            }
            var value = service.readElementValue(predicate, predicateElement);
            if (value === null && !emptyValues) {
                return;
            }
   
            entityPredicates[predicate] = value;
        });
    
        if (jQuery(element).get(0).tagName !== 'HTML') {
            jQuery(element).parent('[rev]').each(function() {
                var relation = jQuery(this).attr('rev');
                if (!relation) {
                    return;
                }
                entityPredicates[jQuery(this).attr('rev')] = service.getElementSubject(this); 
            });
        }
        return entityPredicates;
    },
    
    findPredicateElements : function(subject, element, allowNestedPredicates) {
        var service = this;
        return jQuery(element).find(this.options.predicateSelector).add(jQuery(element).filter(this.options.predicateSelector)).filter(function() {
            if (service.getElementSubject(this) !== subject) {
                return false;
            }
            if (!allowNestedPredicates) {
                if (!jQuery(this).parents('[property]').length) {
                    return true;
                }
                return false;
            }
    
            return true;
        });
    },
    
    readElementValue : function(predicate, element) {
        // The `content` attribute can be used for providing machine-readable
        // values for elements where the HTML presentation differs from the
        // actual value.
        var content = element.attr('content');
        if (content) {
            return content;
        }
                
        // The `resource` attribute can be used to link a predicate to another
        // RDF resource.
        var resource = element.attr('resource');
        if (resource) {
            return ["<" + resource + ">"];
        }
                
        // `href` attribute also links to another RDF resource.
        var href = element.attr('href');
        if (href && element.attr('rel') === predicate) {
            return ["<" + href + ">"];
        }
    
        // If the predicate is a relation, we look for identified child objects
        // and provide their identifiers as the values. To protect from scope
        // creep, we only support direct descentants of the element where the
        // `rel` attribute was set.
        if (element.attr('rel')) {
            var value = [];
            var service = this;
            jQuery(element).children(this.options.subjectSelector).each(function() {
                value.push(service.getElementSubject(this));
            });
            return value;
        }
    
        // If none of the checks above matched we return the HTML contents of
        // the element as the literal value.
        return element.html();
    },
    
    writeElementValue : function(predicate, element, value) {
        //TODO: this is a hack, please fix!
        if (value instanceof Array && value.length > 0) {
            value = value[0];
        }
        
        // The `content` attribute can be used for providing machine-readable
        // values for elements where the HTML presentation differs from the
        // actual value.
        var content = element.attr('content');
        if (content) {
            element.attr('content', value);
            return;
        }
                
        // The `resource` attribute can be used to link a predicate to another
        // RDF resource.
        var resource = element.attr('resource');
        if (resource) {
            element.attr('resource', value);
        }
    
        // Property has inline value. Change the HTML contents of the property
        // element to match the new value.
        element.html(value);
    },
    
    // mostyl copied from http://code.google.com/p/rdfquery/source/browse/trunk/jquery.xmlns.js
    xmlns : function (elem) {
        var $elem;
        if (!elem) {
            if (typeof document === 'undefined') { 
                return {};
            }
            $elem = jQuery(document);
        } else {
            $elem = jQuery(elem);
        }
        // Collect namespace definitions from the element and its parents
        $elem = $elem.add($elem.parents());
        var obj = {};

        $elem.each(function (i, e) {
            if (e.attributes) {
                for (i = 0; i < e.attributes.length; i += 1) {
                    var attr = e.attributes[i];
                    if (/^xmlns(:(.+))?$/.test(attr.nodeName)) {
                        var prefix = /^xmlns(:(.+))?$/.exec(attr.nodeName)[2] || '';
                        var value = attr.nodeValue;
                        if (prefix === '' || value !== '') {
                            obj[prefix] = attr.nodeValue;
                        }
                    }
                }
            }
        });
        
        return obj;
    }

};

})();
