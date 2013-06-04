//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     (c) 2011 Sebastian Germesin, IKS Consortium
//     (c) 2011 Szaby Grünwald, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://viejs.org/
VIE.prototype.Collection = Backbone.Collection.extend({
    model: VIE.prototype.Entity,

    initialize: function (models, options) {
      if (!options || !options.vie) {
        throw new Error('Each collection needs a VIE reference');
      }
      this.vie = options.vie;
      this.predicate = options.predicate;
    },

    canAdd: function (type) {
      return true;
    },

    get: function(id) {
        if (id === null) {
            return null;
        }

        id = (id.getSubject)? id.getSubject() : id;
        if (typeof id === "string" && id.indexOf("_:") === 0) {
            if (id.indexOf("bnode") === 2) {
                //bnode!
                id = id.replace("_:bnode", 'c');
                return this._byId[id];
            } else {
                return this._byId["<" + id + ">"];
            }
        } else {
            if (this._byId[id]) {
              return this._byId[id];
            }
            id = this.toReference(id);
            return this._byId[id];
        }
    },

    addOrUpdate: function(model, options) {
        options = options || {};

        var collection = this;
        var existing;
        if (_.isArray(model)) {
            var entities = [];
            _.each(model, function(item) {
                entities.push(collection.addOrUpdate(item, options));
            });
            return entities;
        }

        if (model === undefined) {
            throw new Error("No model given");
        }

        if (_.isString(model)) {
          model = {
            '@subject': model,
            id: model
          };
        }

        if (!model.isEntity) {
            model = new this.model(model);
        }

        if (model.id && this.get(model.id)) {
            existing = this.get(model.id);
        }
        if (this.get(model.cid)) {
            existing = this.get(model.cid);
        }
        if (existing) {
            var newAttribs = {};
            _.each(model.attributes, function(value, attribute) {
                if (!existing.has(attribute)) {
                    newAttribs[attribute] = value;
                    return true;
                }

                if (attribute === '@subject') {
                    if (model.isNew() && !existing.isNew()) {
                        // Save order issue, skip
                        return true;
                    }
                }

                if (existing.get(attribute) === value) {
                    return true;
                }
                //merge existing attribute values with new ones!
                //not just overwrite 'em!!
                var oldVals = existing.attributes[attribute];
                var newVals = value;
                if (oldVals instanceof collection.vie.Collection) {
                    // TODO: Merge collections
                    return true;
                }
                if (options.overrideAttributes) {
                   newAttribs[attribute] = value;
                   return true;
                }
                if (attribute === '@context') {
                    newAttribs[attribute] = jQuery.extend(true, {}, oldVals, newVals);
                } else {
                    oldVals = (jQuery.isArray(oldVals))? oldVals : [ oldVals ];
                    newVals = (jQuery.isArray(newVals))? newVals : [ newVals ];
                    newAttribs[attribute] = _.uniq(oldVals.concat(newVals));
                    newAttribs[attribute] = (newAttribs[attribute].length === 1)? newAttribs[attribute][0] : newAttribs[attribute];
                }
            });

            if (!_.isEmpty(newAttribs)) {
                existing.set(newAttribs, options.updateOptions);
            }
            return existing;
        }
        this.add(model, options.addOptions);
        return model;
    },

    isReference: function (uri) {
        return VIE.Util.isReference(uri);
    },
    toReference: function (uri) {
        return VIE.Util.toReference(uri, this.vie.namespaces);
    },
    fromReference: function (uri) {
        return VIE.Util.fromReference(uri, this.vie.namespaces);
    },

    isCollection: true
});
