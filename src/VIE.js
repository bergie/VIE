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

var VIE;
VIE = function(config){
    this.config = (config) ? config : {};
    this.services = {};
    this.entities = new this.Collection();

    this.Entity.prototype.entities = this.entities;
    this.entities.vie = this;
    this.Entity.prototype.entityCollection = this.Collection;
    this.Entity.prototype.vie = this;

    this.defaultProxyUrl = (this.config.defaultProxyUrl) ? this.config.defaultProxyUrl : "../utils/proxy/proxy.php";
    this.types = new this.Types({
        vie: this
    });
    this.namespaces = new this.Namespaces({
        "default": (this.config.defaultNamespace) ? this.config.defaultNamespace : "http://vie.js/"
    });
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

VIE.prototype.Able = Able;

// Declaring the ..able classes
// Loadable
VIE.prototype.load = function(options) {
  if (!options) { options = {}; }
  options.vie = this;
  return new this.Loadable(options);
};

VIE.prototype.Loadable = function (options) {
    this.init(options,"load");
};

VIE.prototype.Loadable.prototype = new VIE.prototype.Able();

// Savable
VIE.prototype.save = function(options) {
  if (!options) { options = {}; }
  options.vie = this;
  return new this.Savable(options);
};

VIE.prototype.Savable = function(options){
    this.init(options, "save");
};

VIE.prototype.Savable.prototype = new VIE.prototype.Able();

// Removable
VIE.prototype.remove = function(options) {
  if (!options) { options = {}; }
  options.vie = this;
  return new this.Removable(options);
};

VIE.prototype.Removable = function(options){
    this.init(options, "remove");
};

VIE.prototype.Removable.prototype = new VIE.prototype.Able();

// Analyzable
VIE.prototype.analyze = function(options) {
  if (!options) { options = {}; }
  options.vie = this;
  return new this.Analyzable(options);
};

VIE.prototype.Analyzable = function (options) {
    this.init(options, "analyze");
};

VIE.prototype.Analyzable.prototype = new VIE.prototype.Able();

// Findable
VIE.prototype.find = function(options) {
  if (!options) { options = {}; }
  options.vie = this;
  return new this.Findable(options);
};

VIE.prototype.Findable = function (options) {
    this.init(options, "find");
};

VIE.prototype.Findable.prototype = new VIE.prototype.Able();

if(typeof(exports) !== 'undefined' && exports !== null) {
    exports.VIE = VIE;
}
