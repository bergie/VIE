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
    VIE.RDFEntity = Backbone.Model.extend({});

    // Backbone View for RDF entities represented in RDFa 
    VIE.RDFaView = Backbone.View.extend({
        // Ensure view gets updated when properties of the entity change
        initialize: function() {
            _.bindAll(this, 'render');
            this.model.bind('change', this.render);
        },

        render: function() {
            var model = this.model;
            VIE.RDFa.findElementProperties(this.el, true).each(function() {
                var propertyElement = jQuery(this);
                var propertyName = propertyElement.attr('property');

                if (model.get(propertyName) instanceof Array) {
                    // For now we don't deal with multivalued properties in Views
                    return true;
                }

                if (propertyElement.html() !== model.get(propertyName)) {
                    propertyElement.html(model.get(propertyName));
                }
            });
            return this;
        }
    });

    // Entity Manager keeps track of all RDFa entities loaded via VIE
    VIE.EntityManager = {
        Entities: {},

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

            if (typeof jsonld['@'] !== 'undefined') {
                entityInstance.id = jsonld['@'];
                VIE.EntityManager.Entities[entityInstance.id] = entityInstance;
            }

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
        Views: {},
    
        // Create a Backbone model instance for a RDFa-marked element
        getInstance: function(element) {
            var entityInstance;
            var viewInstance;
            var jsonld;

            jsonld = VIE.RDFa.readEntity(element);
            entityInstance = VIE.EntityManager.getByJSONLD(jsonld);

            // Create a view for the RDFa
            viewInstance = new VIE.RDFaView({
                model: entityInstance, 
                el: element,
                tagName: element.get(0).nodeName
            });

            return entityInstance;
        },

        // Get a list of Backbone model instances for all RDFa-marked content in an element
        getInstances: function(element) {
            var entities = [];
            jQuery('[typeof]', element).each(function() {
                entities.push(VIE.RDFaModels.getInstance(this));
            });
            return entities;
        }
    },

    // RDFa reading and writing utilities
    VIE.RDFa = {
        // Resolved prefix->namespace pairs
        Namespaces: {},

        // Get a JSON-LD en
        readEntity: function(element) {
            var entity;
            var identifier;
            var namespaces = {};

            // Read properties from element
            entity = VIE.RDFa._getElementProperties(element, false);

            // Resolve namespaces
            for (propertyName in entity) {
                var propertyParts = propertyName.split(':');
                if (propertyParts.length === 1) {
                    // No namespace for element
                    continue;
                }
                namespaces[propertyParts[0]] = VIE.RDFa._resolveNamespace(propertyParts[0], element);
            }
            if (!jQuery.isEmptyObject(namespaces)) {
                entity['#'] = namespaces;
            }

            // Read typeof from element
            entity.a = VIE.RDFa._getElementValue(element, 'typeof');

            // Read identifier from element, if any
            identifier =  VIE.RDFa._getElementValue(element, 'about');
            if (identifier) {
                entity['@'] = identifier;
            }

            return entity;
        },

        readEntities: function(element) {
            var entities = [];
            jQuery('[typeof]', element).each(function() {
                entities.push(VIE.RDFa.readEntity(this));
            });
            return entities;
        },

        _resolveNamespace: function(prefix, element) {
            if (typeof VIE.RDFa.Namespaces[prefix] !== 'undefined') {
                return VIE.RDFa.Namespaces[prefix];
            }
            
            jQuery('[xmlns\\:' + prefix + ']').each(function() {
                VIE.RDFa.Namespaces[prefix] = jQuery(this).attr('xmlns:' + prefix);
                return VIE.RDFa.Namespaces[prefix];
            });
        },

        // Get the value of attribute from the element or from one of its children
        _getElementValue: function(element, propertyName) {
            element = jQuery(element);
            if (typeof element.attr(propertyName) !== 'undefined')
            {
                // Direct match with container
                return element.attr(propertyName);
            }
            return element.find('[' + propertyName + ']').attr(propertyName);
        },

        findElementProperties: function(element, allowPropertiesInProperties) {
            element = jQuery(element);
            if (!element.attr('typeof')) {
                element = element.children('[typeof][about]');
            }
            return jQuery(element).find('[property]').add(jQuery(element).filter('[property]')).filter(function() {
                var closestRDFaEntity = jQuery(this).closest('[typeof][about]');
                if (closestRDFaEntity.index(element) !== 0 && 
                    closestRDFaEntity.length !== 0) {
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

        _getElementProperties: function(element, emptyValues) {
            var containerProperties = {};

            VIE.RDFa.findElementProperties(element, true).each(function() {
                var propertyName;
                var objectProperty = jQuery(this);
                propertyName = objectProperty.attr('property');

                if (typeof containerProperties[propertyName] !== 'undefined') {
                    if (containerProperties[propertyName] instanceof Array) {
                        if (emptyValues) {
                            return;
                        }
                        containerProperties[propertyName].push(objectProperty.html());
                        return;
                    }
                    // Multivalued property, convert to Array
                    var previousValue = containerProperties[propertyName];
                    containerProperties[propertyName] = [];

                    if (emptyValues) {
                        return;
                    }

                    containerProperties[propertyName].push(previousValue);
                    containerProperties[propertyName].push(objectProperty.html());
                    return;
                }

                if (emptyValues) {
                    containerProperties[propertyName] = '';
                    return;
                }

                containerProperties[propertyName] = objectProperty.html();
            });

            return containerProperties;
        }
    };

}).call(this);
