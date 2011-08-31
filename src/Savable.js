
Zart.prototype.Savable = function(options){
    this.options = options;
    this.from = [];
    this.zart = options.zart;
    this.deferred = jQuery.Deferred();
    this.success = this.deferred.success;
    this.to = this.using = function(service) {
        // TODO
        this.from.append(service);
    }
}

