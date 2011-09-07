Zart.prototype.Savable = function(options){
    this.init(options);

    // Running the actual method
    this.execute = function () {
        // call service.load
        var savable = this;
        _(this.services).each(function(service){
            service.save(savable);
        });
        return this;
    }
}
Zart.prototype.Savable.prototype = new Zart.prototype.Able();
