VIE.prototype.Collection = Backbone.Collection.extend({
    model: VIE.prototype.Entity,

    get: function(id) {
        if (id == null) return null;
        id = this.toReference(id);
        return this._byId[id.id != null ? id.id : id];
    },

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
    },

    isReference: function(uri){
        var matcher = new RegExp("^\\<([^\\>]*)\\>$");
        if (matcher.exec(uri)) {
            return true;
        }
        return false;
    },
        
    toReference: function(uri){
        if (this.isReference(uri)) {
            return uri;
        }
        return '<' + uri + '>';
    },
        
    fromReference: function(uri){
        if (!this.isReference(uri)) {
            return uri;
        }
        return uri.substring(1, uri.length - 1);
    }
});
