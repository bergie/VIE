/**
 * VIE - Vienna IKS Editables
 * (c) 2011 Henri Bergius, IKS Consortium
 */
(function() {
    // Export the VIE namespace for both CommonJS and the browser
    var VIE;
    if (typeof exports !== 'undefined') {
        VIE = exports;
    } else {
        VIE = this.VIE = {};
    }

    // Require underscore using CommonJS require if it isn't yet loaded
    var _ = this._;
    if (!_ && (typeof require !== 'undefined')) _ = require('underscore')._;
    if (!_) {
        throw 'VIE requires underscore.js to be available';
    }

    // Require Backbone using CommonJS require if it isn't yet loaded
    var Backbone = this.Backbone;
    if (!Backbone && (typeof require !== 'undefined')) Backbone = require('backbone');
    if (!Backbone) {
        throw 'VIE requires Backbone.js to be available';
    }

    // Require jQuery using CommonJS require if it isn't yet loaded
    var jQuery = this.jQuery;
    if (!jQuery && (typeof require !== 'undefined')) jQuery = require('jquery');
    if (!jQuery) {
        throw 'VIE requires jQuery to be available';
    }

    // Backbone Model for RDF entities
    VIE.RDFEntity = Backbone.Model.extend({
        namespaces: {},
        type: '',

        toJSONLD: function() {
            var instance = this;
            var instanceLD = {};

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

            for (var property in instance.attributes) if(instance.attributes.hasOwnProperty(property)) { //  && typeof instance.attributes[property] != "function"
                if (["id"].indexOf(property) == -1)
                    instanceLD[property] = instance.attributes[property];
            }
            return instanceLD;
        }
    });

    // Backbone View for RDF entities represented in RDFa 
    VIE.RDFaView = Backbone.View.extend({
        // Ensure view gets updated when properties of the entity change
        initialize: function() {
            _.bindAll(this, 'render');
            this.model.bind('change', this.render);
        },

        render: function() {
            VIE.RDFa.writeEntity(this.el, this.model.toJSONLD());
            return this;
        }
    });

    // Entity Manager keeps track of all RDFa entities loaded via VIE
    VIE.EntityManager = {
        Entities: {},
        allEntities: [],

        Types: {},

        getById: function(id) {
            if (typeof VIE.EntityManager.Entities[id] === 'undefined') {
                return null;
            }
            return VIE.EntityManager.Entities[id];
        },

        getByJSONLD: function(jsonld) {
            var entityInstance;
            var properties;

            properties = VIE.EntityManager._JSONtoProperties(jsonld);

            if (typeof jsonld['@'] !== 'undefined') {
                entityInstance = VIE.EntityManager.getById(jsonld['@']);
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

        // Clean up JSON-LD so that it can be used as properties in a Backbone Model
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
                if (this.el.get(0) == element.get(0)) {
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
    },

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

            subject = VIE.RDFa.getSubject(element);

            // Read properties from element
            entity = VIE.RDFa._getElementProperties(subject, element, false);
            if (jQuery.isEmptyObject(entity)) {
                // No properties, skip creating entity
                return null;
            }

            // Resolve namespaces
            for (var propertyName in entity) {
                var propertyParts = propertyName.split(':');
                if (propertyParts.length === 1) {
                    // No namespace for element
                    continue;
                }
                namespace = VIE.RDFa._resolveNamespace(propertyParts[0], element);
                if (namespace) {
                    namespaces[propertyParts[0]] = namespace;
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

            if (typeof subject == 'string') {
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
                    if (typeof subject == 'string') {
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
                if (jQuery(this).get(0).nodeName == 'HTML') {
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
