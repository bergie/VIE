Zart.prototype.Collection = Backbone.Collection.extend({
    model: Zart.prototype.Entity,

    _prepareModel: function(model, options) {
        if (model['@subject']) {
            model['id'] = model['@subject'];
        }
        if (!model['@type']) {
            model['@type'] = 'Thing';
        }
        return Backbone.Collection.prototype._prepareModel.call(this, model, options);
    }
});
