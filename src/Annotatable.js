
Zart.prototype.Annotatable = function(options){
    this.options = options;
    this.from = [];
    this.zart = options.zart;
    this.deferred = jQuery.Deferred();

    this.success = this.deferred.success;
    this.using = function(service) {
        // TODO
    }
}

