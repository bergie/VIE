Zart.prototype.Removable = function(options){
    this.init(options);

    // Running the actual method
    this.execute = function () {
        // call service.load
        var removable = this;
        _(this.services).each(function(service){
            service.remove(removable);
        });
        return this;
    }
}
Zart.prototype.Removable.prototype = new Zart.prototype.Able();

