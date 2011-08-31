
Zart.prototype.Loadable = function (options) {
    jQuery.Deferred.apply(this);
    this.options = options;
    this.services = options.from || options.using || [];
    this.zart = options.zart;

    // Synonyms
    this.success = this.done;

    this.from = this.using = function(service) {
        var serviceObj = typeof service === "string" ? this.zart.service(service) : service;
        this.services.push(serviceObj);
        return this;
    }
    this.execute = function () {
        // call service.load
        var loadable = this;
        _(this.services).each(function(service){
            service.load(loadable);
        });
        return this;
    }
}
Zart.prototype.Loadable.prototype = new jQuery.Deferred();
