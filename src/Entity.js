VIE.prototype.Entity = function(attrs, opts) {

    var self = this;

    var mapAttributeNS = function (attr, ns) {
        var a = attr;
        if (ns.isUri (attr) || attr.indexOf('@') === 0) {
            //ignore
        } else if (ns.isCurie(attr)) {
            a = ns.uri(attr);
        } else if (!ns.isUri(attr)) {
            if (attr.indexOf(":") === -1) {
                a = '<' + ns.base() + attr + '>';
            } else {
                a = '<' + attr + '>';
            }
        }
        return a;
    };

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
    attrs = (attrs) ? attrs : {};
    _.each (attrs, function (value, key) {
        var newKey = mapAttributeNS(key, this.namespaces);
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
            }
            return this;
        },

        get: function (attr) {
            attr = mapAttributeNS(attr, self.vie.namespaces);
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

        has: function(attr) {
            attr = mapAttributeNS(attr, self.vie.namespaces);
            return Backbone.Model.prototype.has.call(this, attr);
        },

        set : function(attrs, options, opts) {
            
            if (!attrs) {
                return this;
            }
            
            if (typeof attrs === "string") {
                var obj = {};
                obj[attrs] = options;
                return this.set(obj, opts);
            }
            if (attrs.attributes) {
                attrs = attrs.attributes;
            }
            var self = this;
            _.each (attrs, function (value, key) {
                var newKey = mapAttributeNS(key, self.vie.namespaces);
                if (key !== newKey) {
                    delete attrs[key];
                    attrs[newKey] = value;
                }
            }, this);
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
                       // ignore
                   } else if (typeof value == "object") {
                       var child = new self.vie.Entity(value, options);
                       self.vie.entities.addOrUpdate(child);
                       var coll = new self.vie.Collection();
                       coll.add(value);
                       attrs[key] = coll;
                   } else {
                       // ignore
                   }
                   /*if (typeof value === "object" &&
                       !jQuery.isArray(value) &&
                       !value.isCollection) {
                           //TODO: create collection!
                       var child = (value.isEntity)? value : new self.vie.Entity(value, options);
                       self.vie.entities.addOrUpdate(child);
                       attrs[key] = child.getSubject();
                   } else if (value && value.isCollection) {
                       //attrs[key] = [];
                       value.each(function (child) {
                           self.vie.entities.addOrUpdate(child);
                           //attrs[key].push(child.getSubject());
                       });
                   }*/
                   
               }
            }, this);
            return Backbone.Model.prototype.set.call(this, attrs, options);
        },

        unset: function (attr, opts) {
            attr = mapAttributeNS(attr, self.vie.namespaces);
            return Backbone.Model.prototype.unset.call(this, attr, opts);
        },

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
            if (typeof uri !== "string") {
                return uri;
            }
            if (this.isReference(uri)) {
                return uri;
            }
            return '<' + uri + '>';
        },

        fromReference: function(uri){
            if (typeof uri !== "string") {
                return uri;
            }
            if (!this.isReference(uri)) {
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

        setOrAdd: function (arg1, arg2) {
            var entity = this;
            if (typeof arg1 === "string" && arg2) {
                // calling entity.setOrAdd("rdfs:type", "example:Musician")
                entity._setOrAddOne(arg1, arg2);
            }
            else
                if (typeof arg1 === "object") {
                    // calling entity.setOrAdd({"rdfs:type": "example:Musician", ...})
                    _(arg1).each(function(val, key){
                        entity._setOrAddOne(key, val);
                    });
                }
            return this;
        },


        /* attr is always of type string */
        /* value can be of type: undefined,string,int,double,object,array,VIE.Entity,VIE.Collection */
       /*  val can be of type: undefined,string,int,double,array,VIE.Collection */
       
        /* depending on the type of value and the type of val, different actions need to be made */
        _setOrAddOne: function (attr, value) {
            if (!attr || !value)
                return;
                
            attr = mapAttributeNS(attr, self.vie.namespaces);
            
            if (_.isArray(value)) {
                for (var v = 0; v < value.length; v++) {
                    _setOrAddOne(attr, value[v]);
                }
                return;
            }
            
            var obj = {};
            var existing = Backbone.Model.prototype.get.call(this, attr);
            
            if (!existing) {
                obj[attr] = value;
                this.set(obj);
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
                    throw new Error("you cannot add a collection of entities to an array of literals!");
                } else if (value.isEntity) {
                    throw new Error("you cannot add an entity to an array of literals!");
                } else if (typeof value === "object") {
                    throw new Error("you cannot add an entity of entities to an array of literals!");
                } else {
                    existing.push(value);
                    obj[attr] = existing;
                    this.set(obj);
                }
            } else {
                if (value.isCollection) {
                    throw new Error("you cannot add a collection of entities to a literal!");
                } else if (value.isEntity) {
                    throw new Error("you cannot add an entity to a literal!");
                } else if (typeof value === "object") {
                    throw new Error("you cannot add an entity of entities to a literal!");
                } else {
                    /* yes, we allow multiple equal literals */
                    var arr = [];
                    arr.push(existing);
                    arr.push(value);
                    obj[attr] = arr;
                    this.set(obj);
                }
            }
            return;
            
            /*
            // No value yet, use the set method
            if (!existing) {
                obj = {};
                obj[attr] = value;
                this.set(obj);
            }
            else {
                if (!(existing instanceof Array)) {
                    existing = [existing];
                }
                // Make sure not to set the same value twice
                var contains = false;
                for (var v = 0; v < existing.length; v++) {
                    if (typeof existing[v] === "string") {
                        contains |= existing[v] == value;
                    } else {
                        contains |= existing[v].id == value;
                    }
                }
                if (!contains) {
                    existing.push(value);
                    obj = {};
                    obj[attr] = existing;
                    this.set(obj);
                }
            }*/
        },

        hasType: function(type){
            type = self.vie.types.get(type);
            return this.hasPropertyValue("@type", type);
        },

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
