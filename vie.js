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
// You can also access the entities via the `VIE.EntityManager.entities` Backbone Collection.
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
    // `VIE.EntityManager.entities` Backbone Collection.
    VIE.EntityManager = {
        entities: null,
        
        initializeCollection: function() {
            if (VIE.EntityManager.entities === null) {
                VIE.EntityManager.entities = new VIE.RDFEntityCollection();
            }
        },

        // ### VIE.EntityManager.getBySubject
        //
        // It is possible to get an entity that has been loaded from the page
        // via the `getBySubject` method. If the entity cannot be found this method
        // will return `null`.
        //
        // The entities accessed this way are singletons, so multiple calls to same
        // subject will all return the same `VIE.RDFEntity` instance.
        //
        // Subjects may be either wrapped in `<` and `>` or not.
        //
        // Example:
        //
        //     var myBook = VIE.EntityManager.getBySubject('<http://www.example.com/books/wikinomics>');
        getBySubject: function(subject) {
            VIE.EntityManager.initializeCollection();
            if (typeof subject === 'string' &&
                VIE.RDFa._isReference(subject)) {
                subject = VIE.RDFa._fromReference(subject);
            }
            
            if (typeof subject === 'object')
            {
                return VIE.EntityManager.entities.detect(function(item) { 
                    if (item.id === subject) {
                        return true;
                    }
                    return false;
                });
            }

            return VIE.EntityManager.entities.get(subject);
        },

        // ### VIE.EntityManager.getByType
        // 
        // Get list of RDF Entities matching the given type.
        getByType: function(type) {
            VIE.EntityManager.initializeCollection();
            if (VIE.RDFa._isReference(type)) {
                type = VIE.RDFa._fromReference(type);
            }
        
            return VIE.EntityManager.entities.select(function(entity) {
                if (entity.type === type) {
                    return true;
                }
                return false;
            });
        },
        
        // ### VIE.EntityManager.getPredicate
        //
        // Get requested predicate from all loaded entities.
        getPredicate: function(predicate) {
            var predicates = [];
            _.forEach(VIE.EntityManager.entities.pluck('dcterms:hasPart'), function(property) {
                if (property) {
                    predicates.push(property);
                }
            });
            return predicates;
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
        getByJSONLD: function(jsonld, options) {
            VIE.EntityManager.initializeCollection();
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
                properties = VIE.EntityManager._JSONtoProperties(jsonld, entityInstance.attributes, entityInstance.id);
                entityInstance.set(properties, options);
                
                if (!entityInstance.type &&
                    typeof jsonld.a !== 'undefined') {
                    entityInstance.type = VIE.RDFa._fromReference(jsonld.a);
                }
                
                return entityInstance;
            }

            properties = VIE.EntityManager._JSONtoProperties(jsonld, {}, VIE.EntityManager._normalizeSubject(jsonld['@']));
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
            
            // Normalize the subject, handling both proper JSON-LD and JSON-LD
            // anonymous entities extracted from RDFa
            entityInstance.id = VIE.EntityManager._normalizeSubject(jsonld['@']);
            
            VIE.EntityManager.registerModel(entityInstance);
            return entityInstance;
        },

        // All new entities must be added to the `entities` collection.
        registerModel: function(model) {
            model.id = VIE.EntityManager._normalizeSubject(model.id);
            if (VIE.EntityManager.entities.indexOf(model) === -1) {
                VIE.EntityManager.entities.add(model);
            }
        },
        
        _normalizeSubject: function(subject) {
            // Subjects are handled by the `@` property of JSON-LD. We map this
            // to the `id` property of our `VIE.RDFEntity` instance.
            if (typeof subject === 'string') {
                if (VIE.RDFa._isReference(subject)) {
                    subject = VIE.RDFa._fromReference(subject);
                }
                return subject;
            }
            
            // When handling anonymous entities coming from RDFa, we keep their
            // containing element as the ID so they can be matched
            if (typeof subject === 'object') {
                return subject;
            }
            
            return undefined;
        },
        
        // Create a list of Models for referenced properties
        _referencesToModels: function(value) {
            if (!_.isArray(value)) {
                value = [value];
            }
            
            var models = [];
            _.forEach(value, function(subject) {
                models.push(VIE.EntityManager.getByJSONLD({
                    '@': subject
                }));
            });
            return models;
        },

        // Helper for cleaning up JSON-LD so that it can be used as properties
        // of a Backbone Model.
        _JSONtoProperties: function(jsonld, instanceProperties, instanceId) {
            var properties;
            var references;
            var property;

            properties = jQuery.extend({}, jsonld);
            
            delete properties['@'];
            delete properties.a;
            delete properties['#'];
            
            _.each(properties, function(propertyValue, property) {
                if (VIE.RDFa._isReference(propertyValue) ||
                    typeof propertyValue === 'object') {
                    references = VIE.EntityManager._referencesToModels(propertyValue);
                    if (instanceProperties[property] instanceof VIE.RDFEntityCollection) {
                        // Object already has this reference collection, keep it
                        // and add new references
                        jQuery.each(references, function() {
                            if (instanceProperties[property].indexOf(this) === -1) {
                                instanceProperties[property].add(this);
                            }
                        });

                        properties[property] = instanceProperties[property];
                    }
                    else {
                        properties[property] = new VIE.RDFEntityCollection(references);
                        if (instanceId) {
                            properties[property].subject = VIE.EntityManager._normalizeSubject(instanceId);
                            properties[property].predicate = property;
                        }
                    }
                }
            });

            return properties;
        },
        
        // Helper for removing existing information about loaded entities.
        cleanup: function() {
            VIE.EntityManager.entities = new VIE.RDFEntityCollection();
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
        
        // Get the subject of a RDF entity. For persistent entities full URL 
        // subjects will be returned wrapped in `<` and `>`. 
        // For non-persistent entities an anonymous `_:bnodeX` will be returned,
        // with `X` matching the local `cid` number of the entity instance.
        //
        // CURIEs will be returned as-is.
        getSubject: function() {
            if (typeof this.id === 'string') {
                if (this.id.substr(0, 7) === 'http://') {
                    return VIE.RDFa._toReference(this.id);
                }
                return this.id;
            }
            return this.cid.replace('c', '_:bnode');
        },

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

            _.each(instance.attributes, function(attributeValue, property) {
                attributeValue = instance.get(property);
                if (attributeValue instanceof VIE.RDFEntityCollection) {
                    instanceLD[property] = attributeValue.map(function(referenceInstance) {
                        if (referenceInstance.id) {	
                            return VIE.RDFa._toReference(referenceInstance.id);
                        } else {
                            return referenceInstance.cid.replace('c', '_:bnode');
                        }
                    });
                } else {
                    instanceLD[property] = attributeValue;
                }
            });
            
            instanceLD['@'] = instance.getSubject();

            if (instance.namespaces.length > 0) {
                instanceLD['#'] = instance.namespaces;
            }

            if (instance.type) {
                instanceLD.a = VIE.RDFa._toReference(instance.type);
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
        model: VIE.RDFEntity,
        initialize: function() {
            this.bind('add', this.registerItem);
        },
        registerItem: function(entityInstance, collection) {
            if (collection === VIE.EntityManager.entities) {
                return;
            }

            _.each(entityInstance.attributes, function(propertyValue, property) {
                if (VIE.RDFa._isReference(propertyValue)) {
                    references = VIE.EntityManager._referencesToModels(propertyValue);
                    entityInstance.attributes[property] = new VIE.RDFEntityCollection(references);
                }
            });

            VIE.EntityManager.registerModel(entityInstance);
        }
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
        CollectionViews: [],

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
            var jsonld;

            jsonld = VIE.RDFa.readEntity(element);
            if (!jsonld) {
                return null;
            }

            entityInstance = VIE.EntityManager.getByJSONLD(jsonld);

            VIE.RDFaEntities._registerView(entityInstance, element);

            return entityInstance;
        },
        
        _getViewInstance: function(element, collection) {
            var viewInstance;
            var viewArray = VIE.RDFaEntities.Views;
            element = jQuery(element);
            
            if (collection) {
                viewArray = VIE.RDFaEntities.CollectionViews;
            }
            
            jQuery.each(viewArray, function() {
                if (this.el.get(0) === element.get(0)) {
                    viewInstance = this;
                    return false;
                }
            });
            
            return viewInstance;
        },
        
        // Helper for registering views for a collection
        _registerCollectionView: function(collectionInstance, element) {
            var viewInstance;
            var template;
            element = jQuery(element);
            
            // Check whether we already have a View instantiated for the DOM element
            viewInstance = VIE.RDFaEntities._getViewInstance(element, true);
            if (viewInstance) {
                return viewInstance;
            }

            template = element.children(':first-child');

            viewInstance = new VIE.RDFaCollectionView({
                collection: collectionInstance,
                model: collectionInstance.model, 
                el: element,
                elementTemplate: template,
                tagName: element.get(0).nodeName
            });
            VIE.RDFaEntities.CollectionViews.push(viewInstance);

            return viewInstance;
        },
        
        // Helper for registering views for an entity
        _registerView: function(entityInstance, element, refreshCollections) {
            var viewInstance;
            element = jQuery(element);
            
            // Check whether we already have a View instantiated for the DOM element
            viewInstance = VIE.RDFaEntities._getViewInstance(element);
            if (viewInstance) {
                return viewInstance;
            }

            viewInstance = new VIE.RDFaView({
                model: entityInstance, 
                el: element,
                tagName: element.get(0).nodeName
            });
            VIE.RDFaEntities.Views.push(viewInstance);

            // Find collection elements, and create collection views for them
            _.each(entityInstance.attributes, function(attributeValue, property) {
                attributeValue = entityInstance.get(property);
                if (attributeValue instanceof VIE.RDFEntityCollection) {
                    jQuery.each(VIE.RDFa._getElementByPredicate(property, element), function() {
                        VIE.RDFaEntities._registerCollectionView(attributeValue, this);
                        if (refreshCollections) {
                            attributeValue.trigger('refresh', attributeValue);
                        }
                    });
                }
            });
            
            return viewInstance;
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
    
    // VIE.RDFaCollectionView
    // ----------------------
    //
    // VIE.RDFaCollectionView defines a common Backbone View for Collection properties
    VIE.RDFaCollectionView = Backbone.View.extend({
    
        elementTemplate: null,

        // Ensure the collection view gets updated when items get added or removed
        initialize: function() {
            this.elementTemplate = this.options.elementTemplate;
            _.bindAll(this, 'addItem', 'removeItem', 'refreshItems');
            this.collection.bind('add', this.addItem);
            this.collection.bind('remove', this.removeItem);
            this.collection.bind('refresh', this.refreshItems);
        },
        
        // When a collection is refreshed, we empty the collection list and
        // add each child separately
        refreshItems: function(collectionInstance) {
            var collectionView = this;
            jQuery(this.el).empty();
            collectionInstance.forEach(function(itemInstance) {
                collectionView.addItem(itemInstance, collectionInstance);
            });
        },

        // When adding new items we create a new element of the child type
        // and append it to the list.
        addItem: function(itemInstance, collection) {
            if (collection !== this.collection) {
                return;
            }
            if (!this.elementTemplate ||
                this.elementTemplate.length === 0) {
                return;
            }
            var itemView = VIE.RDFaEntities._registerView(itemInstance, VIE.RDFa._cloneElement(this.elementTemplate), true);
            var itemViewElement = itemView.render().el;
            if (itemInstance.id &&
                typeof itemInstance.id === 'string') {
                VIE.RDFa.setSubject(itemViewElement, itemInstance.id);
            } else {
                itemInstance.id = itemViewElement.get(0);
            }
                    
            // Figure out where to place the element based on its order
            var itemOrder = this.collection.indexOf(itemInstance);
            var childElements = jQuery(this.el).children();
            if (childElements.length === 0 ||
                itemOrder > childElements.length - 1)
            {
                jQuery(this.el).append(itemViewElement);
            } else {
                jQuery(this.el).children().each(function(index, element) {
                    if (index >= itemOrder) {
                        jQuery(element).before(itemViewElement);
                        placed = true;
                        return false;
                    }
                });
            }

            this.trigger('add', itemView);
            itemViewElement.show();
            
            // If the new instance doesn't yet have an identifier, bind it to
            // the HTML representation of itself. This safeguards from duplicates.
            if (!itemInstance.id) {
                itemInstance.id = VIE.RDFa.getSubject(itemViewElement);
            }
            
            // Ensure we catch all inferred predicates. We add these via JSONLD
            // so the references get properly Collectionized.
            jQuery(itemViewElement).parent('[rev]').each(function() {
                var properties = {
                    '@': itemInstance.id
                };
                var predicate = jQuery(this).attr('rev');
                properties[predicate] = VIE.RDFa.getSubject(this);
                VIE.EntityManager.getByJSONLD(properties);
            });
        },

        // When removing items from Collection we remove their views from the DOM.
        removeItem: function(itemInstance) {
            // Try to find it from DOM
            jQuery(VIE.RDFa.subjectSelector, this.el).filter(function() {
                if (VIE.RDFa.getSubject(this) === VIE.RDFa._toReference(itemInstance.id)) {
                    return true;
                }
            }).each(function() {
                jQuery(this).remove();
            });
            return;
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
        predicateSelector: '[property],[rel]',

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
            
            if (typeof subject === 'object') {
                return subject;
            }

            return VIE.RDFa._toReference(subject);
        },
        
        // Set subject for an element
        setSubject: function(element, subject) {
            if (jQuery(element).attr('src')) {
                return jQuery(element).attr('src', subject);
            }
            jQuery(element).attr('about', subject);
        },
        
        // Get predicate for an element
        getPredicate: function(element) {
            var propertyName;

            element = jQuery(element);
            
            propertyName = element.attr('property');
            if (!propertyName) {
                propertyName = element.attr('rel');
            }
            return propertyName;
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

            entity['@'] = subject;

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
                    jsonld[propertyName] = propertyName;
                }

                // Before writing to DOM we check that the value has actually changed.
                if (VIE.RDFa._readPropertyValue(propertyName, propertyElement) !== jsonld[propertyName]) {
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
            if (typeof subject === 'string' &&
                !VIE.RDFa._isReference(subject)) {
                subject = VIE.RDFa._toReference(subject);
            }
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

        // Figure out if a given value is a wrapped reference
        _isReference: function(value) {
            var matcher = new RegExp("^\\<([^\\>]*)\\>$");
            if (matcher.exec(value)) {
                return true;
            }
            return false;
        },

        // In JSON-LD all references are surrounded by `<` and `>`. Convert a regular
        // textual value to this format.
        _toReference: function(value) {
            return '<' + value + '>';
        },
        
        // In JSON-LD all references are surrounded by `<` and `>`. Convert reference
        // to a regular textual value.
        _fromReference: function(reference) {
            if (_.isArray(reference)) {
                return _.map(reference, function(ref) {
                    return VIE.RDFa._fromReference(ref);
                });
            }
            return reference.substring(1, reference.length - 1);
        },

        // Get value of a DOM element defining a RDFa predicate.
        _readPropertyValue: function(propertyName, element) {

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
            if (href &&
                element.attr('rel') === propertyName) {
                return VIE.RDFa._toReference(href);
            }

            // If the predicate is a relation, we look for identified child objects
            // and provide their identifiers as the values. To protect from scope
            // creep, we only support direct descentants of the element where the
            // `rel` attribute was set.
            if (element.attr('rel')) {
                var value = [];
                jQuery(element).children(VIE.RDFa.subjectSelector).each(function() {
                    value.push(VIE.RDFa.getSubject(this));
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
            if (value instanceof Array ||
                element.attr('rel')) {
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
        
        // Get elements matching a given subject and predicate
        _getElementByPredicate: function(predicate, element) {
            var subject = VIE.RDFa.getSubject(element);
            return jQuery(element).find(VIE.RDFa.predicateSelector).add(jQuery(element).filter(VIE.RDFa.predicateSelector)).filter(function() {
                if (VIE.RDFa.getPredicate(this) !== predicate) {
                    return false;
                }

                if (VIE.RDFa.getSubject(this) !== subject) {
                    return false;
                }
 
                return true;
            });
        },

        // Get JSON-LD properties from a DOM element.
        _getElementProperties: function(subject, element, emptyValues) {
            var containerProperties = {};

            VIE.RDFa.findPredicateElements(subject, element, true).each(function() {
                var propertyName;
                var propertyValue;
                var objectProperty = jQuery(this);
                propertyName = VIE.RDFa.getPredicate(this); 
                
                propertyValue = VIE.RDFa._readPropertyValue(propertyName, objectProperty);
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

            if (jQuery(element).get(0).tagName !== 'HTML') {
                jQuery(element).parent('[rev]').each(function() {
                    containerProperties[jQuery(this).attr('rev')] = VIE.RDFa.getSubject(this); 
                });
            }

            return containerProperties;
        },
        
        // Create an anonymized clone of an element
        _cloneElement: function(element) {
            element = jQuery(element).clone(false);

            if (typeof element.attr('about') !== 'undefined')
            {
                // Direct match with container
                element.attr('about', '');
            }
            element.find('[about]').attr('about', '');
            var subject = VIE.RDFa.getSubject(element);
            VIE.RDFa.findPredicateElements(subject, element, false).each(function() {
                VIE.RDFa._writePropertyValue(jQuery(this), '');
            });

            return element;
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
