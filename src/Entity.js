Zart.prototype.Entity = function(attrs, opts){

//TODO: namespace the attributes!
// PROPOSAL: 
// if (@type has Namespace)
// -> foreach (attribute \ {@subject, @type})
//    -> if (!attribute has Namespace)
//       -> attribute gets same namespace as @type
// else 
// -> foreach (attribute \ {@subject, @type})
//    -> if (!attribute has Namespace)
//       -> attribute gets default namespace

//this provides full seamless namespace support
//for attributes. It should not matter, if you
//query for `model.get('name')` or `model.get('foaf:name')`
//or even `model.get('http://xmlns.com/foaf/0.1/name');`
//However, if we just overwrite `set()` and `get()`, this
//raises a lot of side effects, so we need to expand
//the attributes before we create the model.
    var zart = this;
    
    var attrs = (attrs) ? attrs : {};

    var Model = Backbone.Model.extend({
        idAttribute: '@subject',
        
        defaults: {
            '@type': 'Thing'
        },
        
        initialize: function(attributes, options){
            var instance = this;
            _.each(attributes, function(value, predicate){
                if (!_.isArray(value)) {
                    return;
                }
                if (predicate === "@type") {
                    return;
                }
                var models = [];
                _.each(value, function(subject){
                    models.push(instance.zart.entities.addOrUpdate({
                        '@subject': subject
                    }));
                });
                
                var updateValues = {};
                updateValues[predicate] = new instance.zart.entityCollection(models);
                instance.set(updateValues, {
                    silent: true
                });
            });
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
                // TODO: Handle collections separately
                instanceLD[name] = entityValue;
            });
            
            instanceLD['@subject'] = instance.getSubject();
            
            return instanceLD;
        },
        
        setOrAdd: function(arg1, arg2){
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
        
        _setOrAddOne: function(prop, value){
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
            return this.hasPropertyValue("@type", type);
        },
        
        getType: function(){
            return this.zart.types.get(this.get("@type"));
        },
        
        hasPropertyValue: function(property, value){
            var t = this.get(property);
            if (t instanceof Array) {
                return t.indexOf(value) !== -1;
            }
            else {
                return t === value;
            }
        },
        
        isEntity: true,
        
        zart: zart
    });
    
    return new Model(attrs, opts);    
};
