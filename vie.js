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
//     var myBook = VIE.EntityManager.getBySubject('http://www.example.com/books/wikinomics');
//     alert(objectInstance.get('dc:title')); // "Wikinomics"
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

    // VIE.RDFEntity
    // -------------
    //
    // VIE.RDFEntity defines a common [Backbone Model](http://documentcloud.github.com/backbone/#Model) 
    // for RDF entities handled in VIE.
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
                instanceLD['@'] = '<' + instance.id + '>';
            } else {
                instanceLD['@'] = instance.cid.replace('c', '_:bnode');
            }

            if (instance.namespaces.length > 0) {
                instanceLD['#'] = instance.namespaces;
            }

            if (instance.type) {
                instanceLD.a = instance.type;
            }

            for (property in instance.attributes) {
                if (instance.attributes.hasOwnProperty(property)) {
                    if (['id'].indexOf(property) === -1) {
                        instanceLD[property] = instance.attributes[property];
                    }
                }
            }
            return instanceLD;
        }
    });

    // VIE.RDFaView
    // -------------
    //
    // VIE.RDFEntity defines a common [Backbone View](http://documentcloud.github.com/backbone/#View) 
    // for all RDFa -annotated elements on a page that have been loaded as
    // `VIE.RDFEntity` objects.
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
        //     var myBook = VIE.EntityManager.getBySubject('http://www.example.com/books/wikinomics');
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
        //
        // The entities accessed this way are singletons, so multiple calls to same
        // subject (`@` in JSON-LD) will all return the same `VIE.RDFEntity` instance.
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

            properties = VIE.EntityManager._JSONtoProperties(jsonld);

            if (typeof jsonld['@'] !== 'undefined') {
                entityInstance = VIE.EntityManager.getBySubject(jsonld['@']);
                if (entityInstance) {  
                    entityInstance.set(properties);
                    return entityInstance;
                }
            }

            entityInstance = new VIE.RDFEntity(properties);

            if (typeof jsonld['#'] !== 'undefined') {
                entityInstance.namespaces = jsonld['#'];
            }

            if (typeof jsonld.a !== 'undefined') {
                entityInstance.type = jsonld.a;
            }

            if (typeof jsonld['@'] !== 'undefined') {
                entityInstance.id = jsonld['@'];
                VIE.EntityManager.Entities[entityInstance.id] = entityInstance;
            }

            VIE.EntityManager.allEntities.push(entityInstance);

            return entityInstance;
        },

        // Helper for cleaning up JSON-LD so that it can be used as properties
        // of a Backbone Model
        _JSONtoProperties: function(jsonld) {
            var properties;
            properties = jQuery.extend({}, jsonld);
            delete properties['@'];
            delete properties.a;
            delete properties['#'];
            return properties;
        }
    };

    // Mapping between RDFa and Backbone models
    VIE.RDFaEntities = {
        Views: [],
    
        // Create a Backbone model instance for a RDFa-marked element
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

            jQuery.each(VIE.RDFaEntities.Views, function() {
                // Check whether we already have this view instantiated for the element
                if (this.el.get(0) === element.get(0)) {
                    viewInstance = this;
                    return false;
                }
            });

            if (!viewInstance) {
                // Create a view for the RDFa
                viewInstance = new VIE.RDFaView({
                    model: entityInstance, 
                    el: element,
                    tagName: element.get(0).nodeName
                });
                VIE.RDFaEntities.Views.push(viewInstance);
            }

            return entityInstance;
        },

        // Get a list of Backbone model instances for all RDFa-marked content in an element
        getInstances: function(element) {
            var entities = [];
            var entity;

            if (typeof element === 'undefined') {
                // We're working with the full document scope
                element = jQuery(document);
            }

            jQuery(VIE.RDFa.subjectSelector, element).add(jQuery(element).filter(VIE.RDFa.subjectSelector)).each(function() {
                entity = VIE.RDFaEntities.getInstance(this);
                if (entity) {
                    entities.push(entity);
                }
            });

            return entities;
        }
    };

    // RDFa reading and writing utilities
    VIE.RDFa = {
        // Resolved prefix->namespace pairs
        Namespaces: {},

        subjectSelector: '[about],[typeof],[src],html',
        predicateSelector: '[property],[rel]',

        // Get a JSON-LD en
        readEntity: function(element) {
            var entity;
            var subject;
            var namespaces = {};
            var namespace;
            var type;
            var propertyName;

            subject = VIE.RDFa.getSubject(element);

            // Read properties from element
            entity = VIE.RDFa._getElementProperties(subject, element, false);
            if (jQuery.isEmptyObject(entity)) {
                // No properties, skip creating entity
                return null;
            }

            // Resolve namespaces
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

            // Read typeof from element
            type = VIE.RDFa._getElementValue(element, 'typeof');
            if (type) {
                entity.a = type;
            }

            if (typeof subject === 'string') {
                entity['@'] = subject;
            }
            return entity;
        },

        readEntities: function(element) {
            var entities = [];
            var entity;

            if (typeof element === 'undefined') {
                // We're working with the full document scope
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

        writeEntity: function(element, jsonld) {
            VIE.RDFa.findElementProperties(VIE.RDFa.getSubject(element), element, true).each(function() {
                var propertyElement = jQuery(this);
                var propertyName = propertyElement.attr('property');

                if (typeof jsonld[propertyName] === 'undefined') {
                    // Entity doesn't contain this property
                    return true;
                }

                if (jsonld[propertyName] instanceof Array) {
                    // For now we don't deal with multivalued properties in Views
                    return true;
                }

                if (VIE.RDFa._readPropertyValue(propertyElement) !== jsonld[propertyName]) {
                    VIE.RDFa._writePropertyValue(propertyElement, jsonld[propertyName]);
                }
            });
            return this;
        },

        _readPropertyValue: function(element) {
            // Property has machine-readable content value
            var content = element.attr('content');
            if (content) {
                return content;
            }
            var resource = element.attr('resource');
            if (resource) {
                return '<' + resource + '>';
            }
            var href = element.attr('href');
            if (href) {
                return '<' + href + '>';
            }

            if (element.attr('rel')) {
                // Relation, we should look for identified child objects
                var value = [];
                jQuery(element).children(VIE.RDFa.subjectSelector).each(function() {
                    var subject = VIE.RDFa.getSubject(this);
                    if (typeof subject === 'string') {
                        value.push('<' + subject + '>');
                    }
                });
                return value;
            }

            // Property has inline value
            return element.html();
        },

        _writePropertyValue: function(element, value) {
            // Property has machine-readable content value
            var content = element.attr('content');
            if (content) {
                element.attr('content', value);
                return;
            }
            var resource = element.attr('resource');
            if (resource) {
                element.attr('resource', value);
            }

            // Property has inline value
            element.html(value);
        },

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

                // Handle baseURL also outside browser context
                if (jQuery(this).get(0).nodeName === 'HTML') {
                    jQuery(this).find('base').each(function() {
                        subject = jQuery(this).attr('href');
                    });
                }
            });

            return subject;
        },

        _resolveNamespace: function(prefix, element) {
            if (typeof VIE.RDFa.Namespaces[prefix] !== 'undefined') {
                return VIE.RDFa.Namespaces[prefix];
            }
            
            jQuery('[xmlns\\:' + prefix + ']').each(function() {
                VIE.RDFa.Namespaces[prefix] = jQuery(this).attr('xmlns:' + prefix);
            });

            return VIE.RDFa.Namespaces[prefix];
        },

        // Get the value of attribute from the element or from one of its children
        _getElementValue: function(element, propertyName) {
            element = jQuery(element);
            if (typeof element.attr(propertyName) !== 'undefined')
            {
                // Direct match with container
                return element.attr(propertyName);
            }
            return element.children('[' + propertyName + ']').attr(propertyName);
        },

        findElementProperties: function(subject, element, allowPropertiesInProperties) {
            return jQuery(element).find(VIE.RDFa.predicateSelector).add(jQuery(element).filter(VIE.RDFa.predicateSelector)).filter(function() {
                if (VIE.RDFa.getSubject(this) !== subject) {
                    // The property is under another entity, skip
                    return false;
                }

                if (!allowPropertiesInProperties) {
                    if (!jQuery(this).parents('[property]').length) {
                        return true;
                    }
                    // This property is under another property, skip
                    return false;
                }

                return true;
            });
        },

        _getElementProperties: function(subject, element, emptyValues) {
            var containerProperties = {};

            VIE.RDFa.findElementProperties(subject, element, true).each(function() {
                var propertyName;
                var propertyValue;
                var objectProperty = jQuery(this);

                propertyName = objectProperty.attr('property');
                if (!propertyName) {
                    propertyName = objectProperty.attr('rel');
                }

                propertyValue = VIE.RDFa._readPropertyValue(objectProperty);

                if (typeof containerProperties[propertyName] !== 'undefined') {
                    if (containerProperties[propertyName] instanceof Array) {
                        if (emptyValues) {
                            return;
                        }
                        containerProperties[propertyName].push(propertyValue);
                        return;
                    }
                    // Multivalued property, convert to Array
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
        }
    };

    VIE.cleanup = function() {
        VIE.EntityManager.Entities = {};
        VIE.EntityManager.allEntities = [];
        VIE.EntityManager.Types = {};
        VIE.RDFaEntities.Views = [];
        VIE.RDFa.Namespaces = {};
    };

}).call(this);
