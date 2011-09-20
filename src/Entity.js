VIE.prototype.Entity = function(attrs, opts) {

//namespace the attributes!
// if (@type)
// -> search corresponding type (vie.types.get(...))
// -> foreach (attribute \ {@subject, @type})
//    -> if (!attribute has Namespace)
//       -> attribute gets same namespace as @type
// else 
// -> foreach (attribute \ {@subject, @type})
//    -> if (!attribute has Namespace)
//       -> attribute gets default namespace


    var vie = this;
    
    var mapAttributeNS = function (attr) {
        var a = attr;
        try {
            if (vie.vie.namespaces.isUri (attr) || attr.indexOf('@') === 0) {
            //ignore
            } else if (vie.vie.namespaces.isCurie(attr)) {
                a = vie.vie.namespaces.uri(attr);
            } else {
                //TODO: what if @subject has namespace?
                a = '<' + vie.vie.namespaces.get('default') + attr + '>';
            }
        } catch (e) {
        }
        return a;
    };
    
    //@type is always an array of full URIs of types
    //makes live of web developers easier
    try {
        if (!('@type' in attrs)) {
            if (!vie.vie.types.get("Thing")) {
                throw "Please register a type 'Thing' in VIE.";
            }
            attrs['@type'] = [vie.vie.types.get("Thing").id];
        }
        else {
            if (_.isArray(attrs['@type'])) {
                attrs['@type'] = _.map(attrs['@type'], function(val){
                    return vie.vie.types.get(val).id;
                });
            }
            else {
                attrs['@type'] = [vie.vie.types.get(attrs['@type']).id];
            }
        }
    } catch (e) {
        console.log(e, "Could not register the @type attribute correctly, this is most likely because there is no type registered for one of the following values: ", attrs['@type']);
        attrs['@type'] = [vie.vie.types.get("Thing").id];
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
        var newKey = mapAttributeNS(key);
        if (key !== newKey) {
            delete attrs[key];
            attrs[newKey] = value;
        }
    });
    
    var Model = Backbone.Model.extend({
        idAttribute: '@subject',
        
        initialize: function(attributes, options){
            var instance = this;
            _.each(attributes, function(value, predicate){
                if (predicate === "@subject") {
                    instance.attributes['@subject'] = instance.id = instance.toReference(value);
                }

                if (!_.isArray(value)) {
                    return;
                }
                if (predicate === "@type") {
                    return;
                }
                var models = [];
                _.each(value, function(subject){
                    models.push(instance.vie.entities.addOrUpdate({
                        '@subject': subject
                    }));
                });
                
                var updateValues = {};
                updateValues[predicate] = new instance.vie.entityCollection(models);
                instance.set(updateValues, {
                    silent: true
                });
            });
        },
        
        get: function (attr) {
            attr = mapAttributeNS(attr);
            
            if (attr === '@type') {
                var self = this;
                return _.map(Backbone.Model.prototype.get.call(self, attr), function (val) {
                    return self.vie.vie.types.get(val);
                }, this);
            }
            
            return Backbone.Model.prototype.get.call(this, attr);
        },
        
        set : function(attrs, options) {
            if (!attrs) return this;
            if (attrs.attributes) 
                attrs = attrs.attributes;
          
            _.each (attrs, function (value, key) {
                var newKey = mapAttributeNS(key);
                if (key !== newKey) {
                    delete attrs[key];
                    attrs[newKey] = value;
                }
                if (key === '@type') {
                    var self = this;
                    delete attrs[key];
                    if (_.isArray(value)) {
                        attrs[newKey] = _.map(value, function (val) {
                            return self.vie.vie.types.get(val).id;
                        }, self);
                    } else {
                        attrs[newKey] = self.vie.vie.types.get(value).id;
                    }
                }
            }, this); 
            return Backbone.Model.prototype.set.call(this, attrs, options);
        },
        
        unset: function (attr, opts) {
            attr = mapAttributeNS(attr);
            
            if (attr === '@type') {
                this.set({
                    attr: this.vie.vie.types.get("Thing").id
                });
                return this;
            }
            
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
            type = this.vie.vie.types.get(type).id;
            return this.hasPropertyValue("@type", type);
        },
        
        isof: function (type) {
            var types = this.get('@type');
            
            for (var t in types) {
                if (this.vie.vie.types.get(types[t]).isof(type)) {
                    return true;
                }
            }
            return false;
        },
                
        hasPropertyValue: function(property, value) {
            var t = this.get(property);
            if (t instanceof Array) {
                return t.indexOf(value) !== -1;
            }
            else {
                return t === value;
            }
        },
        
        isEntity: true,
        
        vie: vie
    });
    
    return new Model(attrs, opts);    
};
