// ### Handle dependencies
//
// Zart tries to load its dependencies automatically. 
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
    throw 'Zart requires underscore.js to be available';
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
    throw 'Zart requires Backbone.js to be available';
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
    throw 'Zart requires jQuery to be available';
}

var Zart;
Zart = function(config){
    this.config = (config) ? config : {};
    this.services = {};
    this.entities = new this.Collection();

    this.Entity.prototype.entities = this.entities;
    this.Entity.prototype.entityCollection = this.Collection;

    this.defaultProxyUrl = (this.config.defaultProxyUrl) ? this.config.defaultProxyUrl : "../utils/proxy/proxy.php";
    this.types = new this.Types({
        zart: this
    });
    this.namespaces = new this.Namespaces({
        "default": (this.config.defaultNamespace) ? this.config.defaultNamespace : "http://schema.org/"
    });
};

Zart.prototype.use = function(service, name) {
  if (!name) {
    name = service.name;
  }
  service.zart = this;
  service.name = name;
  if (service.init) {
      service.init();
  }
  this.services[name] = service;
};

Zart.prototype.service = function(name) {
  if (!this.services[name]) {
    throw "Undefined service " + name;
  }
  return this.services[name];
};

Zart.prototype.getServicesArray = function() {
  var res = [];
  _(this.services).each(function(service, i){res.push(service);});
  return res;
};

Zart.prototype.Able = Able;

// Declaring the ..able classes
// Loadable
Zart.prototype.load = function(options) {
  if (!options) { options = {}; }
  options.zart = this;
  return new this.Loadable(options);
};

Zart.prototype.Loadable = function (options) {
    this.init(options,"load");
};

Zart.prototype.Loadable.prototype = new Zart.prototype.Able();

// Savable
Zart.prototype.save = function(options) {
  if (!options) { options = {}; }
  options.zart = this;
  return new this.Savable(options);
};

Zart.prototype.Savable = function(options){
    this.init(options, "save");
};

Zart.prototype.Savable.prototype = new Zart.prototype.Able();

// Removable
Zart.prototype.remove = function(options) {
  if (!options) { options = {}; }
  options.zart = this;
  return new this.Removable(options);
};

Zart.prototype.Removable = function(options){
    this.init(options, "remove");
};

Zart.prototype.Removable.prototype = new Zart.prototype.Able();

// Analyzable
Zart.prototype.analyze = function(options) {
  if (!options) { options = {}; }
  options.zart = this;
  return new this.Analyzable(options);
};

Zart.prototype.Analyzable = function (options) {
    this.init(options, "analyze");
};

Zart.prototype.Analyzable.prototype = new Zart.prototype.Able();

// Findable
Zart.prototype.find = function(options) {
  if (!options) { options = {}; }
  options.zart = this;
  return new this.Findable(options);
};

Zart.prototype.Findable = function (options) {
    this.init(options, "find");
};

Zart.prototype.Findable.prototype = new Zart.prototype.Able();

