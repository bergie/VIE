Zart = function(config) {
  this.config = config;
  this.services = {};
  this.entities = new this.Collection();
}
Zart.prototype.use = function(service, name) {
  if (!name) {
    name = service.name;
  }
  return this.services[name] = service;
};
Zart.prototype.service = function(name) {
  return this.services[name];
};
Zart.prototype.load = function(options) {
  return new Zart.Loadable(options);
};
Zart.prototype.save = function(options) {
  return new Zart.Savable(options);
};
Zart.prototype.remove = function(options) {
  return new Zart.Removable(options);
};
Zart.prototype.annotate = function(options) {
  return new Zart.Annotatable(options);
};
