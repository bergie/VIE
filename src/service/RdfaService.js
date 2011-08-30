Zart.prototype.RdfaService = function() {
    this.zart = null;
    this.name = 'rdfa';
};

Zart.prototype.RdfaService.prototype.load = function(loadable) {
    var correct = loadable instanceof this.zart.Loadable;
    if (!correct) {
        throw "Invalid Loadable passed";
    }
};
