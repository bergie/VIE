VIE.prototype.RdfaService = function(options) {
    if (!options) {
        options = {};
    }
    this.vie = null;
    this.name = 'rdfa';
    this.subjectSelector = options.subjectSelector ? options.subjectSelector : "[about],[typeof],[src],[href],html";
    this.predicateSelector = options.predicateSelector ? options.predicateSelector : "[property],[rel]";
    this.views = [];
};

VIE.prototype.RdfaService.prototype = {
    
    analyze: function(analyzable) {
        // in a certain way, analyze is the same as load
        var service = this;

        var correct = analyzable instanceof this.vie.Analyzable;
        if (!correct) {throw "Invalid Analyzable passed";}

        return this.load(new this.vie.Loadable({element : analyzable.options.element}));
    },
        
    load : function(loadable) {
        var service = this;
        var correct = loadable instanceof this.vie.Loadable;
        if (!correct) {
            throw "Invalid Loadable passed";
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
        jQuery(this.subjectSelector, element).add(jQuery(element).filter(this.subjectSelector)).each(function() {
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
        
        var entity = this._readEntityPredicates(subject, element, false);
        //if (jQuery.isEmptyObject(entity)) {
        //    return null;
        //}
    
        entity['@subject'] = subject;
        if (type) {
        	entity['@type'] = type;
        }
        
        var entityInstance = new this.vie.Entity(entity);
        entityInstance = this.vie.entities.addOrUpdate(entityInstance);
        this._registerEntityView(entityInstance, element);
        return entityInstance;
    },
    
    _writeEntity : function(entity, element) {
        var service = this;
        this._findPredicateElements(this.getElementSubject(element), element, true).each(function() {
            var predicateElement = jQuery(this);
            var predicate = service.getElementPredicate(predicateElement);
            if (!entity.has(predicate)) {
                return true;
            }
    
            var value = entity.get(predicate);
            if (value === service.readElementValue(predicate, predicateElement)) {
                return true;
            }
    
            service.writeElementValue(predicate, predicateElement, value);
        });
        return true;
    },
    
    _getViewForElement : function(element) {
        var viewInstance;
        jQuery.each(this.views, function() {
            if (this.el.get(0) === element.get(0)) {
                viewInstance = this;
                return false;
            }
        });
        return viewInstance;
    },
    
    _registerEntityView : function(entity, element) {
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
            var attributeValue = entity.get(predicate);
            if (attributeValue instanceof service.vie.Collection) {
                jQuery.each(service.getElementByPredicate(predicate, element), function() {
                    service._registerCollectionView(attributeValue, jQuery(this));
                });
            }
        });
        return viewInstance;
    },
    
    _registerCollectionView : function(collection, element) {
        var viewInstance = this._getViewForElement(element);
        if (viewInstance) {
            return viewInstance;
        }
    
        var entityTemplate = element.children(':first-child');
    
        viewInstance = new this.vie.view.Collection({
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
     	if (jQuery(element).attr('typeof')) {
	     	type = jQuery(element).attr('typeof');
		     	if (type.indexOf("://") !== -1) {
		     	return "<" + type + ">";
	     	}
	     	else {
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
        jQuery(element).closest(this.subjectSelector).each(function() {
            if (jQuery(this).attr('about')) {
                subject = jQuery(this).attr('about');
                return true;
            }
            if (jQuery(this).attr('src')) {
                subject = jQuery(this).attr('src');
                return true;
            }
            if (jQuery(this).attr('typeof')) {
                subject = VIE.Util.blankNodeID();
                //subject = this;
                return true;
            }
    
            // We also handle baseURL outside browser context by manually
            // looking for the `<base>` element inside HTML head.
            if (jQuery(this).get(0).nodeName === 'HTML') {
                jQuery(this).find('base').each(function() {
                    subject = jQuery(this).attr('href');
                });
            }
        });
                
        if (!subject) {
            return undefined;
        }
                
        if (typeof subject === 'object') {
            return subject;
        }
    
        return (subject.indexOf("_:") === 0)? subject : "<" + subject + ">";
    },
    
    setElementSubject : function(subject, element) {
        if (jQuery(element).attr('src')) {
            return jQuery(element).attr('src', subject);
        }
        return jQuery(element).attr('about', subject);
    },
    
    getElementPredicate : function(element) {
        var predicate;
        predicate = element.attr('property');
        if (!predicate) {
            predicate = element.attr('rel');
        }
        return predicate;
    },
    
    getElementBySubject : function(subject, element) {
        var service = this;
        return jQuery(element).find(this.subjectSelector).add(jQuery(element).filter(this.subjectSelector)).filter(function() {
            if (service.getElementSubject(jQuery(this)) !== subject) {
                return false;
            }
     
            return true;
        });
    },
    
    getElementByPredicate : function(predicate, element) {
        var service = this;
        var subject = this.getElementSubject(element);
        return jQuery(element).find(this.predicateSelector).add(jQuery(element).filter(this.predicateSelector)).filter(function() {
            if (service.getElementPredicate(jQuery(this)) !== predicate) {
                return false;
            }
    
            if (service.getElementSubject(jQuery(this)) !== subject) {
                return false;
            }
     
            return true;
        });
    },
    
    _readEntityPredicates : function(subject, element, emptyValues) {
        var service = this;
        var entityPredicates = {};
    
        this._findPredicateElements(subject, element, true).each(function() {
            var predicateElement = jQuery(this);
            var predicate = service.getElementPredicate(predicateElement);
            var value = service.readElementValue(predicate, predicateElement);
    
            if (value === null && !emptyValues) {
                return;
            }
    
            entityPredicates[predicate] = value;
        });
    
        if (jQuery(element).get(0).tagName !== 'HTML') {
            jQuery(element).parent('[rev]').each(function() {
                entityPredicates[jQuery(this).attr('rev')] = service.getElementSubject(this); 
            });
        }
    
        return entityPredicates;
    },
    
    _findPredicateElements : function(subject, element, allowNestedPredicates) {
        var service = this;
        return jQuery(element).find(this.predicateSelector).add(jQuery(element).filter(this.predicateSelector)).filter(function() {
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
            return "<" + resource + ">";
        }
                
        // `href` attribute also links to another RDF resource.
        var href = element.attr('href');
        if (href && element.attr('rel') === predicate) {
            return "<" + href + ">";
        }
    
        // If the predicate is a relation, we look for identified child objects
        // and provide their identifiers as the values. To protect from scope
        // creep, we only support direct descentants of the element where the
        // `rel` attribute was set.
        if (element.attr('rel')) {
            var value = [];
            var service = this;
            jQuery(element).children(this.subjectSelector).each(function() {
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
     	if (value instanceof Array && value.length > 0) value = value[0];
        
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
        
        var obj = {};
        
        $elem.each(function (i, e) {
            if (e.attributes && e.attributes.getNamedItemNS) {
                for (i = 0; i < e.attributes.length; i += 1) {
                    var attr = e.attributes[i];
                    if (/^xmlns(:(.+))?$/.test(attr.nodeName)) {
                        prefix = /^xmlns(:(.+))?$/.exec(attr.nodeName)[2] || '';
                        value = attr.nodeValue;
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
