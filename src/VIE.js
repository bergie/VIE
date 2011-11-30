//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://bergie.github.com/VIE/ 
var root = this,
    jQuery = root.jQuery,
    Backbone = root.Backbone,
    _ = root._;

var VIE = root.VIE = function(config) {
    this.config = (config) ? config : {};
    this.services = {};
    this.entities = new this.Collection();

    this.Entity.prototype.entities = this.entities;
    this.entities.vie = this;
    this.Entity.prototype.entityCollection = this.Collection;
    this.Entity.prototype.vie = this;

    this.defaultProxyUrl = (this.config.defaultProxyUrl) ? this.config.defaultProxyUrl : "../utils/proxy/proxy.php";
    
    this.Namespaces.prototype.vie = this;
    this.namespaces = new this.Namespaces(
        (this.config.defaultNamespace) ? this.config.defaultNamespace : "http://ontology.vie.js/"
    );
    
    this.Type.prototype.vie = this;
    this.Types.prototype.vie = this;
    this.Attribute.prototype.vie = this;
    this.Attributes.prototype.vie = this;
    this.types = new this.Types();
    this.types.add("Thing");

    if (this.config.classic !== false) {
        // Load Classic API as well
        this.RDFa = new this.ClassicRDFa(this);
        this.RDFaEntities = new this.ClassicRDFaEntities(this);
        this.EntityManager = new this.ClassicEntityManager(this);

        this.cleanup = function() {
            this.entities.reset();
        };
    }
};

VIE.prototype.use = function(service, name) {
  if (!name) {
    name = service.name;
  }
  service.vie = this;
  service.name = name;
  if (service.init) {
      service.init();
  }
  this.services[name] = service;
};

VIE.prototype.service = function(name) {
  if (!this.services[name]) {
    throw "Undefined service " + name;
  }
  return this.services[name];
};

VIE.prototype.getServicesArray = function() {
  var res = [];
  _.each(this.services, function(service, i){res.push(service);});
  return res;
};

// Declaring the ..able classes
// Loadable
VIE.prototype.load = function(options) {
  if (!options) { options = {}; }
  options.vie = this;
  return new this.Loadable(options);
};



// Savable
VIE.prototype.save = function(options) {
  if (!options) { options = {}; }
  options.vie = this;
  return new this.Savable(options);
};


// Removable
VIE.prototype.remove = function(options) {
  if (!options) { options = {}; }
  options.vie = this;
  return new this.Removable(options);
};


// Analyzable
VIE.prototype.analyze = function(options) {
  if (!options) { options = {}; }
  options.vie = this;
  return new this.Analyzable(options);
};


// Findable
VIE.prototype.find = function(options) {
  if (!options) { options = {}; }
  options.vie = this;
  return new this.Findable(options);
};

// bootstrap VIE with a type and attribute ontology/schema
VIE.prototype.loadSchema = function(id) {
    if (!id) {
        //TODO: load default schema
    } else {
        //TODO: try to load the given schema if available
    }
};

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
if(typeof exports === 'object') {
    exports.VIE = VIE;

    if (!jQuery) {
        jQuery = require('jquery');
    }
    if (!Backbone) {
        Backbone = require('backbone');
    }
    if (!_) {
        _ = require('underscore')._;
    }
}
