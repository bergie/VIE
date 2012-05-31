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
VIE.prototype.Entity = function(attrs, opts) {

    attrs = (attrs)? attrs : {};
    opts = (opts)? opts : {};

    var self = this;

    if (attrs['@type'] !== undefined) {
        attrs['@type'] = (_.isArray(attrs['@type']))? attrs['@type'] : [ attrs['@type'] ];
        attrs['@type'] = _.map(attrs['@type'], function(val){
            if (!self.vie.types.get(val)) {
                //if there is no such type -> add it and let it inherit from "owl:Thing"
                self.vie.types.add(val).inherit("owl:Thing");
            }
            return self.vie.types.get(val).id;
        });
        attrs['@type'] = (attrs['@type'].length === 1)? attrs['@type'][0] : attrs['@type'];
    } else {
        // provide "owl:Thing" as the default type if none was given
        attrs['@type'] = self.vie.types.get("owl:Thing").id;
    }

    //the following provides full seamless namespace support
    //for attributes. It should not matter, if you
    //query for `model.get('name')` or `model.get('foaf:name')`
    //or even `model.get('http://xmlns.com/foaf/0.1/name');`
    //However, if we just overwrite `set()` and `get()`, this
    //raises a lot of side effects, so we need to expand
    //the attributes before we create the model.
    _.each (attrs, function (value, key) {
        var newKey = VIE.Util.mapAttributeNS(key, this.namespaces);
        if (key !== newKey) {
            delete attrs[key];
            attrs[newKey] = value;
        }
    }, self.vie);

    var Model = Backbone.Model.extend({
        idAttribute: '@subject',

        initialize: function(attributes, options) {
            if (attributes['@subject']) {
                this.id = this['@subject'] = this.toReference(attributes['@subject']);
            } else {
                this.id = this['@subject'] = attributes['@subject'] = this.cid.replace('c', '_:bnode');
            }
            return this;
        },

        // ### Getter, Has, Setter
        // #### `.get(attr)`
        // To be able to communicate to a VIE Entity you can use a simple get(property)
        // command as in `entity.get('rdfs:label')` which will give you one or more literals.
        // If the property points to a collection, its entities can be browsed further.
        get: function (attr) {
            attr = VIE.Util.mapAttributeNS(attr, self.vie.namespaces);
            var value = Backbone.Model.prototype.get.call(this, attr);
            value = (_.isArray(value))? value : [ value ];

            value = _.map(value, function(v) {
                if (v !== undefined && attr === '@type' && self.vie.types.get(v)) {
                    return self.vie.types.get(v);
                } else if (v !== undefined && self.vie.entities.get(v)) {
                    return self.vie.entities.get(v);
                } else {
                    return v;
                }
            }, this);
            if(value.length === 0) {
                return undefined;
            }
            // if there is only one element, just return that one
            value = (value.length === 1)? value[0] : value;
            return value;
        },

        // #### `.has(attr)`
        // Sometimes you'd like to determine if a specific attribute is set 
        // in an entity. For this reason you can call for example `person.has('friend')`
        // to determine if a person entity has friends.
        has: function(attr) {
            attr = VIE.Util.mapAttributeNS(attr, self.vie.namespaces);
            return Backbone.Model.prototype.has.call(this, attr);
        },

        // #### `.set(attrName, value, opts)`, 
        // The `options` parameter always refers to a `Backbone.Model.set` `options` object.
        //
        // **`.set(attributes, options)`** is the most universal way of calling the
        // `.set` method. In this case the `attributes` object is a map of all 
        // attributes to be changed.
        set : function(attrs, options, opts) {
            if (!attrs) {
                return this;
            }

            // Use **`.set(attrName, value, options)`** for setting or changing exactly one 
            // entity attribute.
            if (typeof attrs === "string") {
                var obj = {};
                obj[attrs] = options;
                return this.set(obj, opts);
            }
            // **`.set(entity)`**: In case you'd pass a VIE entity, 
            // the passed entities attributes are being set for the entity.
            if (attrs.attributes) {
                attrs = attrs.attributes;
            }
            var self = this;
            // resolve shortened URIs like rdfs:label..
            _.each (attrs, function (value, key) {
                var newKey = VIE.Util.mapAttributeNS(key, self.vie.namespaces);
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
                           self.vie.entities.addOrUpdate(child);
                       });
                   } else if (value.isEntity) {
                       self.vie.entities.addOrUpdate(value);
                       var coll = new self.vie.Collection();
                       coll.add(value);
                       attrs[key] = coll;
                   } else if (_.isArray(value)) {
                       // The value is an array, ignore
                   } else if (value["@value"]) {
                       // The value is a literal object, ignore
                   } else if (typeof value == "object") {
                       // The value is another VIE Entity
                       var child = new self.vie.Entity(value, options);
                       // which is being stored in `v.entities`
                       self.vie.entities.addOrUpdate(child);
                       // and set as VIE Collection attribute on the original entity 
                       var coll = new self.vie.Collection();
                       coll.add(value);
                       attrs[key] = coll;
                   } else {
                       // ignore
                   }
               }
            }, this);
            return Backbone.Model.prototype.set.call(this, attrs, options);
        },

        // **`.unset(attr, opts)` ** removes an attribute from the entity.
        unset: function (attr, opts) {
            attr = VIE.Util.mapAttributeNS(attr, self.vie.namespaces);
            return Backbone.Model.prototype.unset.call(this, attr, opts);
        },

        isNew: function() {
            if (this.getSubjectUri().substr(0, 7) === '_:bnode') {
                return true;
            }
            return false;
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

        isReference: function(uri){
            var matcher = new RegExp("^\\<([^\\>]*)\\>$");
            if (matcher.exec(uri)) {
                return true;
            }
            return false;
        },

        toReference: function(uri){
            if (_.isArray(uri)) {
              var self = this;
              return _.map(uri, function(part) {
                 return self.toReference(part);
              });
            }
            var ns = this.vie.namespaces;
            var ret = uri;
            if (uri.substring(0, 2) === "_:") {
                ret = uri;
            }
            else if (ns.isCurie(uri)) {
                ret = ns.uri(uri);
                if (ret === "<" + ns.base() + uri + ">") {
                    /* no base namespace extension with IDs */
                    ret = '<' + uri + '>';
                }
            } else if (!ns.isUri(uri)) {
                ret = '<' + uri + '>';
            }
            return ret;
        },

        fromReference: function(uri){
            var ns = this.vie.namespaces;
            if (!ns.isUri(uri)) {
                return uri;
            }
            return uri.substring(1, uri.length - 1);
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
            var instance = this;
            _.each(instance.attributes, function(value, name){
                var entityValue = value; //instance.get(name);

                if (value instanceof instance.vie.Collection) {
                    entityValue = value.map(function(instance) {
                        return instance.getSubject();
                    });
                }

                // TODO: Handle collections separately
                instanceLD[name] = entityValue;
            });

            instanceLD['@subject'] = instance.getSubject();

            return instanceLD;
        },

        // **`.setOrAdd(arg1, arg2)`** similar to `.set(..)`, `.setOrAdd(..)` can 
        // be used for setting one or more attributes of an entity, but in
        // this case it's a collection of values, not just one. That means, if the
        // entity already has the attribute set, make the value to a VIE Collection
        // and use the collection as value. The collection can contain entities 
        // or literals, but not both at the same time.
        setOrAdd: function (arg1, arg2, option) {
            var entity = this;
            if (typeof arg1 === "string" && arg2) {
                // calling entity.setOrAdd("rdfs:type", "example:Musician")
                entity._setOrAddOne(arg1, arg2, option);
            }
            else
                if (typeof arg1 === "object") {
                    // calling entity.setOrAdd({"rdfs:type": "example:Musician", ...})
                    _(arg1).each(function(val, key){
                        entity._setOrAddOne(key, val, arg2);
                    });
                }
            return this;
        },


        /* attr is always of type string */
        /* value can be of type: string,int,double,object,VIE.Entity,VIE.Collection */
       /*  val can be of type: undefined,string,int,double,array,VIE.Collection */
       
        /* depending on the type of value and the type of val, different actions need to be made */
        _setOrAddOne: function (attr, value, options) {
            if (!attr || !value)
                return;
            options = (options)? options : {};
                
            attr = VIE.Util.mapAttributeNS(attr, self.vie.namespaces);
            
            if (_.isArray(value)) {
                for (var v = 0; v < value.length; v++) {
                    this._setOrAddOne(attr, value[v], options);
                }
                return;
            }
            
            if (attr === "@type" && value instanceof self.vie.Type) {
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
                } else if (typeof value === "object") {
                    value = new this.vie.Entity(value);
                    existing.add(value);
                } else {
                    throw new Error("you cannot add a literal to a collection of entities!");
                }
                this.trigger('change:' + attr, this, value, {});
                this.change({});
            } else if (_.isArray(existing)) {
                if (value.isCollection) {
                	for (var v = 0; v < value.size(); v++) {
                		this._setOrAddOne(attr, value.at(v).getSubject(), options);
                	}
                } else if (value.isEntity) {
                	this._setOrAddOne(attr, value.getSubject(), options);
                } else if (typeof value === "object") {
                	value = new this.vie.Entity(value);
                	this._setOrAddOne(attr, value, options);
                } else {
                    /* yes, we (have to) allow multiple equal values */
                    existing.push(value);
                    obj[attr] = existing;
                    this.set(obj);
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
            type = self.vie.types.get(type);
            return this.hasPropertyValue("@type", type);
        },

        // TODO describe
        hasPropertyValue: function(property, value) {
            var t = this.get(property);
            if (!(value instanceof Object)) {
                value = self.vie.entities.get(value);
            }
            if (t instanceof Array) {
                return t.indexOf(value) !== -1;
            }
            else {
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
            
            type = (self.vie.types.get(type))? self.vie.types.get(type) : new self.vie.Type(type);
            for (var t = 0; t < types.length; t++) {
                if (self.vie.types.get(types[t])) {
                    if (self.vie.types.get(types[t]).isof(type)) {
                        return true;
                    }
                } else {
                    var typeTmp = new self.vie.Type(types[t]);
                    if (typeTmp.id === type.id) {
                        return true;
                    }
                }
            }
            return false;
        },
        // TODO describe
        addTo : function (collection, update) {
            var self = this;
            if (collection instanceof self.vie.Collection) {
                if (update) {
                    collection.addOrUpdate(self);
                } else {
                    collection.add(self);
                }
                return this;
            }
            throw new Error("Please provide a proper collection of type VIE.Collection as argument!");
        },

        isEntity: true,

        vie: self.vie
    });

    return new Model(attrs, opts);
};
