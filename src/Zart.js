var Zart;
Zart = function(config) {
  this.config = config;
  this.services = {};
  this.entities = new this.Collection();
  this.defaultNamespace = "http://schema.org/";
  this.types = new this.Types({zart: this});
}
Zart.prototype.use = function(service, name) {
  if (!name) {
    name = service.name;
  }
  service.zart = this;
  service.name = name;
  return this.services[name] = service;
};
Zart.prototype.service = function(name) {
  if (!this.services[name]) {
    throw "Undefined service " + name;
  }
  return this.services[name];
};
Zart.prototype.load = function(options) {
  if (!options) { options = {}; }
  options.zart = this;
  return new this.Loadable(options);
};
Zart.prototype.save = function(options) {
  if (!options) { options = {}; }
  options.zart = this;
  return new this.Savable(options);
};
Zart.prototype.remove = function(options) {
  if (!options) { options = {}; }
  options.zart = this;
  return new this.Removable(options);
};
Zart.prototype.annotate = function(options) {
  if (!options) { options = {}; }
  options.zart = this;
  return new this.Annotatable(options);
};
