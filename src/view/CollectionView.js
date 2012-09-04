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

        _.bindAll(this, 'addItem', 'removeItem', 'refreshItems');

        this.collection.bind('add', this.addItem);
        this.collection.bind('remove', this.removeItem);
        this.collection.bind('reset', this.refreshItems);

        // Make the view aware of existing entities in collection
        var view = this;
        this.collection.forEach(function(entity) {
            view.registerItem(entity, view.collection);
        });
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
        if (childType) {
          childTypeName = childType.id;
        } else {
          childTypeName = '<http://www.w3.org/2002/07/owl#Thing>';
        }

        if (!this.canAdd(childTypeName)) {
            return;
        }

        var entityView = this.service._registerEntityView(entity, this.cloneElement(this.templates[childTypeName], entity));
        var entityElement = jQuery(entityView.render().el);
        if (entity.id) {
            this.service.setElementSubject(entity.getSubjectUri(), entityElement);
        }

        var entityIndex = collection.indexOf(entity);
        if (entityIndex === 0) {
          jQuery(this.el).prepend(entityElement);
        } else {
          var previousEntity = collection.at(entityIndex - 1);
          var previousView = this.entityViews[previousEntity.cid];
          if (previousView) {
            jQuery(previousView.el).after(entityElement);
          } else {
            jQuery(this.el).append(entityElement);
          }
        }

        // Ensure we catch all inferred predicates. We add these via JSONLD
        // so the references get properly Collectionized.
        var service = this.service;
        entityElement.parent('[rev]').each(function() {
            var predicate = jQuery(this).attr('rev');
            var relations = {};
            relations[predicate] = new service.vie.Collection([], {
              vie: service.vie
            });
            var model = service.vie.entities.get(service.getElementSubject(this));
            if (model) {
                relations[predicate].addOrUpdate(model);
            }
            entity.set(relations);
        });
        
        this.trigger('add', entityView);
        this.entityViews[entity.cid] = entityView;
        entityElement.show();
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
        var view = this;
        _.each(this.entityViews, function(view, cid) {
          jQuery(view.el).remove();
        });
        this.entityViews = {};
        collection.forEach(function(entity) {
            view.addItem(entity, collection);
        });
    },

    cloneElement: function(element, entity) {
        var newElement = jQuery(element).clone(false);
        var service = this.service;
        if (newElement.attr('about') !== undefined) {
            // Direct match with container
            newElement.attr('about', '');
        }
        newElement.find('[about]').attr('about', '');
        var subject = this.service.getElementSubject(newElement);
        service.findPredicateElements(subject, newElement, false).each(function() {
            var predicate = service.getElementPredicate(jQuery(this));
            if (entity.get(predicate) && entity.get(predicate).isCollection) {
              return true;
            }
            service.writeElementValue(null, jQuery(this), '');
        });
        return newElement;
    }
});
