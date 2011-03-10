//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://wiki.iks-project.eu/index.php/VIE
//
//  [VIE](http://wiki.iks-project.eu/index.php/VIE) enables you to make
//  [RDFa](http://en.wikipedia.org/wiki/RDFa) -annotated content on your
//  web pages editable.
//
//  For example, if your page contains the following mark-up:
//
//     <p xmlns:dc="http://purl.org/dc/elements/1.1/"
//        about="http://www.example.com/books/wikinomics">
//       In his latest book
//       <cite property="dc:title">Wikinomics</cite>,
//       <span property="dc:creator">Don Tapscott</span>
//       explains deep changes in technology,
//       demographics and business.
//       The book is due to be published in
//       <span property="dc:date" content="2006-10-01">October 2006</span>.
//     </p>
//
// Then with VIE you can get a proper Backbone Model object for that. First
// scan your page for RDFa entities:
//
//     VIE.RDFaEntities.getInstances();
//
// And then just access the entity by subject:
//
//     var myBook = VIE.EntityManager.getBySubject('<http://www.example.com/books/wikinomics>');
//     alert(myBook.get('dc:title')); // "Wikinomics"
//
// Properties of the entity may also be modified, and these changes will 
// also happen on the page itself:
//
//     myBook.set({'dc:title':'Wikinomics, Second Edition'});
//
// You can also access the entities via the `VIE.EntityManager.allEntities` array.
(function() {
    // Initial setup
    // -------------
    //
    // The VIE library is fully contained inside a `VIE` namespace. The 
    // namespace is available in both CommonJS and the browser.
    var VIE;
    if (typeof exports !== 'undefined') {
        VIE = exports;
    } else {
        VIE = this.VIE = {};
    }

    // ### Handle dependencies
    //
    // VIE tries to load its dependencies automatically. 
    // Please note that this autoloading functionality only works on the server.
    // On browser Backbone needs to be included manually.

    // Require [underscore.js](http://documentcloud.github.com/underscore/) 
    // using CommonJS require if it isn't yet loaded.
    //
    // On node.js underscore.js can be installed via:
    //
    //     npm install underscore
    var _ = this._;
    if (!_ && (typeof require !== 'undefined')) { _ = require('underscore')._; }
    if (!_) {
        throw 'VIE requires underscore.js to be available';
    }

    // Require [Backbone.js](http://documentcloud.github.com/backbone/) 
    // using CommonJS require if it isn't yet loaded.
    //
    // On node.js Backbone.js can be installed via:
    //
    //     npm install backbone
    var Backbone = this.Backbone;
    if (!Backbone && (typeof require !== 'undefined')) { Backbone = require('backbone'); }
    if (!Backbone) {
        throw 'VIE requires Backbone.js to be available';
    }

    // Require [jQuery](http://jquery.com/) using CommonJS require if it 
    // isn't yet loaded.
    //
    // On node.js jQuery can be installed via:
    //
    //     npm install jquery
    var jQuery = this.jQuery;
    if (!jQuery && (typeof require !== 'undefined')) { jQuery = require('jquery'); }
    if (!jQuery) {
        throw 'VIE requires jQuery to be available';
    }

    // VIE.EntityManager
    // -------------
    //
    // VIE.EntityManager keeps track of all RDFa entities loaded via VIE. This
    // means that entities matched by a common subject can be treated as singletons.
    //
    // It is possible to access all loaded entities via the 
    // `VIE.EntityManager.allEntities` array.
    VIE.EntityManager = {
        Entities: {},
        allEntities: [],

        Types: {},

        // ### VIE.EntityManager.getBySubject
        //
        // It is possible to get an entity that has been loaded from the page
        // via the `getBySubject` method. If the entity cannot be found this method
        // will return `null`.
        //
        // The entities accessed this way are singletons, so multiple calls to same
        // subject will all return the same `VIE.RDFEntity` instance.
        //
        // Example:
        //
        //     var myBook = VIE.EntityManager.getBySubject('<http://www.example.com/books/wikinomics>');
        getBySubject: function(id) {
            if (typeof VIE.EntityManager.Entities[id] === 'undefined') {
                return null;
            }
            return VIE.EntityManager.Entities[id];
        },

        // ### VIE.EntityManager.getByJSONLD
        //
        // Another way to get or load entities is by passing EntityManager a valid
        // JSON-LD object.
        //
        // This can be either called with a JavaScript object representing JSON-LD,
        // or with a JSON-LD string.
        //
        // Example:
        //
        //     var json = '{"@": "<http://www.example.com/books/wikinomics>","dc:title": "Wikinomics","dc:creator": "Don Tapscott","dc:date": "2006-10-01"}';
        //     var objectInstance = VIE.EntityManager.getByJSONLD(json);
        getByJSONLD: function(jsonld) {
            var entityInstance;
            var properties;

            if (typeof jsonld !== 'object') {
                try {
                    jsonld = jQuery.parseJSON(jsonld);
                } catch (e) {
                    return null;
                }
            }

            // The entities accessed this way are singletons, so multiple calls 
            // to same subject (`@` in JSON-LD) will all return the same   
            // `VIE.RDFEntity` instance.
            if (typeof jsonld['@'] !== 'undefined') {
                entityInstance = VIE.EntityManager.getBySubject(jsonld['@']);
            }
            
            if (entityInstance) {
                properties = VIE.EntityManager._JSONtoProperties(jsonld, entityInstance.attributes);
                entityInstance.set(properties);
                return entityInstance;
            }

            properties = VIE.EntityManager._JSONtoProperties(jsonld, {});
            entityInstance = new VIE.RDFEntity(properties);

            // Namespace prefixes are handled by the `#` property of JSON-LD.
            // We map this to the `namespaces` property of our `VIE.RDFEntity` 
            // instance.
            if (typeof jsonld['#'] !== 'undefined') {
                entityInstance.namespaces = jsonld['#'];
            }

            // Types are handled by the `a` property of JSON-LD. We map this
            // to the `type` property of our `VIE.RDFEntity` instance.
            if (typeof jsonld.a !== 'undefined') {
                entityInstance.type = VIE.RDFa._fromReference(jsonld.a);
            }

            // Subjects are handled by the `@` property of JSON-LD. We map this
            // to the `id` property of our `VIE.RDFEntity` instance.
            if (typeof jsonld['@'] !== 'undefined') {
                entityInstance.id = VIE.RDFa._fromReference(jsonld['@']);
                VIE.EntityManager.Entities[jsonld['@']] = entityInstance;
            }

            // All new entities must be added to the `allEntities` list.
            VIE.EntityManager.allEntities.push(entityInstance);

            return entityInstance;
        },

        // Figure out if a given value is a reference
        _isReference: function(value) {
            var matcher = new RegExp('^\<(.*)\>$');
            if (matcher.exec(value)) {
                return true;
            }
            return false;
        },
        
        // Create a list of Models for referenced properties
        _referencesToModels: function(value) {
            if (!_.isArray(value)) {
                value = [value];
            }
            
            var models = [];
            jQuery.each(value, function() {
                models.push(VIE.EntityManager.getByJSONLD({
                    '@': this
                }));
            });
            return models;
        },

        // Helper for cleaning up JSON-LD so that it can be used as properties
        // of a Backbone Model.
        _JSONtoProperties: function(jsonld, instanceProperties) {
            var properties;
            var references;
            var property;

            properties = jQuery.extend({}, jsonld);
            
            delete properties['@'];
            delete properties.a;
            delete properties['#'];
            
            for (property in properties) {
                if (properties.hasOwnProperty(property)) {
                    if (VIE.EntityManager._isReference(properties[property])) {
                        references = VIE.EntityManager._referencesToModels(properties[property]);
                        
                        if (instanceProperties[property] instanceof VIE.RDFEntityCollection) {
                            // Object already has this reference collection, keep it
                            // and add new references
                            jQuery.each(references, function() {
                                try {
                                    instanceProperties[property].add(this);
                                } catch (e) {}
                            });

                            properties[property] = instanceProperties[property];
                        }
                        else {
                            properties[property] = new VIE.RDFEntityCollection(references);
                        }
                    }
                }
            }

            return properties;
        },
        
        // Helper for removing existing information about loaded entities.
        cleanup: function() {
            VIE.EntityManager.Entities = {};
            VIE.EntityManager.allEntities = [];
            VIE.EntityManager.Types = {};
        }
    };

    // VIE.RDFEntity
    // -------------
    //
    // VIE.RDFEntity defines a common [Backbone Model](http://documentcloud.github.com/backbone/#Model) 
    // for RDF entities handled in VIE.
    //
    // Attributes that are references to other entities are exposed as
    // `VIE.RDFEntityCollection` objects containing those entities.
    VIE.RDFEntity = Backbone.Model.extend({
        namespaces: {},
        type: '',

        // VIE's entities have a method for generating [JSON-LD](http://json-ld.org/)
        // representations of themselves. JSON-LD is a lightweight format for handling
        // Linked Data (RDF) information.
        //
        // Using the book example from above, we could call:
        //
        //     myBook.toJSONLD();
        //
        // And we would get a JSON object looking like the following:
        //
        //     {
        //         '@': '<http://www.example.com/books/wikinomics>',
        //         'dc:title': 'Wikinomics',
        //         'dc:creator': 'Don Tapscott',
        //         'dc:date': '2006-10-01' 
        //     }
        //
        // Calling `JSON.stringify()` for this object would produce:
        //
        //
        //     {
        //         "@": "<http://www.example.com/books/wikinomics>",
        //         "dc:title": "Wikinomics",
        //         "dc:creator": "Don Tapscott",
        //         "dc:date": "2006-10-01"
        //     }
        toJSONLD: function() {
            var instance = this;
            var instanceLD = {};
            var property;

            if (typeof instance.id !== 'undefined') {
                instanceLD['@'] = VIE.RDFa._toReference(instance.id);
            } else {
                instanceLD['@'] = instance.cid.replace('c', '_:bnode');
            }

            if (instance.namespaces.length > 0) {
                instanceLD['#'] = instance.namespaces;
            }

            if (instance.type) {
                instanceLD.a = VIE.RDFa._toReference(instance.type);
            }

            for (property in instance.attributes) {
                if (instance.attributes.hasOwnProperty(property)) {
                    if (instance.attributes[property] instanceof VIE.RDFEntityCollection) {
                        instanceLD[property] = instance.attributes[property].map(function(referenceInstance) {
                            return VIE.RDFa._toReference(referenceInstance.id);
                        });
                    } else {
                        instanceLD[property] = instance.attributes[property];
                    }
                }
            }
            return instanceLD;
        }
    });

    // VIE.RDFEntityCollection
    // -----------------------
    //
    // VIE.RDFEntityCollection defines a common [Backbone Collection](http://documentcloud.github.com/backbone/#Collection) 
    // for references to RDF entities handled in VIE.
    VIE.RDFEntityCollection = Backbone.Collection.extend({
        model: VIE.RDFEntity
    });
    
    // VIE.RDFaEntities
    // -------------
    //
    // VIE.RDFaEntities provide mapping between RDFa on a page and Backbone Views.
    // When you load RDFa entities from a page, new `VIE.RDFEntity` objects will
    // be instantiated for them, and the DOM element the RDFa comes from will
    // be registered as a `VIE.RDFaView` instance.
    //
    // If you're working with RDFa -annotated content and want to access it as
    // Backbone Models, then VIE.RDFaEntities is the main access point.
    VIE.RDFaEntities = {
        // RDFaEntities manages a list of Views so that every view instance will be
        // a singleton.
        Views: [],

        // ### VIE.RDFaEntities.getInstance
        //
        // The `getInstance` method can be used for retrieving a single Backbone
        // Model for a given RDFa -annotated DOM element. It accepts 
        // [jQuery selectors](http://api.jquery.com/category/selectors/)
        // and returns a `VIE.RDFEntity` instance matching the content. If no valid
        // RDFa entities can be found from the element, then it returns `null`.
        //
        // Example:
        //
        //     var myBook = VIE.RDFaEntities.getInstance('p[about]');
        //     alert(myBook.get('dc:title')); // "Wikinomics"
        getInstance: function(element) {
            element = jQuery(element);
            var entityInstance;
            var viewInstance;
            var jsonld;

            jsonld = VIE.RDFa.readEntity(element);
            if (!jsonld) {
                return null;
            }

            entityInstance = VIE.EntityManager.getByJSONLD(jsonld);

            // Check whether we already have a View instantiated for the DOM element
            jQuery.each(VIE.RDFaEntities.Views, function() {
                if (this.el.get(0) === element.get(0)) {
                    viewInstance = this;
                    return false;
                }
            });

            // If no matching View was found, create a view for the RDFa
            if (!viewInstance) {
                viewInstance = new VIE.RDFaView({
                    model: entityInstance, 
                    el: element,
                    tagName: element.get(0).nodeName
                });
                VIE.RDFaEntities.Views.push(viewInstance);
            }

            return entityInstance;
        },

        // ### VIE.RDFaEntities.getInstances
        //
        // Get a list of Backbone Model instances for all RDFa-marked content in 
        // an element. The method accepts [jQuery selectors](http://api.jquery.com/category/selectors/)
        // as argument. If no selector is given, then the whole HTML document will
        // be searched.
        //
        // Example:
        //
        //     var allInstances = VIE.RDFaEntities.getInstances();
        //     alert(allInstances[0].get('dc:title')); // "Wikinomics"
        getInstances: function(element) {
            var entities = [];
            var entity;

            if (typeof element === 'undefined') {
                element = jQuery(document);
            }

            jQuery(VIE.RDFa.subjectSelector, element).add(jQuery(element).filter(VIE.RDFa.subjectSelector)).each(function() {
                entity = VIE.RDFaEntities.getInstance(this);
                if (entity) {
                    entities.push(entity);
                }
            });

            return entities;
        },
        
        // Helper for removing existing references to Views loaded for RDFa entities.
        cleanup: function() {
            VIE.RDFaEntities.Views = [];
        }
    };
    
    // VIE.RDFaView
    // -------------
    //
    // VIE.RDFaView defines a common [Backbone View](http://documentcloud.github.com/backbone/#View) 
    // for all RDFa -annotated elements on a page that have been loaded as
    // `VIE.RDFEntity` objects.
    //
    // In normal operation, the RDFaView objects are automatically handled by
    // `VIE.RDFaEntities`.
    VIE.RDFaView = Backbone.View.extend({

        // We ensure view gets updated when properties of the Entity change.
        initialize: function() {
            _.bindAll(this, 'render');
            this.model.bind('change', this.render);
        },

        // Rendering a view means writing the properties of the Entity back to
        // the element containing our RDFa annotations.
        render: function() {
            VIE.RDFa.writeEntity(this.el, this.model.toJSONLD());
            return this;
        }
    });

    // VIE.RDFa
    // --------
    //
    // RDFa reading and writing utilities. VIE.RDFa acts as a mapping tool between
    // [JSON-LD](http://json-ld.org/) -encoded RDF triples and RDFa -annotated content
    // on a page.
    VIE.RDFa = {
        Namespaces: {},

        // By default we look for RDF subjects based on elements that have a
        // `about`, `typeof` or `src` attribute. In addition, the full HTML page
        // is regarded as a valid subject.
        //
        // For more specialized scenarios this can be overridden:
        //
        //     VIE.RDFa.subjectSelector = '[about]';
        subjectSelector: '[about],[typeof],[src],html',
        
        // By default we look for RDF predicates based on elements that have a
        // `property` or `rel` attribute.
        //
        // For more specialized scenarios this can be overridden:
        //
        //     VIE.RDFa.predicateSelector = '[property]';
        predicateSelector: '[property],[rel],[rev]',

        // ### VIE.RDFa.getSubject
        //
        // Get the RDF subject for an element. The method accepts 
        // [jQuery selectors](http://api.jquery.com/category/selectors/) as
        // arguments. If no argument is given, then the _base URL_ of the
        // page is used.
        //
        // Returns the subject as a string if one can be found, and if the
        // given element has no valid subjects returns `undefined`.
        //
        // Example:
        //
        //     var subject = VIE.RDFa.getSubject('p[about]');
        //     alert(subject); // <http://www.example.com/books/wikinomics>
        getSubject: function(element) {
            if (typeof document !== 'undefined') {
                if (element === document) {
                    return document.baseURI;
                }
            }
            var subject;
            jQuery(element).closest(VIE.RDFa.subjectSelector).each(function() {
                if (jQuery(this).attr('about')) {
                    subject = jQuery(this).attr('about');
                    return true;
                }
                if (jQuery(this).attr('src')) {
                    subject = jQuery(this).attr('src');
                    return true;
                }
                if (jQuery(this).attr('typeof')) {
                    subject = this;
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

            return VIE.RDFa._toReference(subject);
        },

        // ### VIE.RDFa.readEntity
        //
        // Get a JSON-LD object for an RDFa-marked entity in 
        // an element. The method accepts [jQuery selectors](http://api.jquery.com/category/selectors/)
        // as argument. If the element contains no RDFa entities, the this method
        // returns `null`.
        //
        // Example:
        //
        //     var jsonld = VIE.RDFa.readEntity('p[about]');
        //
        // Would return a JSON-LD object looking like the following:
        //
        //     {
        //         '@': '<http://www.example.com/books/wikinomics>',
        //         'dc:title': 'Wikinomics',
        //         'dc:creator': 'Don Tapscott',
        //         'dc:date': '2006-10-01' 
        //     }
        readEntity: function(element) {
            var entity;
            var subject;
            var namespaces = {};
            var namespace;
            var type;
            var propertyName;

            subject = VIE.RDFa.getSubject(element);

            entity = VIE.RDFa._getElementProperties(subject, element, false);
            if (jQuery.isEmptyObject(entity)) {
                return null;
            }

            // We also try to resolve namespaces used in the RDFa entity. If they
            // can be found, we will write them to the `#` property of the object.
            for (propertyName in entity) {
                if (entity.hasOwnProperty(propertyName)) {
                    var propertyParts = propertyName.split(':');
                    if (propertyParts.length === 2) {
                        namespace = VIE.RDFa._resolveNamespace(propertyParts[0], element);
                        if (namespace) {
                            namespaces[propertyParts[0]] = namespace;
                        }
                    }
                }
            }
            if (!jQuery.isEmptyObject(namespaces)) {
                entity['#'] = namespaces;
            }

            // If the RDF type is defined, that will be set to the [`a` property](http://json-ld.org/spec/latest/#specifying-the-type)
            // of the JSON-LD object.
            type = VIE.RDFa._getElementValue(element, 'typeof');
            if (type) {
                entity.a = VIE.RDFa._toReference(type);
            }

            if (typeof subject === 'string') {
                entity['@'] = subject;
            }
            return entity;
        },

        // ### VIE.RDFa.readEntities
        //
        // Get a list of JSON-LD objects for RDFa-marked entities in 
        // an element. The method accepts [jQuery selectors](http://api.jquery.com/category/selectors/)
        // as argument.  If no selector is given, then the whole HTML document will
        // be searched.
        //
        // Example:
        //
        //     var jsonldEntities = VIE.RDFa.readEntities();
        //     JSON.stringify(jsonldEntities[0]);
        //
        // Would produce something like:
        //
        //     {
        //         "@": "<http://www.example.com/books/wikinomics>",
        //         "dc:title": "Wikinomics",
        //         "dc:creator": "Don Tapscott",
        //         "dc:date": "2006-10-01"
        //     }
        readEntities: function(element) {
            var entities = [];
            var entity;

            if (typeof element === 'undefined') {
                element = jQuery(document);
            }

            jQuery(VIE.RDFa.subjectSelector, element).add(jQuery(element).filter(VIE.RDFa.subjectSelector)).each(function() {
                entity = VIE.RDFa.readEntity(this);
                if (entity) {
                    entities.push(entity);
                }
            });

            return entities;
        },

        // ### VIE.RDFa.writeEntity
        //
        // Write the contents of a JSON-LD object into the given DOM element. This
        // method accepts [jQuery selectors](http://api.jquery.com/category/selectors/)
        // as arguments.
        //
        // Only properties matching RDFa-annotated predicates found found from
        // the selected DOM element will be written.
        writeEntity: function(element, jsonld) {
            VIE.RDFa.findPredicateElements(VIE.RDFa.getSubject(element), element, true).each(function() {
                var propertyElement = jQuery(this);
                var propertyName = propertyElement.attr('property');

                if (typeof jsonld[propertyName] === 'undefined') {
                    return true;
                }

                // Before writing to DOM we check that the value has actually changed.
                if (VIE.RDFa._readPropertyValue(propertyElement) !== jsonld[propertyName]) {
                    VIE.RDFa._writePropertyValue(propertyElement, jsonld[propertyName]);
                }
            });
            return this;
        },
        
        // ### VIE.RDFa.findPredicateElements
        //
        // Find RDFa-annotated predicates for a given subject inside the DOM. This
        // method accepts [jQuery selectors](http://api.jquery.com/category/selectors/)
        // as arguments.
        //
        // The method returns a list of matching DOM elements.
        //
        // Only predicates matching the given subject will be returned.
        // You can also tell whether to allow nested predicates to be returned, 
        // which is useful for example when instantiating WYSIWYG editors for 
        // editable properties, as most editors do not like getting nested.
        findPredicateElements: function(subject, element, allowNestedPredicates) {
            return jQuery(element).find(VIE.RDFa.predicateSelector).add(jQuery(element).filter(VIE.RDFa.predicateSelector)).filter(function() {
                if (VIE.RDFa.getSubject(this) !== subject) {
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

        // In JSON-LD all references are surrounded by `<` and `>`. Convert a regular
        // textual value to this format.
        _toReference: function(value) {
            return '<' + value + '>';
        },
        
        // In JSON-LD all references are surrounded by `<` and `>`. Convert reference
        // to a regular textual value.
        _fromReference: function(reference) {
            return reference.substring(1, reference.length - 1);
        },

        // Get value of a DOM element defining a RDFa predicate.
        _readPropertyValue: function(element) {

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
                return VIE.RDFa._toReference(resource);
            }
            
            // `href` attribute also links to another RDF resource.
            var href = element.attr('href');
            if (href) {
                return VIE.RDFa._toReference(href);
            }

            // If the predicate is a relation, we look for identified child objects
            // and provide their identifiers as the values. To protect from scope
            // creep, we only support direct descentants of the element where the
            // `rel` attribute was set.
            if (element.attr('rel')) {
                var value = [];
                jQuery(element).children(VIE.RDFa.subjectSelector).each(function() {
                    var subject = VIE.RDFa.getSubject(this);
                    if (typeof subject === 'string') {
                        value.push(subject);
                    }
                });
                return value;
            }

            // If none of the checks above matched we return the HTML contents of
            // the element as the literal value.
            return element.html();
        },

        // Write a value to a DOM element defining a RDFa predicate.
        _writePropertyValue: function(element, value) {

            // For now we don't deal with multivalued properties when writing
            // contents.
            if (value instanceof Array) {
                return true;
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

        // Namespace resolution, find namespace declarations from inside
        // a DOM element.
        _resolveNamespace: function(prefix, element) {
            if (typeof VIE.RDFa.Namespaces[prefix] !== 'undefined') {
                return VIE.RDFa.Namespaces[prefix];
            }
            
            jQuery('[xmlns\\:' + prefix + ']').each(function() {
                VIE.RDFa.Namespaces[prefix] = jQuery(this).attr('xmlns:' + prefix);
            });

            return VIE.RDFa.Namespaces[prefix];
        },

        // Get the value of an attribute from the element or from one of its children
        _getElementValue: function(element, propertyName) {
            element = jQuery(element);
            if (typeof element.attr(propertyName) !== 'undefined')
            {
                return element.attr(propertyName);
            }
            return element.children('[' + propertyName + ']').attr(propertyName);
        },

        // Get JSON-LD properties from a DOM element.
        _getElementProperties: function(subject, element, emptyValues) {
            var containerProperties = {};

            VIE.RDFa.findPredicateElements(subject, element, true).each(function() {
                var propertyName;
                var propertyValue;
                var objectProperty = jQuery(this);

                propertyName = objectProperty.attr('property');
                if (!propertyName) {
                    propertyName = objectProperty.attr('rel');
                }

                propertyValue = VIE.RDFa._readPropertyValue(objectProperty);
                if (propertyValue === null &&
                    !emptyValues) {
                    return;
                }

                if (typeof containerProperties[propertyName] !== 'undefined') {
                    if (containerProperties[propertyName] instanceof Array) {
                        if (emptyValues) {
                            return;
                        }
                        containerProperties[propertyName].push(propertyValue);
                        return;
                    }
                    // Multivalued properties, are converted to an Array
                    var previousValue = containerProperties[propertyName];
                    containerProperties[propertyName] = [];

                    if (emptyValues) {
                        return;
                    }

                    containerProperties[propertyName].push(previousValue);
                    containerProperties[propertyName].push(propertyValue);
                    return;
                }

                if (emptyValues) {
                    containerProperties[propertyName] = '';
                    return;
                }

                containerProperties[propertyName] = propertyValue;
            });

            return containerProperties;
        },
        
        // Helper for removing existing namespaces information.
        cleanup: function() {
            VIE.RDFa.Namespaces = {};
        }
    };

    // VIE.cleanup()
    // -------------
    //
    // By default VIE keeps track of all RDF entities, RDFa views and namespaces
    // handled. If you want to clear all of these (for example in unit tests),
    // then call:
    //
    //     VIE.cleanup();
    VIE.cleanup = function() {
        VIE.EntityManager.cleanup();
        VIE.RDFaEntities.cleanup();
        VIE.RDFa.cleanup();
    };

}).call(this);
