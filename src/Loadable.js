
Zart.prototype.Loadable = function (options) {
    var deferred = jQuery.Deferred();
    this.options = options;
    this.services = options.from || options.using || [];
    this.zart = options.zart;

    // Public deferred-methods
    this.resolve = deferred.resolve;
    this.resolveWith = deferred.resolveWith;
    this.reject = deferred.reject;
    this.rejectWith = deferred.rejectWith;

    // Synonyms
    this.success = this.done = deferred.done;
    this.fail = deferred.fail;
    this.then = deferred.then; // Takes 2 arguments, successCallbacks, failCallbacks
    this.always = deferred.always;

    this.from = this.using = function(service) {
        var serviceObj = typeof service === "string" ? this.zart.service(service) : service;
        this.services.push(serviceObj);
        return this;
    };

    // Running the actual method
    this.execute = function () {
        // call service.load
        var loadable = this;
        _(this.services).each(function(service){
            service.load(loadable);
        });
        return this;
    }
}
