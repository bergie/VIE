
Zart.prototype.Annotatable = function(options){
    jQuery.Deferred.apply(this);
    this.options = options;
    this.services = options.from || options.using || [];
    this.zart = options.zart;

    // Synonyms
    this.success = this.done;

    this.using = function(service) {
        var serviceObj = typeof service === "string" ? this.zart.service(service) : service;
        this.services.push(serviceObj);
        return this;
    };

    // Running the actual method
    this.execute = function () {
        // call service.load
        var annotatable = this;
        _(this.services).each(function(service){
            service.annotate(annotatable);
        });
        return this;
    }
}
Zart.prototype.Annotatable.prototype = new jQuery.Deferred();
