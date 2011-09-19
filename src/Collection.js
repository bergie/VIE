Zart.prototype.Collection = Backbone.Collection.extend({
    model: Zart.prototype.Entity,

    addOrUpdate: function(model) {
        var collection = this;
        if (_.isArray(model)) {
            var entities = [];
            _.each(model, function(item) {
                entities.push(collection.addOrUpdate(item));
            });
            return entities;
        }

        if (!model.isEntity) {
            model = new this.model(model);
        }

        if (!model.id) {
            this.add(model);
            return model;
        }

        if (this.get(model.id)) {
            var existing = this.get(model.id);
            if (model.attributes) {
                return existing.set(model.attributes);
            }
            return existing.set(model);
        }
        this.add(model);
        return model;
    }
});
