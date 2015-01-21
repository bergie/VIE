//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     (c) 2011 Sebastian Germesin, IKS Consortium
//     (c) 2011 Szaby Grünwald, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://viejs.org/

// ## VIE - RdfaService service
// The RdfaService service allows ...
/*global document:false */

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
        rules : [],
        bnodePrefix: '_a'
    };
    /* the options are merged with the default options */
    this.options = jQuery.extend(true, defaults, options ? options : {});

    // Counter for bnodes created by this service instance
    this.bnodes = 0;

    this.views = [];
    this.templates = {};

    this.datatypeReaders = {
      '<http://www.w3.org/2001/XMLSchema#boolean>': function (value) {
        if (value === 'true' || value === 1 || value === true) {
          return true;
        }
        return false;
      },
      '<http://www.w3.org/2001/XMLSchema#dateTime>': function (value) {
        return new Date(value);
      },
      '<http://www.w3.org/2001/XMLSchema#integer>': function (value) {
        return parseInt(value, 10);
      }
    };

    this.datatypeWriters = {
      '<http://www.w3.org/2001/XMLSchema#dateTime>': function (value) {
        if (!_.isDate(value)) {
          return value;
        }
        return value.toISOString();
      }
    };

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

        var entities = this.readEntities(element);
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

    readEntities : function (element) {
        var service = this;
        var entities = [];
        var entityElements = jQuery(this.options.subjectSelector, element).add(jQuery(element).filter(this.options.subjectSelector)).each(function() {
            var ns = service.xmlns(this);
            for (var prefix in ns) {
                service.vie.namespaces.addOrReplace(prefix, ns[prefix]);
              }
            var entity = service._readEntity(jQuery(this));
            if (entity) {
                entities.push(entity);
            }
        });
        return entities;
    },

    _readEntity : function(element) {
        var subject = this.getElementSubject(element);
        var type = this._getElementType(element);
        var entity = this._readEntityPredicates(subject, element, false);
        if (jQuery.isEmptyObject(entity)) {
            return null;
        }
        var vie = this.vie;
        _.each(entity, function (value, predicate) {
            if (!_.isArray(value)) {
                return;
            }
            var valueCollection = new this.vie.Collection([], {
              vie: vie,
              predicate: predicate
            });
            _.each(value, function (valueItem) {
                var linkedEntity = vie.entities.addOrUpdate({'@subject': valueItem});
                valueCollection.addOrUpdate(linkedEntity);
            });
            entity[predicate] = valueCollection;
        }, this);
        entity['@subject'] = subject;
        if (type) {
            entity['@type'] = type;
        }
        var entityInstance = new this.vie.Entity(entity);
        entityInstance = this.vie.entities.addOrUpdate(entityInstance, {
          updateOptions: {
            silent: true,
            ignoreChanges: true
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

    _registerEntityView : function(entity, element, isNew) {
        if (!element.length) {
            return;
        }

        var service = this;
        var viewInstance = this._getViewForElement(element);
        if (viewInstance) {
            if (entity.hasRelations() && !viewInstance.collectionsChecked) {
                // Entity has collections but these haven't been registered
                // as views yet. This usually happens with deep relations.
                this._registerEntityCollectionViews(entity, element, viewInstance);
            }
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

        // For new elements, ensure their relations are read from DOM
        if (isNew) {
          jQuery(element).find(this.options.predicateSelector).add(jQuery(element).filter(this.options.predicateSelector)).each(function () {
            var predicate = jQuery(this).attr('rel');
            if (!predicate) {
              return;
            }
            entity.set(predicate, new service.vie.Collection([], {
              vie: service.vie,
              predicate: predicate
            }));
          });
        }

        this._registerEntityCollectionViews(entity, element, viewInstance);

        return viewInstance;
    },


    _registerEntityCollectionViews: function (entity, element, view) {
        var service = this;
        // Find collection elements and create collection views for them
        _.each(entity.attributes, function(value, predicate) {
            var attributeValue = entity.fromReference(entity.get(predicate));
            if (attributeValue && attributeValue.isCollection) {
                jQuery.each(service.getElementByPredicate(predicate, element), function() {
                    service._registerCollectionView(attributeValue, jQuery(this), entity);
                });
                // Collections of the entity have been checked and views
                // registered for them. This doesn't need to be done again.
                view.collectionsChecked = true;
            }
        });
    },

    setTemplate: function (type, predicate, template) {
      var templateFunc;

      if (!template) {
        template = predicate;
        predicate = 'default';
      }
      type = this.vie.namespaces.isUri(type) ? type : this.vie.namespaces.uri(type);

      if (_.isFunction(template)) {
        templateFunc = template;
      } else {
        templateFunc = this.getElementTemplate(template);
      }

      if (!this.templates[type]) {
        this.templates[type] = {};
      }

      this.templates[type][predicate] = templateFunc;

      // Update existing Collection Views where this template applies
      _.each(this.views, function (view) {
        if (!(view instanceof this.vie.view.Collection)) {
          return;
        }

        if (view.collection.predicate !== predicate) {
          return;
        }

        view.templates[type] = templateFunc;
      }, this);
    },

    getTemplate: function (type, predicate) {
      if (!predicate) {
        predicate = 'default';
      }
      type = this.vie.namespaces.isUri(type) ? type : this.vie.namespaces.uri(type);

      if (!this.templates[type]) {
        return;
      }

      return this.templates[type][predicate];
    },

    _getElementTemplates: function (element, entity, predicate) {
      var templates = {};

      var type = entity.get('@type');
      if (type && type.attributes && type.attributes.get(predicate)) {
        // Use type-specific templates, if any
        var attribute = type.attributes.get(predicate);
        _.each(attribute.range, function (childType) {
          var template = this.getTemplate(childType, predicate);
          if (template) {
            var vieChildType = this.vie.types.get(childType);
            templates[vieChildType.id] = template;
          }
        }, this);

        if (!_.isEmpty(templates)) {
          return templates;
        }
      }

      // Try finding templates that have types
      var self = this;
      jQuery('[typeof]', element).each(function () {
        var templateElement = jQuery(this);
        var childType = templateElement.attr('typeof');
        childType = self.vie.namespaces.isUri(childType) ? childType : self.vie.namespaces.uri(childType);
        if (templates[childType]) {
          return;
        }
        var templateFunc = self.getElementTemplate(templateElement);
        templates[childType] = templateFunc;
        templates['<http://www.w3.org/2002/07/owl#Thing>'] = templateFunc;
      });

      if (_.isEmpty(templates)) {
        var defaultTemplate = element.children(':first-child');
        if (defaultTemplate.length) {
          templates['<http://www.w3.org/2002/07/owl#Thing>'] = self.getElementTemplate(defaultTemplate);
        }
      }

      return templates;
    },

    // Return a template-generating function for given element
    getElementTemplate: function (element) {
        if (_.isString(element)) {
          element = jQuery.trim(element);
        }
        var service = this;
        return function (entity, callback) {
            var newElement = jQuery(element).clone(false);
            if (newElement.attr('about') !== undefined) {
                // Direct match with container element
                newElement.attr('about', '');
            }
            newElement.find('[about]').attr('about', '');
            var subject = service.findPredicateElements(subject, newElement, false).each(function () {
                var predicateElement = jQuery(this);
                var predicate = service.getElementPredicate(predicateElement);
                if (entity.has(predicate) && entity.get(predicate).isCollection) {
                    return true;
                }
                service.writeElementValue(null, predicateElement, '');
            });
            callback(newElement);
        };
    },

    _registerCollectionView : function(collection, element, entity) {
        var viewInstance = this._getViewForElement(element, true);
        if (viewInstance) {
            return viewInstance;
        }

        viewInstance = new this.vie.view.Collection({
            owner: entity,
            collection: collection,
            model: collection.model,
            el: element,
            templates: this._getElementTemplates(element, entity, collection.predicate),
            service: this
        });
        this.views.push(viewInstance);
        return viewInstance;
    },

    _getElementType : function (element) {
        var type;
        if (jQuery(element).attr('typeof') !== this.options.attributeExistenceComparator) {
            type = jQuery(element).attr('typeof');
            if (type && type.indexOf("://") !== -1) {
                return "<" + type + ">";
            } else {
                return type;
            }
        }
        return null;
    },

    _generatebnodeId: function () {
      var newId = this.options.bnodePrefix + ':' + this.bnodes;
      this.bnodes++;
      return newId;
    },

    getElementSubject : function(element, allowTypeOf) {
        var service = this;
        if (typeof document !== 'undefined') {
            if (element === document) {
                return document.baseURI;
            }
        }
        var subject;
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
                var typeElement = jQuery(this);
                if (typeElement.data('vie-bnode')) {
                  subject = typeElement.data('vie-bnode');
                  return true;
                }
                subject = service._generatebnodeId();
                typeElement.data('vie-bnode', subject);
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

    findSubjectElements: function (element) {
      return jQuery('[about]', element);
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

    parseElementValue: function (value, element) {
        if (!element.attr('datatype')) {
            return value;
        }
        var datatype = this.vie.namespaces.uri(element.attr('datatype'));
        if (!this.datatypeReaders[datatype]) {
            return value;
        }
        return this.datatypeReaders[datatype](value);
    },

    generateElementValue: function (value, element) {
        if (!element.attr('datatype')) {
            return value;
        }
        var datatype = this.vie.namespaces.uri(element.attr('datatype'));
        if (!this.datatypeWriters[datatype]) {
            return value;
        }
        return this.datatypeWriters[datatype](value);
    },

    readElementValue : function(predicate, element) {
        // The `content` attribute can be used for providing machine-readable
        // values for elements where the HTML presentation differs from the
        // actual value.
        var content = element.attr('content');
        if (content) {
            return this.parseElementValue(content, element);
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
                value.push(service.getElementSubject(this, true));
            });
            return value;
        }

        // If none of the checks above matched we return the HTML contents of
        // the element as the literal value.
        return this.parseElementValue(element.html(), element);
    },

    writeElementValue : function(predicate, element, value) {
        value = this.generateElementValue(value, element);

        //TODO: this is a hack, please fix!
        if (_.isArray(value) && value.length > 0) {
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

        $elem.each(function () {
            var e = this;
            for (i = 0; i < e.attributes.length; i += 1) {
                var attr = e.attributes[i];
                if (/^xmlns(:(.+))?$/.test(attr.nodeName)) {
                    var prefix = /^xmlns(:(.+))?$/.exec(attr.nodeName)[2] || '';
                    var value = attr.value;
                    if (prefix === '' || value !== '') {
                        obj[prefix] = attr.value;
                    }
                }
            }
        });

        return obj;
    }

};

})();
