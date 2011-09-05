
Zart.prototype.Analyzable = function (options) {
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
    var service = this;
    // takes a list of services or just one
    this.using = function(services) {
        if ( services instanceof Array ) {
            _(services).each(function(s){
                service._using(s);
            });
        } else {
            var s = services;
            service._using(s);
        }
        return this;
    };
    this._using = function(service) {
        var serviceObj = typeof service === "string" ? this.zart.service(service) : service;
        this.services.push(serviceObj);
        return this;
    };

    // Running the actual method
    this.execute = function () {
        // call service.load
        var analyzable = this;
        _(this.services || zart.services).each(function(service){
            service.analyze(analyzable);
        });
        return this;
    }
}
