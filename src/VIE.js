var VIE;
VIE = function(config) {
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
  _(this.services).each(function(service, i){res.push(service);});
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


if(typeof exports === 'object') {
    // Running under Node.js or other CommonJS environment
    exports.VIE = VIE;
    var jQuery = require('jquery');
    var Backbone = require('backbone');
    var _ = require('underscore')._;
}
