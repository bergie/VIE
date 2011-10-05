
VIE.prototype.Able = function(){
};
    // takes a list of services or just one
VIE.prototype.Able.prototype = {
    using: function(services) {
        var service = this;
        if ( services instanceof Array ) {
            _(services).each(function(s){
                service._using(s);
            });
        } else {
            var s = services;
            service._using(s);
        }
        return this;
    },
    _using: function(service) {
        var serviceObj = typeof service === "string" ? this.vie.service(service) : service;
        this.services.push(serviceObj);
        return this;
    },
    init: function(options, methodName) {
        this.methodName = methodName;
        this.options = options;
        this.services = options.from || options.using || options.to || [];
        this.vie = options.vie;
        this.deferred = jQuery.Deferred();

        // Public deferred-methods
        this.resolve = this.deferred.resolve;
        this.resolveWith = this.deferred.resolveWith;
        this.reject = this.deferred.reject;
        this.rejectWith = this.deferred.rejectWith;

        // Synonyms
        this.success = this.done = this.deferred.done;
        this.fail = this.deferred.fail;
        this.then = this.deferred.then; // Takes 2 arguments, successCallbacks, failCallbacks
        this.always = this.deferred.always;
        this.from = this.using;
        this.to = this.using;
    },
    // Running the actual method
    execute: function() {
        // call service.load
        var able = this;
        _(this.services).each(function(service){
            service[able.methodName](able);
        });
        return this;
    }
};

VIE.prototype.Loadable = function (options) {
    this.init(options,"load");
};
VIE.prototype.Loadable.prototype = new VIE.prototype.Able();

VIE.prototype.Savable = function(options){
    this.init(options, "save");
};
VIE.prototype.Savable.prototype = new VIE.prototype.Able();

VIE.prototype.Removable = function(options){
    this.init(options, "remove");
};
VIE.prototype.Removable.prototype = new VIE.prototype.Able();

VIE.prototype.Analyzable = function (options) {
    this.init(options, "analyze");
};
VIE.prototype.Analyzable.prototype = new VIE.prototype.Able();

VIE.prototype.Findable = function (options) {
    this.init(options, "find");
};

VIE.prototype.Findable.prototype = new VIE.prototype.Able();

