Zart.prototype.Collection = Backbone.Collection.extend({
    model: Zart.prototype.Entity,

    addOrUpdate: function(model) {
        var collection = this;
        if (_.isArray(model)) {
            return _.each(model, function(item) {
                collection.addOrUpdate(item); 
            });
        }

        var subject = model['@subject'] ? model['@subject'] : model.id;
        if (!subject) {
            this.add(model);
            return model;
        }

        if (this.get(subject)) {
            var existing = this.get(subject);
            if (model.attributes) {
                return existing.set(model.attributes);
            }
            return existing.set(model);
        }
        this.add(model);
        return model;
    }
});
