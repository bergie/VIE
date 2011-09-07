
Zart.prototype.Analyzable = function (options) {
    this.init(options);

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
Zart.prototype.Analyzable.prototype = new Zart.prototype.Able();
