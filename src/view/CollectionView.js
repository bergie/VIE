/*global VIE:false Backbone:false _:false jQuery:false */
if (!VIE.prototype.view) {
    VIE.prototype.view = {};
}

VIE.prototype.view.Collection = Backbone.View.extend({
    // Ensure the collection view gets updated when items get added or removed
    initialize: function() {
        this.templates = this.options.templates;
        this.service = this.options.service;
        if (!this.service) {
            throw "No RDFa service provided to the Collection View";
        }
        this.owner = this.options.owner;
        this.definition = this.options.definition;
        this.entityViews = {};

        this.listenTo(this.collection, 'add', this.addItem);
        this.listenTo(this.collection, 'remove', this.removeItem);
        this.listenTo(this.collection, 'reset', this.refreshItems);

        // Make the view aware of existing entities in collection
        this.collection.each(function(entity) {
            this.registerItem(entity, this.collection);
        }, this);
    },

    /*
     * ## canAdd: check if the view can add an item
     *
     * The Collection View can add items to itself if two constraints
     * pass:
     *
     *  * Collection View has a template
     *  * The attribute definition for the collection allows adding a model
     *
     *  Optionally you can pass a type to this method to check per type.
     */
    canAdd: function (type) {
      if (_.isEmpty(this.templates)) {
        return false;
      }

      if (type && !this.templates[type]) {
        return false;
      }

      return this.collection.canAdd(type);
    },

    addItem: function(entity, collection) {
        if (collection !== this.collection) {
            return;
        }

        var childType = entity.get('@type');
        var childTypeName;
        if (_.isArray(childType)) {
          _.each(childType, function (type) {
            if (this.canAdd(type.id)) {
              childTypeName = type.id;
            }
          }, this);
        } else {
          if (this.canAdd(childType.id)) {
            childTypeName = childType.id;
          }
        }

        if (!childTypeName) {
            return;
        }

        var self = this;
        // Run the templating function
        this.templates[childTypeName](entity, function (template) {
            // Template has been generated, register a view
            var entityView = self.service._registerEntityView(entity, template, true);
            var entityElement = entityView.render().$el;
            if (entity.id) {
                self.service.setElementSubject(entity.getSubjectUri(), entityElement);
            }

            // Add the new view to DOM
            var entityIndex = collection.indexOf(entity);
            if (entityIndex === 0) {
                self.$el.prepend(entityElement);
            } else {
                var previousEntity = collection.at(entityIndex - 1);
                var previousView = self.entityViews[previousEntity.cid];
                if (previousView) {
                    previousView.$el.after(entityElement);
                } else {
                    self.$el.append(entityElement);
                }
            }

            // Update reverse relations, if any
            self.findReverseRelations(entity, entityElement);

            // Handle eventing
            self.trigger('add', entityView);
            self.entityViews[entity.cid] = entityView;
            entityElement.show();
        }, this);
    },

    findReverseRelations: function (entity, element) {
        // Ensure we catch all inferred predicates. We add these via JSONLD
        // so the references get properly Collectionized.
        var service = this.service;
        element.parent('[rev]').each(function() {
            var predicate = jQuery(this).attr('rev');
            var relations = {};
            relations[predicate] = new service.vie.Collection([], {
              vie: service.vie,
              predicate: predicate
            });
            var model = service.vie.entities.get(service.getElementSubject(this));
            if (model) {
                relations[predicate].addOrUpdate(model);
            }
            entity.set(relations);
        });
    },

    registerItem: function(entity, collection) {
        var element = this.service.getElementBySubject(entity.id, this.el);
        if (!element) {
            return;
        }
        var entityView = this.service._registerEntityView(entity, element);
        this.entityViews[entity.cid] = entityView;
    },

    removeItem: function(entity) {
        if (!this.entityViews[entity.cid]) {
            return;
        }

        this.trigger('remove', this.entityViews[entity.cid]);
        jQuery(this.entityViews[entity.cid].el).remove();
        delete(this.entityViews[entity.cid]);
    },

    refreshItems: function(collection) {
        _.each(this.entityViews, function(view, cid) {
          jQuery(view.el).remove();
        });
        this.entityViews = {};
        collection.forEach(function(entity) {
            this.addItem(entity, collection);
        }, this);
    }
});
