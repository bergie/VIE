
Zart.prototype.Loadable = function (options) {
    this.init(options);

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
Zart.prototype.Loadable.prototype = new Zart.prototype.Able();

