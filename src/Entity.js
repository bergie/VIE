VIE.prototype.Entity = function(attrs, opts) {

    var vie = this;
    
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
        
    if ('@type' in attrs) {
        if (_.isArray(attrs['@type'])) {
            attrs['@type'] = _.map(attrs['@type'], function(val){
                if (this.types.get(val)) {
                    return this.types.get(val).id;
                }
                else {
                    return val;
                }
            }, vie.vie);
        }
        else if (typeof attrs['@type'] === 'string') {
            if (this.vie.types.get(attrs['@type'])) {
                attrs['@type'] = this.vie.types.get(attrs['@type']).id;
            }
        }
    } else {
        // provide "Thing" as the default type if none was given
        attrs['@type'] = this.vie.types.get("Thing").id;
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
    }, vie.vie);
    
    var Model = Backbone.Model.extend({
        idAttribute: '@subject',

        initialize: function(attributes, options) {
            if (attributes['@subject']) {
                this.id = this['@subject'] = this.toReference(attributes['@subject']);
            }            
            return this;
        },
                
        get: function (attr) {
            attr = mapAttributeNS(attr, this.vie.vie.namespaces);
            var value = Backbone.Model.prototype.get.call(this, attr);
            
            if (_.isArray(value)) {
                value = _.map(value, function(v) {
                    if (this.vie.vie.entities.get(v)) {
                        return this.vie.vie.entities.get(v);
                    }
                    else if (attr === '@type' && this.vie.vie.types.get(v)) {
                        return this.vie.vie.types.get(v);
                    } else {
                        return v;
                    }
                }, this);
            } else {
                if (this.vie.vie.entities.get(value)) {
                    value = this.vie.vie.entities.get(value);
                } else if (attr === '@type' && this.vie.vie.types.get(value)) {
                    value = this.vie.vie.types.get(value);
                }
            }
            return value;
        },
        
        set : function(attrs, options) {
            if (!attrs) return this;
            if (attrs.attributes) 
                attrs = attrs.attributes;
          
            _.each (attrs, function (value, key) {
                var newKey = mapAttributeNS(key, this.vie.vie.namespaces);
                if (key !== newKey) {
                    delete attrs[key];
                    attrs[newKey] = value;
                }
            }, this); 
            return Backbone.Model.prototype.set.call(this, attrs, options);
        },
        
        unset: function (attr, opts) {
            attr = mapAttributeNS(attr, this.vie.vie.namespaces);
            return Backbone.Model.prototype.unset.call(this, attr, opts);
        },
        
        getSubject: function(){
            if (typeof this.id === "undefined") {
                this.id = this.get(this.idAttribute);
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
        },
        
        as: function(encoding){
            if (encoding === "JSON") {
                return this.toJSON();
            }
            if (encoding === "JSONLD") {
                return this.toJSONLD();
            }
            throw "Unknown encoding " + encoding;
        },
        
        toJSONLD: function(){
            var instanceLD = {};
            var instance = this;
            _.each(instance.attributes, function(value, name){
                var entityValue = instance.get(name);

                if (name === '@type' && entityValue) {
                    entityValue = entityValue.id;
                }

                if (value instanceof instance.vie.vie.Collection) {
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
        
        _setOrAddOne: function (prop, value) {
            var val = this.get(prop);
            // No value yet, use the set method
            if (!val) {
                var obj = {};
                obj[prop] = value;
                this.set(obj);
            }
            else {
                // Make sure not to set the same value twice
                if (val !== value && (!(val instanceof Array) && val.indexOf(value) === -1)) {
                    // Value already set, make sure it's an Array and extend it
                    if (!(val instanceof Array)) {
                        val = [val];
                    }
                    val.push(value);
                    var obj = {};
                    obj[prop] = val;
                    this.set(obj);
                }
            }
        },
        
        hasType: function(type){
            type = this.vie.vie.types.get(type);
            return this.hasPropertyValue("@type", type);
        },
        
        hasPropertyValue: function(property, value) {
            var t = this.get(property);
            if (!(value instanceof Object)) {
                value = this.vie.entities.get(value);
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
            
            types = (_.isArray(types))? types : [ types ];
            
            for (var t = 0; t < types.length; t++) {
                if (this.vie.vie.types.get(types[t]).isof(type)) {
                    return true;
                }
            }
            return false;
        },
        
        isEntity: true,
        
        vie: vie
    });
    
    return new Model(attrs, opts);    
};
