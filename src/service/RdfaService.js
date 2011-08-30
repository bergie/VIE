Zart.prototype.RdfaService = function() {
    this.zart = null;
    this.name = 'rdfa';
};

Zart.prototype.RdfaService.prototype.load = function(loadable) {
    if (!loadable instanceof this.zart.Loadable) {
        throw "Invalid Loadable passed";
    }
};
