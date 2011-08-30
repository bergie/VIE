Zart.prototype.Entity = Backbone.Model.extend({
    getSubject: function() {
        if (typeof this.id === 'string') {
            if (this.id.substr(0, 7) === 'http://' || this.id.substr(0, 4) === 'urn:') {
                return "<" + this.id + ">";
            }
            return this.id;
        }
        return this.cid.replace('c', '_:bnode');
    },

    as: function(encoding) {
        if (encoding === "JSON") {
            return this.toJSON();
        }
        if (encoding === "JSONLD) {
            return this.toJSONLD();
        }
        throw "Unknown encoding " + encoding;
    },

    toJSONLD: function() {
        var instanceLD = {};
        var instance = this;
        _.each(instance.attributes, function(value, name) {
            var entityValue = instance.get(name);
            // TODO: Handle collections separately
            instanceLD[name] = entityValue();
        });

        instanceLD['@subject'] = instance.getSubject();

        return instanceLD;
    }
});
