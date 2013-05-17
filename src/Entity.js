//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     (c) 2011 Sebastian Germesin, IKS Consortium
//     (c) 2011 Szaby Grünwald, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://viejs.org/

// ## VIE Entities
//
// In VIE there are two low-level model types for storing data.
// **Collections** and **Entities**. Considering `var v = new VIE();` a VIE instance,
// `v.entities` is a Collection with `VIE Entity` objects in it.
// VIE internally uses JSON-LD to store entities.
//
// Each Entity has a few special attributes starting with an `@`. VIE has an API
// for correctly using these attributes, so in order to stay compatible with later
// versions of the library, possibly using a later version of JSON-LD, use the API
// to interact with your entities.
//
// * `@subject` stands for the identifier of the entity. Use `e.getSubject()`
// * `@type` stores the explicit entity types. VIE internally handles Type hierarchy,
// which basically enables to define subtypes and supertypes. Every entity has
// the type 'owl:Thing'. Read more about Types in <a href="Type.html">VIE.Type</a>.
// * `@context` stores namespace definitions used in the entity. Read more about
// Namespaces in <a href="Namespace.html">VIE Namespaces</a>.
VIE.prototype.Entity = Backbone.Model.extend({
  idAttribute: '@subject',
  isEntity: true,

  defaults: {
    '@type': 'owl:Thing'
  },

  initialize: function(attributes, options) {
    if (!attributes) {
      attributes = {};
    }
    if (!options) {
      options = {};
    }
    if (attributes['@subject']) {
      this.id = this['@subject'] = this.toReference(attributes['@subject']);
    } else {
      this.id = this['@subject'] = attributes['@subject'] = this.cid.replace('c', '_:bnode');
    }
    return this;
  },

  schema: function() {
    return VIE.Util.getFormSchema(this);
  },

  // ### Getter, Has, Setter
  // #### `.get(attr)`
  // To be able to communicate to a VIE Entity you can use a simple get(property)
  // command as in `entity.get('rdfs:label')` which will give you one or more literals.
  // If the property points to a collection, its entities can be browsed further.
  get: function (attr) {
    attr = VIE.Util.mapAttributeNS(attr, this.vie.namespaces);
    var value = Backbone.Model.prototype.get.call(this, attr);

    value = (_.isArray(value)) ? value : [ value ];
    if (value.length === 0) {
      return undefined;
    }

    // Handle value conversions
    value = _.map(value, function(v) {
      if (v !== undefined && attr === '@type') {
        // Reference to a type. Return actual type instance
        if (!this.vie.types.get(v)) {
          // if there is no such type -> add it and let it inherit from
          // "owl:Thing"
          this.vie.types.add(v).inherit("owl:Thing");
        }

        return this.vie.types.get(v);
      } else if (v !== undefined && this.vie.entities.get(v)) {
        // Reference to another entity
        return this.vie.entities.get(v);
      } else {
        // Literal value, return as-is
        return v;
      }
    }, this);

    // if there is only one element, just return that one
    value = (value.length === 1)? value[0] : value;
    return value;
  },

  // #### `.has(attr)`
  // Sometimes you'd like to determine if a specific attribute is set
  // in an entity. For this reason you can call for example `person.has('friend')`
  // to determine if a person entity has friends.
  has: function(attr) {
    attr = VIE.Util.mapAttributeNS(attr, this.vie.namespaces);
    return Backbone.Model.prototype.has.call(this, attr);
  },

  hasRelations: function() {
    var found = false;
    _.each(this.attributes, function (value) {
      if (value && value.isCollection) {
        found = true;
      }
    });
    return found;
  },

  // #### `.set(attrName, value, opts)`,
  // The `options` parameter always refers to a `Backbone.Model.set` `options` object.
  //
  // **`.set(attributes, options)`** is the most universal way of calling the
  // `.set` method. In this case the `attributes` object is a map of all
  // attributes to be changed.
  set: function(attrs, options, opts) {
    if (!attrs) {
      return this;
    }

    if (attrs['@subject']) {
      attrs['@subject'] = this.toReference(attrs['@subject']);
    }

    // Use **`.set(attrName, value, options)`** for setting or changing exactly one
    // entity attribute.
    if (_.isString(attrs)) {
      var obj = {};
      obj[attrs] = options;
      return this.set(obj, opts);
    }

    // VIE's type system is more strict than default Backbone. Unless validation is
    // explicitly disabled, we should always validate on set
    if (!options) {
      options = {};
    }
    if (options.validate !== false && options.silent !== true) {
      options.validate = true;
    }

    // **`.set(entity)`**: In case you'd pass a VIE entity,
    // the passed entities attributes are being set for the entity.
    if (attrs.attributes) {
      attrs = attrs.attributes;
    }
    var coll;
    // resolve shortened URIs like rdfs:label..
    _.each (attrs, function (value, key) {
      var newKey = VIE.Util.mapAttributeNS(key, this.vie.namespaces);
      if (key !== newKey) {
        delete attrs[key];
        attrs[newKey] = value;
      }
    }, this);

    // Finally iterate through the *attributes* to be set and prepare
    // them for the Backbone.Model.set method.
    _.each (attrs, function (value, key) {
      if (!value) { return; }
      if (key.indexOf('@') === -1) {
        if (value.isCollection) {
          // ignore
          value.each(function (child) {
            this.vie.entities.addOrUpdate(child);
          }, this);
        } else if (value.isEntity) {
          this.vie.entities.addOrUpdate(value);
          coll = new this.vie.Collection(value, {
            vie: this.vie,
            predicate: key
          });
          attrs[key] = coll;
        } else if (_.isArray(value)) {
          if (this.attributes[key] && this.attributes[key].isCollection) {
            var newEntities = this.attributes[key].addOrUpdate(value);
            attrs[key] = this.attributes[key];
            attrs[key].reset(newEntities);
          }
        } else if (value["@value"]) {
          // The value is a literal object, ignore
        } else if (_.isObject(value) && !_.isDate(value)) {
          // The value is another VIE Entity
          var child = new this.vie.Entity(value, options);
          // which is being stored in `v.entities`
          this.vie.entities.addOrUpdate(child);
          // and set as VIE Collection attribute on the original entity
          coll = new this.vie.Collection(value, {
            vie: this.vie,
            predicate: key
          });
          attrs[key] = coll;
        } else {
          // ignore
        }
      }
    }, this);
    var ret = Backbone.Model.prototype.set.call(this, attrs, options);
    if (options && options.ignoreChanges) {
      // TODO: This will need to be changed to reflect now change
      // tracking mechanisms in Backbone.js 1.0.0
      this.changed = {};
      this._previousAttributes = _.clone(this.attributes);
    }
    return ret;
  },

  // **`.unset(attr, opts)` ** removes an attribute from the entity.
  unset: function (attr, opts) {
    attr = VIE.Util.mapAttributeNS(attr, this.vie.namespaces);
    return Backbone.Model.prototype.unset.call(this, attr, opts);
  },

  // Validation based on type rules.
  //
  // There are two ways to skip validation for entity operations:
  //
  // * `options.silent = true`
  // * `options.validate = false`
  validate: function (attrs, opts) {
    if (opts && opts.validate === false) {
      return;
    }
    var types = this.get('@type');
    if (!types) {
      return;
    }
    if (_.isArray(types)) {
      var results = [];
      _.each(types, function (type) {
        var res = this.validateByType(type, attrs, opts);
        if (res) {
          results.push(res);
        }
      }, this);
      if (_.isEmpty(results)) {
        return;
      }
      return _.flatten(results);
    }

    return this.validateByType(types, attrs, opts);
  },

  validateByType: function (type, attrs, opts) {
    var messages = {
      max: '<%= property %> cannot contain more than <%= num %> items',
      min: '<%= property %> must contain at least <%= num %> items',
      required: '<%= property %> is required'
    };

    if (!type.attributes) {
      return;
    }

    var toError = function (definition, constraint, messageValues) {
      return {
        property: definition.id,
        constraint: constraint,
        message: _.template(messages[constraint], _.extend({
          property: definition.id
        }, messageValues))
      };
    };

    var checkMin = function (definition, attrs) {
      if (!attrs[definition.id] || _.isEmpty(attrs[definition.id])) {
        return toError(definition, 'required', {});
      }
    };

    // Check the number of items in attr against max
    var checkMax = function (definition, attrs) {
      if (!attrs || !attrs[definition.id]) {
        return;
      }

      if (!attrs[definition.id].isCollection && !_.isArray(attrs[definition.id])) {
        return;
      }

      if (attrs[definition.id].length > definition.max) {
        return toError(definition, 'max', {
          num: definition.max
        });
      }
    };

    var results = [];
    _.each(type.attributes.list(), function (definition) {
      var res;
      if (definition.max && definition.max != -1) {
        res = checkMax(definition, attrs);
        if (res) {
          results.push(res);
        }
      }

      if (definition.min && definition.min > 0) {
        res = checkMin(definition, attrs);
        if (res) {
          results.push(res);
        }
      }
    });

    if (_.isEmpty(results)) {
      return;
    }
    return results;
  },

  isNew: function() {
    if (this.getSubjectUri().substr(0, 7) === '_:bnode') {
      return true;
    }
    return false;
  },

  hasChanged: function(attr) {
    if (this.markedChanged) {
      return true;
    }

    return Backbone.Model.prototype.hasChanged.call(this, attr);
  },

  // Force hasChanged to return true
  forceChanged: function(changed) {
    this.markedChanged = changed ? true : false;
  },

  // **`getSubject()`** is the getter for the entity identifier.
  getSubject: function(){
    if (typeof this.id === "undefined") {
      this.id = this.attributes[this.idAttribute];
    }
    if (typeof this.id === 'string') {
      if (this.id.substr(0, 7) === 'http://' || this.id.substr(0, 4) === 'urn:') {
        return this.toReference(this.id);
      }
      return this.id;
    }
    return this.cid.replace('c', '_:bnode');
  },

  // TODO describe
  getSubjectUri: function(){
    return this.fromReference(this.getSubject());
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

  as: function(encoding){
    if (encoding === "JSON") {
      return this.toJSON();
    }
    if (encoding === "JSONLD") {
      return this.toJSONLD();
    }
    throw new Error("Unknown encoding " + encoding);
  },

  toJSONLD: function(){
    var instanceLD = {};
    _.each(this.attributes, function(value, name){
      var entityValue = this.get(name);

      if (value instanceof this.vie.Collection) {
        entityValue = value.map(function(instance) {
          return instance.getSubject();
        });
      }
      if (name === '@type') {
        if (_.isArray(entityValue)) {
          entityValue = _.map(entityValue, function(type) { return type.toString(); });
        } else {
          entityValue = entityValue.toString();
        }
      }

      instanceLD[name] = entityValue;
    }, this);

    instanceLD['@subject'] = this.getSubject();

    return instanceLD;
  },

  // **`.setOrAdd(arg1, arg2)`** similar to `.set(..)`, `.setOrAdd(..)` can
  // be used for setting one or more attributes of an entity, but in
  // this case it's a collection of values, not just one. That means, if the
  // entity already has the attribute set, make the value to a VIE Collection
  // and use the collection as value. The collection can contain entities
  // or literals, but not both at the same time.
  setOrAdd: function (arg1, arg2, option) {
    if (_.isString(arg1) && arg2) {
      // calling entity.setOrAdd("rdfs:type", "example:Musician")
      this._setOrAddOne(arg1, arg2, option);
    } else if (_.isObject(arg1)) {
      // calling entity.setOrAdd({"rdfs:type": "example:Musician", ...})
      _.each(arg1, function(val, key){
        this._setOrAddOne(key, val, arg2);
      }, this);
    }
    return this;
  },


  /* attr is always of type string */
  /* value can be of type: string,int,double,object,VIE.Entity,VIE.Collection */
  /*  val can be of type: undefined,string,int,double,array,VIE.Collection */

  /* depending on the type of value and the type of val, different actions need to be made */
  _setOrAddOne: function (attr, value, options) {
    if (!attr || !value) {
      return;
    }
    options = (options)? options : {};

    attr = VIE.Util.mapAttributeNS(attr, this.vie.namespaces);

    if (_.isArray(value)) {
      _.each(value, function (v) {
        this._setOrAddOne(attr, value[v], options);
      }, this);
      return;
    }

    if (attr === "@type" && value instanceof this.vie.Type) {
      value = value.id;
    }

    var obj = {};
    var existing = Backbone.Model.prototype.get.call(this, attr);

    if (!existing) {
      obj[attr] = value;
      this.set(obj, options);
    } else if (existing.isCollection) {
      if (value.isCollection) {
        value.each(function (model) {
          existing.add(model);
        });
      } else if (value.isEntity) {
        existing.add(value);
      } else if (_.isObject(value)) {
        value = new this.vie.Entity(value);
        existing.add(value);
      } else {
        throw new Error("you cannot add a literal to a collection of entities!");
      }
      this.trigger('change:' + attr, this, value, {});
      //this.change({});
    } else if (_.isArray(existing)) {
      if (value.isCollection) {
        value.each(function (v) {
          this._setOrAddOne(attr, value.at(v).getSubject(), options);
        }, this);
      } else if (value.isEntity) {
        this._setOrAddOne(attr, value.getSubject(), options);
      } else if (_.isObject(value)) {
        value = new this.vie.Entity(value);
        this._setOrAddOne(attr, value, options);
      } else {
        /* yes, we (have to) allow multiple equal values */
        var newArray = existing.slice(0);
        newArray.push(value);
        this.set(attr, newArray);
      }
    } else {
      var arr = [ existing ];
      arr.push(value);
      obj[attr] = arr;
      return this.set(obj, options);
    }
  },

  // **`.hasType(type)`** determines if the entity has the explicit `type` set.
  hasType: function(type){
    type = this.vie.types.get(type);
    return this.hasPropertyValue("@type", type);
  },

  // TODO describe
  hasPropertyValue: function(property, value) {
    var t = this.get(property);
    if (!_.isObject(value)) {
      value = this.vie.entities.get(value);
    }
    if (_.isArray(t)) {
      return t.indexOf(value) !== -1;
    } else {
      return t === value;
    }
  },

  // **`.isof(type)`** determines if the entity is of `type` by explicit or implicit
  // declaration. E.g. if Employee is a subtype of Person and e Entity has
  // explicitly set type Employee, e.isof(Person) will evaluate to true.
  isof: function (type) {
    var types = this.get('@type');

    if (types === undefined) {
      return false;
    }
    types = (_.isArray(types))? types : [ types ];

    type = (this.vie.types.get(type)) ? this.vie.types.get(type) : new this.vie.Type(type);

    var isof = false;
    _.each(types, function (t) {
      if (this.vie.types.get(t).isof(type)) {
        isof = true;
      }
    }, this);
    return isof;
  },

  // TODO describe
  addTo : function (collection, update) {
    if (collection instanceof this.vie.Collection) {
      if (update) {
        collection.addOrUpdate(this);
      } else {
        collection.add(this);
      }
      return this;
    }
    throw new Error("Please provide a proper collection of type VIE.Collection as argument!");
  }

});
