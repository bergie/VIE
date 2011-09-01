var Zart;
Zart = function(config) {
  this.config = (config)? config : {};
  this.services = {};
  this.entities = new this.Collection();

  this.Entity.prototype['entities'] = this.entities;
  this.Entity.prototype['entityCollection'] = this.Collection;

  this.defaultNamespace = (this.config.defaultNamespace)? this.config.defaultNamespace : "http://schema.org/";
  this.defaultProxyUrl = (this.config.defaultProxyUrl)? this.config.defaultProxyUrl : "../utils/proxy/proxy.php";
  this.types = new this.Types({zart: this});
  this.namespaces = new this.Namespaces({"default" : this.defaultNamespace});
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
