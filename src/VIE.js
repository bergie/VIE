//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     (c) 2011 Sebastian Germesin, IKS Consortium
//     (c) 2011 Szaby Grünwald, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://viejs.org/

/*global console:false exports:false require:false */

var root = this,
    jQuery = root.jQuery,
    Backbone = root.Backbone,
    _ = root._;


// ## VIE constructor
//
// The VIE constructor is the way to initialize VIE for your
// application. The instance of VIE handles all management of
// semantic interaction, including keeping track of entities,
// changes to them, the possible RDFa views on the page where
// the entities are displayed, and connections to external
// services like Stanbol and DBPedia.
//
// To get a VIE instance, simply run:
//
//     var vie = new VIE();
//
// You can also pass configurations to the VIE instance through
// the constructor. For example, to set a different default
// namespace to be used for names that don't have a namespace
// specified, do:
//
//     var vie = new VIE({
//         baseNamespace: 'http://example.net'
//     });
//
// ### Differences with VIE 1.x
//
// VIE 1.x used singletons for managing entities and views loaded
// from a page. This has been changed with VIE 2.x, and now all
// data managed by VIE is tied to the instance of VIE being used.
//
// This means that VIE needs to be instantiated before using. So,
// when previously you could get entities from page with:
//
//     VIE.RDFaEntities.getInstances();
//
// Now you need to instantiate VIE first. This example uses the
// Classic API compatibility layer instead of the `load` method:
//
//     var vie = new VIE();
//     vie.RDFaEntities.getInstances();
//
// Currently the Classic API is enabled by default, but it is
// recommended to ensure it is enabled before using it. So:
//
//     var vie = new VIE({classic: true});
//     vie.RDFaEntities.getInstances();
var VIE = root.VIE = function(config) {
    this.config = (config) ? config : {};
    this.services = {};
    this.jQuery = jQuery;
    this.entities = new this.Collection([], {
        vie: this
    });

    this.Entity.prototype.entities = this.entities;
    this.Entity.prototype.entityCollection = this.Collection;
    this.Entity.prototype.vie = this;

    this.Namespaces.prototype.vie = this;
// ### Namespaces in VIE
// VIE supports different ontologies and an easy use of them.
// Namespace prefixes reduce the amount of code you have to
// write. In VIE, it does not matter if you access an entitie's
// property with
// `entity.get('<http://dbpedia.org/property/capitalOf>')` or
// `entity.get('dbprop:capitalOf')` or even
// `entity.get('capitalOf')` once the corresponding namespace
// is registered as *baseNamespace*.
// By default `"http://viejs.org/ns/"`is set as base namespace.
// For more information about how to set, get and list all
// registered namespaces, refer to the
// <a href="Namespace.html">Namespaces documentation</a>.
    this.namespaces = new this.Namespaces(
        (this.config.baseNamespace) ? this.config.baseNamespace : "http://viejs.org/ns/",

// By default, VIE is shipped with common namespace prefixes:

// +    owl    : "http://www.w3.org/2002/07/owl#"
// +    rdfs   : "http://www.w3.org/2000/01/rdf-schema#"
// +    rdf    : "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
// +    schema : 'http://schema.org/'
// +    foaf   : 'http://xmlns.com/foaf/0.1/'
// +    geo    : 'http://www.w3.org/2003/01/geo/wgs84_pos#'
// +    dbpedia: "http://dbpedia.org/ontology/"
// +    dbprop : "http://dbpedia.org/property/"
// +    skos   : "http://www.w3.org/2004/02/skos/core#"
// +    xsd    : "http://www.w3.org/2001/XMLSchema#"
// +    sioc   : "http://rdfs.org/sioc/ns#"
// +    dcterms: "http://purl.org/dc/terms/"
        {
            owl    : "http://www.w3.org/2002/07/owl#",
            rdfs   : "http://www.w3.org/2000/01/rdf-schema#",
            rdf    : "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            schema : 'http://schema.org/',
            foaf   : 'http://xmlns.com/foaf/0.1/',
            geo    : 'http://www.w3.org/2003/01/geo/wgs84_pos#',
            dbpedia: "http://dbpedia.org/ontology/",
            dbprop : "http://dbpedia.org/property/",
            skos   : "http://www.w3.org/2004/02/skos/core#",
            xsd    : "http://www.w3.org/2001/XMLSchema#",
            sioc   : "http://rdfs.org/sioc/ns#",
            dcterms: "http://purl.org/dc/terms/"
        }
    );


    this.Type.prototype.vie = this;
    this.Types.prototype.vie = this;
    this.Attribute.prototype.vie = this;
    this.Attributes.prototype.vie = this;
// ### Type hierarchy in VIE
// VIE takes care about type hierarchy of entities
// (aka. *schema* or *ontology*).
// Once a type hierarchy is known to VIE, we can leverage
// this information, to easily ask, whether an entity
// is of type, e.g., *foaf:Person* or *schema:Place*.
// For more information about how to generate such a type
// hierarchy, refer to the
// <a href="Type.html">Types documentation</a>.
    this.types = new this.Types();
// By default, there is a parent type in VIE, called
// *owl:Thing*. All types automatically inherit from this
// type and all registered entities, are of this type.
    this.types.add("owl:Thing");

// As described above, the Classic API of VIE 1.x is loaded
// by default. As this might change in the future, it is
// recommended to ensure it is enabled before using it. So:
//
//     var vie = new VIE({classic: true});
//     vie.RDFaEntities.getInstances();
    if (this.config.classic === true) {
        /* Load Classic API as well */
        this.RDFa = new this.ClassicRDFa(this);
        this.RDFaEntities = new this.ClassicRDFaEntities(this);
        this.EntityManager = new this.ClassicEntityManager(this);

        this.cleanup = function() {
            this.entities.reset();
        };
    }
};

// ### use(service, name)
// This method registers services within VIE.
// **Parameters**:
// *{string|object}* **service** The service to be registered.
// *{string}* **name** An optional name to register the service with. If this
// is not set, the default name that comes with the service is taken.
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE}* : The current VIE instance.
// **Example usage**:
//
//     var vie = new VIE();
//     var conf1 = {...};
//     var conf2 = {...};
//     vie.use(new vie.StanbolService());
//     vie.use(new vie.StanbolService(conf1), "stanbol_1");
//     vie.use(new vie.StanbolService(conf2), "stanbol_2");
//     // <-- this means that there are now 3 services registered!
VIE.prototype.use = function(service, name) {
  if (!name && !service.name) {
    throw new Error("Please provide a name for the service!");
  }
  service.vie = this;
  service.name = (name)? name : service.name;
  if (service.init) {
      service.init();
  }
  this.services[service.name] = service;

  return this;
};

// ### service(name)
// This method returns the service object that is
// registered under the given name.
// **Parameters**:
// *{string}* **name** ...
// **Throws**:
// *{Error}* if no service could be found.
// **Returns**:
// *{object}* : The service to be queried.
// **Example usage**:
//
//     var vie = new VIE();
//     vie.use(new vie.StanbolService(), "stanbol");
//     var service = vie.service("stanbol");
VIE.prototype.service = function(name) {
  if (!this.hasService(name)) {
    throw "Undefined service " + name;
  }
  return this.services[name];
};

// ### hasService(name)
// This method returns a boolean telling whether VIE has a particular
// service loaded.
// **Parameters**:
// *{string}* **name**
// **Returns**:
// *{boolean}* whether service is available
VIE.prototype.hasService = function(name) {
  if (!this.services[name]) {
    return false;
  }
  return true;
};

// ### getServicesArray()
// This method returns an array of all registered services.
// **Parameters**:
// *nothing*
// **Throws**:
// *nothing*
// **Returns**:
// *{array}* : An array of service instances.
// **Example usage**:
//
//     var vie = new VIE();
//     vie.use(new vie.StanbolService(), "stanbol");
//     var services = vie.getServicesArray();
//     services.length; // <-- 1
VIE.prototype.getServicesArray = function() {
  return _.map(this.services, function (v) {return v;});
};

// ### load(options)
// This method instantiates a new VIE.Loadable in order to
// perform queries on the services.
// **Parameters**:
// *{object}* **options** Options to be set.
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.Loadable}* : A new instance of VIE.Loadable.
// **Example usage**:
//
//     var vie = new VIE();
//     vie.use(new vie.StanbolService(), "stanbol");
//     var loader = vie.load({...});
VIE.prototype.load = function(options) {
  if (!options) { options = {}; }
  options.vie = this;
  return new this.Loadable(options);
};

// ### save(options)
// This method instantiates a new VIE.Savable in order to
// perform queries on the services.
// **Parameters**:
// *{object}* **options** Options to be set.
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.Savable}* : A new instance of VIE.Savable.
// **Example usage**:
//
//     var vie = new VIE();
//     vie.use(new vie.StanbolService(), "stanbol");
//     var saver = vie.save({...});
VIE.prototype.save = function(options) {
  if (!options) { options = {}; }
  options.vie = this;
  return new this.Savable(options);
};

// ### remove(options)
// This method instantiates a new VIE.Removable in order to
// perform queries on the services.
// **Parameters**:
// *{object}* **options** Options to be set.
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.Removable}* : A new instance of VIE.Removable.
// **Example usage**:
//
//     var vie = new VIE();
//     vie.use(new vie.StanbolService(), "stanbol");
//     var remover = vie.remove({...});
VIE.prototype.remove = function(options) {
  if (!options) { options = {}; }
  options.vie = this;
  return new this.Removable(options);
};

// ### analyze(options)
// This method instantiates a new VIE.Analyzable in order to
// perform queries on the services.
// **Parameters**:
// *{object}* **options** Options to be set.
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.Analyzable}* : A new instance of VIE.Analyzable.
// **Example usage**:
//
//     var vie = new VIE();
//     vie.use(new vie.StanbolService(), "stanbol");
//     var analyzer = vie.analyze({...});
VIE.prototype.analyze = function(options) {
  if (!options) { options = {}; }
  options.vie = this;
  return new this.Analyzable(options);
};

// ### find(options)
// This method instantiates a new VIE.Findable in order to
// perform queries on the services.
// **Parameters**:
// *{object}* **options** Options to be set.
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.Findable}* : A new instance of VIE.Findable.
// **Example usage**:
//
//     var vie = new VIE();
//     vie.use(new vie.StanbolService(), "stanbol");
//     var finder = vie.find({...});
VIE.prototype.find = function(options) {
  if (!options) { options = {}; }
  options.vie = this;
  return new this.Findable(options);
};

// ### loadSchema(url, options)
// VIE only knows the *owl:Thing* type by default.
// You can use this method to import another
// schema (ontology) from an external resource.
// (Currently, this supports only the JSON format!!)
// As this method works asynchronously, you might want
// to register `success` and `error` callbacks via the
// options.
// **Parameters**:
// *{string}* **url** The url, pointing to the schema to import.
// *{object}* **options** Options to be set.
// (Set ```success``` and ```error``` as callbacks.).
// **Throws**:
// *{Error}* if the url is not set.
// **Returns**:
// *{VIE}* : The VIE instance itself.
// **Example usage**:
//
//     var vie = new VIE();
//     vie.loadSchema("http://schema.rdfs.org/all.json",
//        {
//          baseNS : "http://schema.org/",
//          success : function () {console.log("success");},
//          error  : function (msg) {console.warn(msg);}
//        });
VIE.prototype.loadSchema = function(url, options) {
    options = (!options)? {} : options;

    if (!url) {
        throw new Error("Please provide a proper URL");
    }
    else {
        var vie = this;
        jQuery.getJSON(url)
        .success(function(data) {
            try {
                VIE.Util.loadSchemaOrg(vie, data, options.baseNS);
                if (options.success) {
                    options.success.call(vie);
                }
            } catch (e) {
                options.error.call(vie, e);
                return;
            }
         })
        .error(function(data, textStatus, jqXHR) {
            if (options.error) {
                // console.warn(data, textStatus, jqXHR);
                options.error.call(vie, "Could not load schema from URL (" + url + "): " + textStatus);
            }
         });
    }

    return this;
};

// ### getTypedEntityClass(type)
// This method generates a special type of `Entity` based on the given type.
// **Parameters**:
// *{string}* **type** The type.
// **Throws**:
// *{Error}* if the type is unknown to VIE.
// **Returns**:
// *{VIE.Entity}* : A subclass of `VIE.Entity`.
// **Example usage**:
//
//     var vie = new VIE();
//     vie.types.add("Person");
//     var PersonClass = vie.getTypedEntityClass("Person");
//     var Person = new PersonClass({"name", "Sebastian"});
VIE.prototype.getTypedEntityClass = function (type) {
  var typeType = this.types.get(type);
  if (!typeType) {
    throw new Error("Unknown type " + type);
  }
  if (!this.typeEntityClasses[type.id]) {
    this.typeEntityClasses[type.id] = this.Entity.extend({
      defaults: {
        '@type': type
      }
    });
  }
  return this.typeEntityClasses[type.id];
};
VIE.prototype.typeEntityClasses = {};

// ## Running VIE on Node.js
//
// When VIE is running under Node.js we can use the CommonJS
// require interface to load our dependencies automatically.
//
// This means Node.js users don't need to care about dependencies
// and can just run VIE with:
//
//     var VIE = require('vie');
//
// In browser environments the dependencies have to be included
// before including VIE itself.
if (typeof exports === 'object') {
    exports.VIE = VIE;

    if (!jQuery) {
        jQuery = require('jquery');
    }
    if (!Backbone) {
        Backbone = require('backbone');
        Backbone.$ = jQuery;
    }
    if (!_) {
        _ = require('underscore')._;
    }
}
