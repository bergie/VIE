
Zart.prototype.Loadable = function(options){
    this.options = options;
    this.from = [];
    this.zart = options.zart;
    console.log('jquery:', jQuery);
    console.log('jquery.Deferred:', jQuery.Deferred());
    this.deferred = jQuery.Deferred();
    this.success = this.deferred.success;
};

Zart.prototype.Loadable.prototype = {
    from: function(service) {
        // TODO
        this.from.append(service);
    }
}

