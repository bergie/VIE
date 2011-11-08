(function(){var root = this,
    jQuery = root.jQuery,
    Backbone = root.Backbone,
    _ = root._;

var VIE = root.VIE = function(config) {
    this.config = (config) ? config : {};
    this.services = {};
    this.entities = new this.Collection();

    this.Entity.prototype.entities = this.entities;
    this.entities.vie = this;
    this.Entity.prototype.entityCollection = this.Collection;
    this.Entity.prototype.vie = this;

    this.defaultProxyUrl = (this.config.defaultProxyUrl) ? this.config.defaultProxyUrl : "../utils/proxy/proxy.php";
    
    this.Namespaces.prototype.vie = this;
    this.namespaces = new this.Namespaces(
        (this.config.defaultNamespace) ? this.config.defaultNamespace : "http://ontology.vie.js/"
    );
    
    this.Type.prototype.vie = this;
    this.Types.prototype.vie = this;
    this.Attribute.prototype.vie = this;
    this.Attributes.prototype.vie = this;
    this.types = new this.Types();
    this.types.add("Thing");

    if (this.config.classic !== false) {
        // Load Classic API as well
        this.RDFa = new this.ClassicRDFa(this);
        this.RDFaEntities = new this.ClassicRDFaEntities(this);
        this.EntityManager = new this.ClassicEntityManager(this);

        this.cleanup = function() {
            this.entities.reset();
        };
    }
};

VIE.prototype.use = function(service, name) {
  if (!name) {
    name = service.name;
  }
  service.vie = this;
  service.name = name;
  if (service.init) {
      service.init();
  }
  this.services[name] = service;
};

VIE.prototype.service = function(name) {
  if (!this.services[name]) {
    throw "Undefined service " + name;
  }
  return this.services[name];
};

VIE.prototype.getServicesArray = function() {
  var res = [];
  _.each(this.services, function(service, i){res.push(service);});
  return res;
};

// Declaring the ..able classes
// Loadable
VIE.prototype.load = function(options) {
  if (!options) { options = {}; }
  options.vie = this;
  return new this.Loadable(options);
};



// Savable
VIE.prototype.save = function(options) {
  if (!options) { options = {}; }
  options.vie = this;
  return new this.Savable(options);
};


// Removable
VIE.prototype.remove = function(options) {
  if (!options) { options = {}; }
  options.vie = this;
  return new this.Removable(options);
};


// Analyzable
VIE.prototype.analyze = function(options) {
  if (!options) { options = {}; }
  options.vie = this;
  return new this.Analyzable(options);
};


// Findable
VIE.prototype.find = function(options) {
  if (!options) { options = {}; }
  options.vie = this;
  return new this.Findable(options);
};


if(typeof exports === 'object') {
    // Running under Node.js or other CommonJS environment
    exports.VIE = VIE;

    if (!jQuery) {
        jQuery = require('jquery');
    }
    if (!Backbone) {
        Backbone = require('backbone');
    }
    if (!_) {
        _ = require('underscore')._;
    }
}

VIE.prototype.Able = function(){
};
    // takes a list of services or just one
VIE.prototype.Able.prototype = {
    using: function(services) {
        var service = this;
        if ( services instanceof Array ) {
            _(services).each(function(s){
                service._using(s);
            });
        } else {
            var s = services;
            service._using(s);
        }
        return this;
    },
    _using: function(service) {
        var serviceObj = typeof service === "string" ? this.vie.service(service) : service;
        this.services.push(serviceObj);
        return this;
    },
    init: function(options, methodName) {
        this.methodName = methodName;
        this.options = options;
        this.services = options.from || options.using || options.to || [];
        this.vie = options.vie;
        this.deferred = jQuery.Deferred();

        // Public deferred-methods
        this.resolve = this.deferred.resolve;
        this.resolveWith = this.deferred.resolveWith;
        this.reject = this.deferred.reject;
        this.rejectWith = this.deferred.rejectWith;

        // Synonyms
        this.success = this.done = this.deferred.done;
        this.fail = this.deferred.fail;
        this.then = this.deferred.then; // Takes 2 arguments, successCallbacks, failCallbacks
        this.always = this.deferred.always;
        this.from = this.using;
        this.to = this.using;
    },
    // Running the actual method
    execute: function() {
        // call service.load
        var able = this;
        _(this.services).each(function(service){
            service[able.methodName](able);
        });
        return this;
    }
};

VIE.prototype.Loadable = function (options) {
    this.init(options,"load");
};
VIE.prototype.Loadable.prototype = new VIE.prototype.Able();

VIE.prototype.Savable = function(options){
    this.init(options, "save");
};
VIE.prototype.Savable.prototype = new VIE.prototype.Able();

VIE.prototype.Removable = function(options){
    this.init(options, "remove");
};
VIE.prototype.Removable.prototype = new VIE.prototype.Able();

VIE.prototype.Analyzable = function (options) {
    this.init(options, "analyze");
};
VIE.prototype.Analyzable.prototype = new VIE.prototype.Able();

VIE.prototype.Findable = function (options) {
    this.init(options, "find");
};

VIE.prototype.Findable.prototype = new VIE.prototype.Able();

// File:   Util.js <br />
// Author: <a href="http://github.com/neogermi/">Sebastian Germesin</a>
//

// Utilities for the day-to-day VIE.js usage

// extension to jQuery to compare two arrays on equality
// found: <a href="http://stackoverflow.com/questions/1773069/using-jquery-to-compare-two-arrays">http://stackoverflow.com/questions/1773069/using-jquery-to-compare-two-arrays</a>
jQuery.fn.compare = function(t) {
    if (this.length !== t.length) { return false; }
    var a = this.sort(),
        b = t.sort();
    for (var i = 0; t[i]; i++) {
        if (a[i] !== b[i]) { 
                return false;
        }
    }
    return true;
};

// Extension to the JS native Array implementation to remove values from an array.
// from: <a href="http://sebastian.germes.in/blog/2011/09/javascripts-missing-array-remove-function/">http://sebastian.germes.in/blog/2011/09/javascripts-missing-array-remove-function/</a>
if (!Array.prototype.remove) {
  Array.prototype.remove = function () {
    var args = this.remove.arguments;
    var i;

    if (args[0] && args[0] instanceof Array) {
      var a = args[0];
      for (i = 0; i < a.length; i++) {
        this.remove(a[i]);
      }
    } else {
      for (i = 0; i < args.length; i++) {
        while(true) {
          var index = this.indexOf(args[i]);
          if (index !== -1) {
            this.splice(index, 1);
          } else {
            break;
          }
        }
      }
    }
  return this;
  };
}

//Extension to the JS native Array implementation to remove duplicates from an array.
//This actually leaves the original Array untouched and returns a copy with no duplicates.
if (!Array.prototype.unduplicate) {
	Array.prototype.unduplicate = function () {
	    var sorted_arr = this.sort();
	    var results = [];
	    for (var i = 0; i < sorted_arr.length; i++) {
	        if (i === sorted_arr.length-1 || sorted_arr[i] !== sorted_arr[i+1]) {
	            results.push(sorted_arr[i]);
	        }
	    }
	    return results;
	};
} 


VIE.Util = {
		// converts a given URI into a CURIE (or save CURIE), based
		// on the given VIE.Namespaces object.
	toCurie : function (uri, safe, namespaces) {
        if (VIE.Util.isCurie(uri, namespaces)) {
            return uri;
        }
        var delim = ":";
        for (var k in namespaces.toObj()) {
            if (uri.indexOf(namespaces.get(k)) === 1) {
                var pattern = new RegExp("^" + "<" + namespaces.get(k));
                if (k === '') {
                    delim = '';
                }
                return ((safe)? "[" : "") + 
                        uri.replace(pattern, k + delim).replace(/>$/, '') +
                        ((safe)? "]" : "");
            }
        }
        throw new Error("No prefix found for URI '" + uri + "'!");
    },

	// checks, whether the given string is a CURIE.
    isCurie : function (something, namespaces) {
        try {
            VIE.Util.toUri(something, namespaces);
            return true;
        } catch (e) {
            return false;
        }
    },

	// converts a given CURIE (or save CURIE) into a URI, based
	// on the given VIE.Namespaces object.
    toUri : function (curie, namespaces) {
        var delim = ":";
        for (var k in namespaces.toObj()) {
            if (k !== "" && (curie.indexOf(k) === 0 || curie.indexOf(k) === 1)) {
                var pattern = new RegExp("^" + "\\[{0,1}" + k + delim);
                return "<" + curie.replace(pattern, namespaces.get(k)).replace(/\]{0,1}$/, '') + ">";
            }
        }
        //default:
        if (curie.indexOf(delim) === -1 && namespaces.base()) {
            return "<" + namespaces.base() + curie + ">";
        }
        throw new Error("No prefix found for CURIE '" + curie + "'!");
    },
    
    // checks, whether the given string is a URI.
    isUri : function (something) {
        return (typeof something === "string" && something.search(/^<.+:.+>$/) === 0);
    },
    
    _blankNodeSeed : new Date().getTime() % 1000,
    
    blankNodeID : function () {
      this._blankNodeSeed += 1;
      return '_:bnode' + this._blankNodeSeed.toString(16);
    }    
    
};
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
        
    if ('@type' in attrs) {
        if (_.isArray(attrs['@type'])) {
            attrs['@type'] = _.map(attrs['@type'], function(val){
                if (this.types.get(val)) {
                    return this.types.get(val).id;
                }
                else {
                    return val;
                }
            }, self.vie);
        }
        else if (typeof attrs['@type'] === 'string') {
            if (self.vie.types.get(attrs['@type'])) {
                attrs['@type'] = self.vie.types.get(attrs['@type']).id;
            }
        }
    } else {
        // provide "Thing" as the default type if none was given
        attrs['@type'] = self.vie.types.get("Thing").id;
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
            if (_.isArray(value)) {
                value = _.map(value, function(v) {
                    if (attr === '@type' && self.vie.types.get(v)) {
                        return self.vie.types.get(v);
                    } else if (self.vie.entities.get(v)) {
                        return self.vie.entities.get(v);
                    } else {
                        return v;
                    }
                }, this);
            } else {
                if (typeof value !== "string") {
                    return value;
                } 
                
                if (attr === '@type' && self.vie.types.get(value)) {
                    value = self.vie.types.get(value);
                } else if (self.vie.entities.get(value)) {
                    value = self.vie.entities.get(value);
                }
            }
            return value;
        },

        has: function(attr) {
            attr = mapAttributeNS(attr, self.vie.namespaces);
            return Backbone.Model.prototype.has.call(this, attr);
        },
        
        set : function(attrs, options) {
            if (!attrs) {
                return this;
            }
            if (attrs.attributes) {
                attrs = attrs.attributes;
            }
            _.each (attrs, function (value, key) {
                var newKey = mapAttributeNS(key, self.vie.namespaces);
                if (key !== newKey) {
                    delete attrs[key];
                    attrs[newKey] = value;
                }
            }, this);
            _.each (attrs, function (value, key) {
               if (key.indexOf('@') === -1) {
                   if (typeof value === "object" && 
                       !jQuery.isArray(value) &&
                       !value.isCollection) {
                       var child = new self.vie.Entity(value, options);
                       self.vie.entities.addOrUpdate(child);
                       attrs[key] = child.getSubject();
                   } else if (value.isCollection) {
                       //attrs[key] = [];
                       value.each(function (child) {
                           self.vie.entities.addOrUpdate(child);
                           //attrs[key].push(child.getSubject());
                       });
                   }
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
            throw "Unknown encoding " + encoding;
        },
        
        toJSONLD: function(){
            var instanceLD = {};
            var instance = this;
            _.each(instance.attributes, function(value, name){
                var entityValue = value; //instance.get(name);

                if (name === '@type' && typeof entityValue === 'object') {
                    entityValue = entityValue.id;
                }

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

        _setOrAddOne: function (attr, value) {
            var obj;
            attr = mapAttributeNS(attr, self.vie.namespaces);
            var val = Backbone.Model.prototype.get.call(this, attr);

            // No value yet, use the set method
            if (!val) {
                obj = {};
                obj[attr] = value;
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
                    obj = {};
                    obj[attr] = val;
                    this.set(obj);
                }
            }
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
            
            types = (_.isArray(types))? types : [ types ];
            
            for (var t = 0; t < types.length; t++) {
                if (self.vie.types.get(types[t]) && 
                    self.vie.types.get(types[t]).isof(type)) {
                    return true;
                }
            }
            return false;
        },
        
        isEntity: true,
        
        vie: self.vie
    });
    
    return new Model(attrs, opts);    
};
VIE.prototype.Collection = Backbone.Collection.extend({
    model: VIE.prototype.Entity,
    
    get: function(id) {
        if (id === null) {
            return null;
        }

        id = (id.getSubject)? id.getSubject() : id;        
        if (typeof id === "string" && id.indexOf("_:") === 0) {
            //bnode!
            id = id.replace("_:bnode", 'c');
            return this._byCid[id];
        } else {
            id = this.toReference(id);
            return this._byId[id];
        }
    },

    addOrUpdate: function(model) {
        var collection = this;
        var existing;
        if (_.isArray(model)) {
            var entities = [];
            _.each(model, function(item) {
                entities.push(collection.addOrUpdate(item));
            });
            return entities;
        }

        if (!model.isEntity) {
            model = new this.model(model);
        }

        if (model.id && this.get(model.id)) {
            existing = this.get(model.id);
        }
        if (this.getByCid(model.cid)) {
            var existing = this.getByCid(model.cid);
        }
        if (existing) {
            if (model.attributes) {
                return existing.set(model.attributes);
            }
            return existing.set(model);
        }

        this.add(model);
        return model;
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
    
    isCollection: true
});
// File:   Type.js <br />
// Author: <a href="http://github.com/neogermi/">Sebastian Germesin</a>
//

// Adding capability of handling type/class structure and inheritance to VIE. 
if (VIE.prototype.Type) {
	throw "ERROR: VIE.Type is already defined. Please check your installation!";
}
if (VIE.prototype.Types) {
	throw "ERROR: VIE.Types is already defined. Please check your installation!";
}

// The constructor of a VIE.Type. 
//Usage: ``var personType = new vie.Type("Person", []).inherit("Thing");``
// This creates a type person in the base namespace that has no attributes
// but inherits from the type "Thing". 
VIE.prototype.Type = function (id, attrs) {
    if (id === undefined || typeof id !== 'string') {
        throw "The type constructor needs an 'id' of type string! E.g., 'Person'";
    }

    this.id = this.vie.namespaces.isUri(id) ? id : this.vie.namespaces.uri(id);

    // checks whether such a type is already defined. 
    if (this.vie.types.get(this.id)) {
        throw "The type " + this.id + " is already defined!";
    }    
    
    // the supertypes (parentclasses) of the current type.
    this.supertypes = new this.vie.Types();
    // the subtypes (childclasses) of the current type.
    this.subtypes = new this.vie.Types();
    
    // the given attributes as a `vie.Attributes` element.
    this.attributes = new this.vie.Attributes(this, (attrs)? attrs : []);
    
    // checks whether the current type inherits of the
    // given type, e.g.,: ``personType.isof("Thing");``
    // would evaluate to `true`.
    // We can either pass a type object or a string that
    // represents the id of the type.
    this.isof = function (type) {
        type = this.vie.types.get(type);
        if (type) {
            return type.subsumes(this.id);
        } else {
            throw "No valid type given";
        }
    };
    
    // checks whether the current type subsumes the
    // given type, e.g.,: ``thingType.subsumes("Person");``
    // would evaluate to `true`.
    // We can either pass a type object or a string that
    // represents the id of the type.
    this.subsumes = function (type) {
        type = this.vie.types.get(type);
        if (type) {
            if (this.id === type.id) {
                return true;
            }
            var subtypes = this.subtypes.list();
            for (var c = 0; c < subtypes.length; c++) {
                var childObj = subtypes[c];
                if (childObj) {
                     if (childObj.id === type.id || childObj.subsumes(type)) {
                         return true;
                     }
                }
            }
            return false;
        } else {
            throw "No valid type given";
        }
    };
    
    //inherit all attributes from the supertype (recursively).
    //we can either pass a string (id) of the supertype, the
    //supertype itself or an array of both.
    this.inherit = function (supertype) {
        if (typeof supertype === "string") {
            this.inherit(this.vie.types.get(supertype));
        }
        else if (supertype instanceof this.vie.Type) {
            supertype.subtypes.addOrOverwrite(this);
            this.supertypes.addOrOverwrite(supertype);
            try {
                // only for validation of attribute-inheritance!
                // if this throws an error (inheriting two attributes
                // that cannot be combined) we reverse all changes. 
                this.attributes.list();
            } catch (e) {
                supertype.subtypes.remove(this);
                this.supertypes.remove(supertype);
                throw e;
            }
        } else if (jQuery.isArray(supertype)) {
            for (var i = 0; i < supertype.length; i++) {
                this.inherit(supertype[i]);
            }
        } else {
            throw "Wrong argument in VIE.Type.inherit()";
        }
        return this;
    };
        
    // serializes the hierarchy of child types into an
    // object.
    this.hierarchy = function () {
        var obj = {id : this.id, subtypes: []};
        var list = this.subtypes.list();
        for (var c = 0; c < list.length; c++) {
            var childObj = this.vie.types.get(list[c]);
            obj.subtypes.push(childObj.hierarchy());
        }
        return obj;
    };

    this.instance = function (attrs, opts) {
        attrs = (attrs)? attrs : {};

        for (var a in attrs) {
            if (a.indexOf('@') !== 0 && !this.attributes.get(a)) {
                throw new Error("Cannot create an instance of " + this.id + " as the type does not allow an attribute '" + a + "'!");
            }
        }

        attrs['@type'] = this.id;

        return new this.vie.Entity(attrs, opts);
    };
        
    // returns the id of the type.
    this.toString = function () {
        return this.id;
    };
    
    
    
};

//basically a convenience class that represents a list of `VIE.Type`s.
//var types = new vie.Types();
VIE.prototype.Types = function () {
        
    this._types = {};
    
    //Adds a `VIE.Type` to the types.
    //This throws an exception if a type with the given id
    //already exists.
    this.add = function (id, attrs) {
        if (this.get(id)) {
            throw "Type '" + id + "' already registered.";
        } 
        else {
            if (typeof id === "string") {
                var t = new this.vie.Type(id, attrs);
                this._types[t.id] = t;
                return t;
            } else if (id instanceof this.vie.Type) {
            	this._types[id.id] = id;
                return id;
            } else {
                throw "Wrong argument to VIE.Types.add()!";
            }
        }
    };
    
    //This is the same as ``this.remove(id); this.add(id, attrs);``
    this.addOrOverwrite = function(id, attrs){
        if (this.get(id)) {
            this.remove(id);
        }
        return this.add(id, attrs);
    };
    
    //Retrieve a type by either it's id or by the type itself
    //(for convenience issues).
    //Returnes **undefined** if no type has been found.
    this.get = function (id) {
        if (!id) {
            return undefined;
        }
        if (typeof id === 'string') {
            var lid = this.vie.namespaces.isUri(id) ? id : this.vie.namespaces.uri(id);
            return this._types[lid];
        } else if (id instanceof this.vie.Type) {
            return this.get(id.id);
        }
        return undefined;
    };
    
    //Removes a type of given id from the type. This also
    // removes all children if their only parent were this
    //type. Furthermore, this removes the link from the
    //super- and subtypes.
    this.remove = function (id) {
        var t = this.get(id);
        if (!t) {
            return this;
        }
        delete this._types[t.id];
        
        var subtypes = t.subtypes.list();
        for (var c = 0; c < subtypes.length; c++) {
            var childObj = subtypes[c];
            if (childObj.supertypes.list().length === 1) {
                //recursively remove all children 
                //that inherit only from this type
                this.remove(childObj);
            } else {
                childObj.supertypes.remove(t.id);
            }
        }
        return t;
    };
    
    //returns an array of all types.
    this.toArray = this.list = function () {
        var ret = [];
        for (var i in this._types) {
            ret.push(this._types[i]);
        }
        return ret;
    };
    
    //Sorts an array of types in their order, given by the
    //inheritance. If 'desc' is given and 'true', the sorted
    //array will be in descendant order.
    this.sort = function (types, desc) {
        var self = this;
        var copy = $.merge([], ($.isArray(types))? types : [ types ]);
        desc = (desc)? true : false;
        
        for (var x = 0; x < copy.length; x++) {
            var a = copy.shift();
            var idx = 0;
            for (var y = 0; y < copy.length; y++) {
                var b = self.vie.types.get(copy[y]);                
                if (b.subsumes(a)) {
                    idx = y;
                }
            }
            copy.splice(idx+1,0,a);
        }
        
        if (!desc) {
            copy.reverse();
        }
        return copy;
    };
};
// File:   Attribute.js <br />
// Author: <a href="http://github.com/neogermi/">Sebastian Germesin</a>
//

// Adding capability of handling attribute structure and inheritance to VIE. 
if (VIE.prototype.Attribute) {
	throw "ERROR: VIE.Attribute is already defined. Please check your installation!";
}
if (VIE.prototype.Attributes) {
	throw "ERROR: VIE.Attributes is already defined. Please check your installation!";
}

//The constructor of a VIE.Attribute. 
//Usage: ``var knowsAttr = new vie.Attribute("knows", ["Person"]);``
//This creates a attribute that describes a **knows** relationship between persons.
VIE.prototype.Attribute = function (id, range, domain) {
    if (id === undefined || typeof id !== 'string') {
        throw "The attribute constructor needs an 'id' of type string! E.g., 'Person'";
    }
    if (range === undefined) {
        throw "The attribute constructor needs 'range'.";
    }
    if (domain === undefined) {
        throw "The attribute constructor needs a 'domain'.";
    }
    
    this._domain = domain;
    this.range = (jQuery.isArray(range))? range : [ range ];
    //TODO! this.count = {};
   
    this.id = this.vie.namespaces.isUri(id) ? id : this.vie.namespaces.uri(id);
    
    // checks, whether the current attribute applies in the given range.
    // If range is a string, this does simply string comparison, if it
    // is a VIE.Type or an ID of a VIE.Type, then inheritance is checked as well.
    this.applies = function (range) {
        if (this.vie.types.get(range)) {
            range = this.vie.types.get(range);
        }
        for (var r = 0; r < this.range.length; r++) {
            var x = this.vie.types.get(this.range[r]);
            if (x === undefined && typeof range === "string") {
                if (range === this.range[r]) {
                    return true;
                }
            }
            else {
                if (range.isof(this.range[r])) {
                    return true;
                }
            }
        }
        return false;
    };
            
};

// basically a convenience class that represents a list of `VIE.Attribute`s.
// As attributes are part of a certain `VIE.Type`, it needs to be passed on
// for inheritance checks:
// var attrs = new vie.Attributes(vie.types.get("Thing"), []);
VIE.prototype.Attributes = function (domain, attrs) {
    
    this.domain = domain;
    
    this._local = {};
    this._attributes = {};
    
    //add a `VIE.Attribute` to the attributes.
    //Either pass a full `VIE.Attribute` object or
    //an id/range pair which then gets transformed into
    //a VIE.Attribute element.
    this.add = function (id, range) {
        if (this.get(id)) {
            throw "Attribute '" + id + "' already registered for domain " + this.domain.id + "!";
        } 
        else {
            if (typeof id === "string") {
                var a = new this.vie.Attribute(id, range, this.domain);
                this._local[a.id] = a;
                return a;
            } else if (id instanceof this.vie.Type) {
                id.domain = this.domain;
                id.vie = this.vie;
                this._local[id.id] = id;
                return id;
            } else {
                throw "Wrong argument to VIE.Types.add()!";
            }
        }
    };
    
    //removes a `VIE.Attribute` from the attributes.
    this.remove = function (id) {
        var a = this.get(id);
        if (a.id in this._local) {
            delete this._local[a.id];
            return a;
        }
        throw "The attribute " + id + " is inherited and cannot be removed from the domain " + this.domain.id + "!";
    };
    
    //retrieve a `VIE.Attribute` from the attributes by it's id.
    this.get = function (id) {
        if (typeof id === 'string') {
            var lid = this.vie.namespaces.isUri(id) ? id : this.vie.namespaces.uri(id);
            return this._inherit()._attributes[lid];
        } else if (id instanceof this.vie.Attribute) {
            return this.get(id.id);
        } else {
            throw "Wrong argument in VIE.Attributes.get()";
        }
    };
    
    // creates a full list of all attributes (local and inherited).
    // the ranges of inherited attributes with the same id will be merged. 
    this._inherit = function () {
        var attributes = jQuery.extend(true, {}, this._local);
        
        var inherited = _.map(this.domain.supertypes.list(),
            function (x) {
               return x.attributes; 
            }
        );

        var add = {};
        var merge = {};
        
        for (var a = 0; a < inherited.length; a++) {
            var attrs = inherited[a].list();
            for (var x = 0; x < attrs.length; x++) {
                var id = attrs[x].id;
                if (!(id in attributes)) {
                    if (!(id in add) && !(id in merge)) {
                        add[id] = attrs[x];
                    }
                    else {
                        if (!merge[id]) {
                            merge[id] = [];
                        }
                        if (id in add) {
                            merge[id] = jQuery.merge(merge[id], add[id].range);
                            delete add[id];
                        }
                        merge[id] = jQuery.merge(merge[id], attrs[x].range);
                        merge[id] = merge[id].unduplicate();
                    }
                }
            }
        }
        
        //add
        jQuery.extend(attributes, add);
        
        // merge
        for (var id in merge) {
            var merged = merge[id];
            var ranges = [];
            for (var r = 0; r < merged.length; r++) {
                var p = this.vie.types.get(merged[r]);
                var isAncestorOf = false;
                if (p) {
                    for (var x = 0; x < merged.length; x++) {
                        if (x === r) {
                            continue;
                        }
                        var c = this.vie.types.get(merged[x]);
                        if (c && c.isof(p)) {
                            isAncestorOf = true;
                            break;
                        }
                    }
                }
                if (!isAncestorOf) {
                    ranges.push(merged[r]);
                }
            }
            attributes[id] = new this.vie.Attribute(id, ranges, this);
        }

        this._attributes = attributes;
        return this;
    };

    // returns an Array of all attributes, combined
    // with the inherited ones.
    this.toArray = this.list = function (range) {
        var ret = [];
        var attributes = this._inherit()._attributes;
        for (var a in attributes) {
            if (!range || attributes[a].applies(range)) {
                ret.push(attributes[a]);
            }
        }
        return ret;
    };
        
    if (!jQuery.isArray(attrs)) {
        attrs = [ attrs ];
    }
    
    for (var a = 0; a < attrs.length; a++) {
        this.add(attrs[a].id, attrs[a].range);
    }
};
// File:   Namespace.js <br />
// Author: <a href="http://github.com/neogermi/">Sebastian Germesin</a>
//

// Adding capability of handling different namespaces to VIE. 

if (VIE.prototype.Namespaces) {
	throw "ERROR: VIE.Namespaces is already defined. Please check your installation!";
}

 
// Usage: ``var namespaces = new VIE.Namespaces("http://base.namespace.com/");``
// We can also bootstrap namespaces by passing an object:
//``var namespaces = new vie.Namespaces("http://base.namespace.com/", {"foaf": "http://xmlns.com/foaf/0.1/"});
VIE.prototype.Namespaces = function (base, namespaces) {
    
	// Within VIE, we can define a base namespace, to support easier syntax for
	// querying types of entities.
	if (!base) {
        throw "Please provide a base namespace!";
    }
	this._base = base;
    
    this.base = function (ns) {
        // getter
        if (!ns) { 
            return this._base;
        }
        // setter
        else if (typeof ns === "string") {
            this._base = ns;
        } else {
            throw "Please provide a valid namespace!";
        }
        return this;
    };
    
    this._namespaces = (namespaces)? namespaces : {};
    
    //Add new namespacs. This also checks if there are
    //prefixes or namespaces already defined to avoid
    //ambiguities in the namespaces. Use `addOrReplace()`
    //to simply overwrite them. 
    this.add = function (k, v) {
        //we can also pass multiple namespaces as an object.
        if (typeof k === "object") {
            for (var k1 in k) {
                this.add(k1, k[k1]);
            }
            return this;
        }
        //use `add("", "http://new.base.namespace/");` to set
        //a new base namespace. This is the same as 
        //`base("http://new.base.namespace/");`
        if (k === "") {
            this.base(v);
        }
        //check if we overwrite existing mappings
        else if (this.containsPrefix(k) && v !== this._namespaces[k]) {
            throw "ERROR: Trying to register namespace prefix mapping (" + k + "," + v + ")!" +
                  "There is already a mapping existing: '(" + k + "," + this.get(k) + ")'!";
        } else {
            jQuery.each(this._namespaces, function (k1,v1) {
                if (v1 === v && k1 !== k) {
                    throw "ERROR: Trying to register namespace prefix mapping (" + k + "," + v + ")!" +
                          "There is already a mapping existing: '(" + k1 + "," + v + ")'!";
                }
            });
        }
        this._namespaces[k] = v;
        
        return this;
    };
    
    // this has the same capabilities as `add(k, v);` but
    // overwrites already exising mappings.
    this.addOrReplace = function (k, v) {
        if (typeof k === "object") {
            for (var k1 in k) {
                this.addOrReplace(k1, k[k1]);
            }
            return this;
        }
        var self = this;
        //check if we overwrite existing mappings
        if (this.containsPrefix(k) && v !== this._namespaces[k]) {
            this.remove(k);
        } else {
            jQuery.each(this._namespaces, function (k1,v1) {
                if (v1 === v && k1 !== k) {
                    self.remove(k1);
                }
            });
        }
        return this.add(k, v);
    };
    
    // get a namespace (or *undefined*) for a given prefix.
    this.get = function (k) {
        if (k === "") {
            return this.base();
        }
        return this._namespaces[k];
    };

    // get a prefix (or *undefined*) for a given namespace.
    this.getPrefix = function (v) {
        jQuery.each(this._namespaces, function (k1,v1) {
            if (v1 === v) {
                return k1;
            }
        });
        return undefined;
    };
    
    // check if a prefix exists. 
    this.containsPrefix = function (k) {
        return (k in this._namespaces);
    };
    
    // check if a namespace exists. 
    this.containsNamespace = function (v) {
        return this.getPrefix(v) !== undefined;
    };

    //update the prefix *p* with the namespace *n*.
	this.update = function (p, n) {
        this._namespaces[p] = n;
        return this;
    };
    
    // remove the namespace with the prefix *p*
    this.remove = function (p) {
        delete this._namespaces[p];
        return this;
    };
    
    // return a copy of the internal structure of the namespaces
    // as key/value pairs.
    this.toObj = function () {
        return jQuery.extend({'' : this._base}, this._namespaces);
    };
    
    // transform a URI into a CURIE with the given
    // namespaces. If *safe* is true, this returns
    // a SCURIE. 
    this.curie = function(uri, safe){
        return VIE.Util.toCurie(uri, safe, this);
    };
    
    // checks whether the given string is a CURIE.
    this.isCurie = function (something) {
        return VIE.Util.isCurie(something, this);
    };
    
    // transforms a CURIE into a URI.
    this.uri = function (curie) {
        return VIE.Util.toUri(curie, this);
    };
    
    // checks wether the given string is a URI.
    this.isUri = VIE.Util.isUri;
};
// Classic VIE API bindings to new VIE
VIE.prototype.ClassicRDFa = function(vie) {
    this.vie = vie;
};

VIE.prototype.ClassicRDFa.prototype = {
    readEntities: function(selector) {
        var jsonEntities = [];
        var entities = this.vie.RDFaEntities.getInstances(selector);
        _.each(entities, function(entity) {
            jsonEntities.push(entity.toJSONLD());
        });
        return jsonEntities;
    },

    findPredicateElements: function(subject, element, allowNestedPredicates) {
        return this.vie.services.rdfa._findPredicateElements(subject, element, allowNestedPredicates);
    },

    getPredicate: function(element) {
        return this.vie.services.rdfa.getElementPredicate(element);
    },

    getSubject: function(element) {
        return this.vie.services.rdfa.getElementSubject(element);
    }
};

VIE.prototype.ClassicRDFaEntities = function(vie) {
    this.vie = vie;
};

VIE.prototype.ClassicRDFaEntities.prototype = {
    getInstances: function(selector) {
        if (!this.vie.services.rdfa) {
            this.vie.use(new this.vie.RdfaService());
        }
        var foundEntities = null;
        var loaded = false;
        this.vie.load({element: selector}).from('rdfa').execute().done(function(entities) {
            foundEntities = entities;
            loaded = true;
        });

        while (!loaded) {
        }

        return foundEntities;
    },

    getInstance: function(selector) {
        var instances = this.getInstances(selector);
        if (instances && instances.length) {
            return instances[0];
        }
        return null;
    }
};

VIE.prototype.ClassicEntityManager = function(vie) {
    this.vie = vie;
    this.entities = this.vie.entities;
};

VIE.prototype.ClassicEntityManager.prototype = {
    getBySubject: function(subject) {
        return this.vie.entities.get(subject);
    },

    getByJSONLD: function(json) {
        return this.vie.entities.addOrUpdate(json);
    },

    initializeCollection: function() {
        return;
    }
};
// File:   DBPediaService.js <br />
// Author: <a href="http://github.com/neogermi/">Sebastian Germesin</a>
//

(function(){
    
VIE.prototype.DBPediaService = function(options) {
    var defaults = {
        name : 'dbpedia',
        namespaces : {
            owl    : "http://www.w3.org/2002/07/owl#",
            yago   : "http://dbpedia.org/class/yago/",
            dbonto : 'http://dbpedia.org/ontology/'
        }
    };
    this.options = jQuery.extend(defaults, options ? options : {});

    this.vie = null; // will be set via VIE.use();
    this.name = this.options.name;
    this.connector = new DBPediaConnector(this.options);

    jQuery.ajaxSetup({
        converters: {"text application/rdf+json": function(s){return JSON.parse(s);}}
    });

};

VIE.prototype.DBPediaService.prototype = {
    init: function() {

       for (var key in this.options.namespaces) {
            try {
                var val = this.options.namespaces[key];
                this.vie.namespaces.add(key, val);
            } catch (e) {
                //this means that the namespace is already in the VIE.namespace
                //ignore for now!
            }
        }
        this.namespaces = new this.vie.Namespaces(this.options.namespaces);

        this.rules = [
             //rule to transform a DBPedia person into a VIE person
             {
                'left' : [
                    '?subject a <http://dbpedia.org/ontology/Person>'
                 ],
                 'right': function(ns){
                     return function(){
                         return jQuery.rdf.triple(this.subject.toString() +
                         ' a <http://schema.org/Person>', {
                             namespaces: ns
                         });
                     };
                 }(this.namespaces.toObj())
             }
        ];
    },

    // VIE API load implementation
    load: function(loadable){
        var correct = loadable instanceof this.vie.Loadable;
        if (!correct) {throw "Invalid Loadable passed";}

        var service = this;
        var entity = loadable.options.entity;
        if (!entity) {
            //console.warn("DBPediaConnector: No entity to look for!");
            loadable.resolve([]);
        }
        var success = function (results) {
            var id = entity.replace(/^</, '').replace(/>$/, '');

            if (results[id]) {
                var e = service.vie.entities.get(entity);
                if (!e) {
                    var attrs = {
                        '@subject': entity,
                        '@type': results[id]["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"]
                    };
                    delete results[id]["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"];
                    jQuery.extend(attrs, results[id]);
                    service.vie.entities.add(attrs);
                    e = service.vie.entities.get(entity);
                }
                loadable.resolve([e]);
            } else {
                loadable.reject(undefined);
            }
        };
        var error = function (e) {
            loadable.reject(e);
        };
        this.connector.load(entity, success, error);
    }
};
var DBPediaConnector = function(options){
    this.options = options;
};

DBPediaConnector.prototype = {

    load: function (uri, success, error, options) {
        if (!options) { options = {}; }
        var url = uri
        .replace(/^</, '').replace(/>$/, '')
        .replace('resource', 'data') + ".jrdf";

        var format = options.format || "application/rdf+json";

        if (typeof exports !== "undefined" && typeof process !== "undefined") {
            // We're on Node.js, don't use jQuery.ajax
            return this.loadNode(url, success, error, options, format);
        }

        jQuery.ajax({
            success: function(response){
                success(response);
            },
            error: error,
            type: "GET",
            url: url,
            dataType: "jsonp"
        });
    },

    loadNode: function (uri, success, error, options, format) {
        var request = require('request');
        var r = request({
            method: "GET",
            uri: uri,
            headers: {
                Accept: format
            }
        }, function(error, response, body) {
            success({results: JSON.parse(body)});
        });
        r.end();
    }
};
})();

/* TODO: give same functionality as RdfaService or remove

VIE.prototype.RdfaRdfQueryService = function(options) {
    if (!options) {
        options = {};
    }
    this.vie = null;
    this.name = 'rdfa';

    if (typeof jQuery.rdf !== 'function') {
        throw "RdfQuery is not loaded";
    }
};

VIE.prototype.RdfaRdfQueryService.prototype = {

    load: function(loadable){
        var service = this;
        var correct = loadable instanceof this.vie.Loadable;
        if (!correct) {
            throw "Invalid Loadable passed";
        }
        
        var element = loadable.options.element ? loadable.options.element : jQuery(document);
        
        var rdf = jQuery(element).rdfa();
        
        jQuery.each(jQuery(element).xmlns(), function(prefix, ns){
            service.vie.namespaces.addOrReplace(prefix, ns.toString());
        });
        
        var entities = {}
        rdf.where('?subject ?property ?object').each(function(){
            var subject = this.subject.toString();
            if (!entities[subject]) {
                entities[subject] = {
                    '@subject': subject
                };
            }
            var propertyUri = this.property.toString();
            
            var val;
            if (typeof this.object.value === "string") {
                val = this.object.value;
            }
            else {
                val = this.object.toString();
            }
            if (!entities[subject][propertyUri]) {
                entities[subject][propertyUri] = val;
            }
            else 
                if (!_.isArray(entities[subject][propertyUri])) {
                    entities[subject][propertyUri] = [entities[subject][propertyUri]];
                    entities[subject][propertyUri].push(val);
                }
                else {
                    entities[subject][propertyUri].push(val);
                }
        });
        
        var vieEntities = [];
        jQuery.each(entities, function(){
            vieEntities.push(service.vie.entities.addOrUpdate(this));
        });
        loadable.resolve(vieEntities);
    }
};


*/VIE.prototype.RdfaService = function(options) {
    if (!options) {
        options = {};
    }
    this.vie = null;
    this.name = 'rdfa';
    this.subjectSelector = options.subjectSelector ? options.subjectSelector : "[about],[typeof],[src],[href],html";
    this.predicateSelector = options.predicateSelector ? options.predicateSelector : "[property],[rel]";
    this.views = [];
};

VIE.prototype.RdfaService.prototype = {
    
    analyze: function(analyzable) {
        // in a certain way, analyze is the same as load
        var service = this;

        var correct = analyzable instanceof this.vie.Analyzable;
        if (!correct) {throw "Invalid Analyzable passed";}

        return this.load(new this.vie.Loadable({element : analyzable.options.element}));
    },
        
    load : function(loadable) {
        var service = this;
        var correct = loadable instanceof this.vie.Loadable;
        if (!correct) {
            throw "Invalid Loadable passed";
        }

        var element;
        if (!loadable.options.element) {
            if (typeof document === 'undefined') { 
                return loadable.resolve([]);
            }
            element = jQuery(document);
        } else {
            element = loadable.options.element;
        }
    
        var ns = this.xmlns(element);
        for (var prefix in ns) {
            this.vie.namespaces.addOrReplace(prefix, ns[prefix]);
        }
        
        var entities = [];
        jQuery(this.subjectSelector, element).add(jQuery(element).filter(this.subjectSelector)).each(function() {
            var entity = service._readEntity(jQuery(this));
            if (entity) {
                entities.push(entity);
            }
        });
        loadable.resolve(entities);
    },

    save : function(savable) {
        var correct = savable instanceof this.vie.Savable;
        if (!correct) {
            throw "Invalid Savable passed";
        }
    
        if (!savable.options.element) {
            // FIXME: we could find element based on subject
            throw "Unable to write entity to RDFa, no element given";
        }
    
        if (!savable.options.entity) {
            throw "Unable to write to RDFa, no entity given";
        }
    
        this._writeEntity(savable.options.entity, savable.options.element);
        savable.resolve();
    },
    
    _readEntity : function(element) {
        var subject = this.getElementSubject(element);
        var type = this._getElementType(element);
        var predicate, value, valueCollection;
        
        var entity = this._readEntityPredicates(subject, element, false);
        //if (jQuery.isEmptyObject(entity)) {
        //    return null;
        //}

        for (predicate in entity) {
            value = entity[predicate];
            if (!_.isArray(value)) {
                continue;
            }
            valueCollection = new this.vie.Collection();
            _.each(value, function(valueItem) {
                valueCollection.addOrUpdate({'@subject': valueItem});
            });
            entity[predicate] = valueCollection;
        }
    
        entity['@subject'] = subject;
        if (type) {
            entity['@type'] = type;
        }
        
        var entityInstance = new this.vie.Entity(entity);
        entityInstance = this.vie.entities.addOrUpdate(entityInstance);
        this._registerEntityView(entityInstance, element);
        return entityInstance;
    },
    
    _writeEntity : function(entity, element) {
        var service = this;
        this._findPredicateElements(this.getElementSubject(element), element, true).each(function() {
            var predicateElement = jQuery(this);
            var predicate = service.getElementPredicate(predicateElement);
            if (!entity.has(predicate)) {
                return true;
            }
    
            var value = entity.get(predicate);
            if (value === service.readElementValue(predicate, predicateElement)) {
                return true;
            }
    
            service.writeElementValue(predicate, predicateElement, value);
        });
        return true;
    },
    
    _getViewForElement : function(element, collectionView) {
        var viewInstance;
        jQuery.each(this.views, function() {
            if (this.el.get(0) === element.get(0)) {
                if (collectionView && !this.template) {
                    return true;
                }
                viewInstance = this;
                return false;
            }
        });
        return viewInstance;
    },
    
    _registerEntityView : function(entity, element) {
        var service = this;
        var viewInstance = this._getViewForElement(element);
        if (viewInstance) {
            return viewInstance;
        }
    
        viewInstance = new this.vie.view.Entity({
            model: entity,
            el: element,
            tagName: element.get(0).nodeName,
            vie: this.vie,
            service: this.name
        });
        this.views.push(viewInstance);
    
        // Find collection elements and create collection views for them
        _.each(entity.attributes, function(value, predicate) {
            var attributeValue = entity.fromReference(entity.get(predicate));
            if (attributeValue instanceof service.vie.Collection) {
                jQuery.each(service.getElementByPredicate(predicate, element), function() {
                    service._registerCollectionView(attributeValue, jQuery(this));
                });
            }
        });
        return viewInstance;
    },
    
    _registerCollectionView : function(collection, element) {
        var viewInstance = this._getViewForElement(element, true);
        if (viewInstance) {
            return viewInstance;
        }
    
        var entityTemplate = element.children(':first-child');
    
        viewInstance = new this.vie.view.Collection({
            collection: collection,
            model: collection.model,
            el: element,
            template: entityTemplate,
            service: this,
            tagName: element.get(0).nodeName
        });
        this.views.push(viewInstance);
        return viewInstance;
    },
    
    _getElementType : function (element) {
        var type;
        if (jQuery(element).attr('typeof')) {
            type = jQuery(element).attr('typeof');
            if (type.indexOf("://") !== -1) {
                return "<" + type + ">";
            } else {
                return type;
            }
        }
        return null;
    },
    
    getElementSubject : function(element) {
        var service = this;
        
        if (typeof document !== 'undefined') {
            if (element === document) {
                return document.baseURI;
            }
        }
        var subject = undefined;
        jQuery(element).closest(this.subjectSelector).each(function() {
            if (jQuery(this).attr('about') !== undefined) {
                subject = jQuery(this).attr('about');
                return true;
            }
            if (jQuery(this).attr('src')) {
                subject = jQuery(this).attr('src');
                return true;
            }
            if (jQuery(this).attr('typeof')) {
                subject = VIE.Util.blankNodeID();
                //subject = this;
                return true;
            }
    
            // We also handle baseURL outside browser context by manually
            // looking for the `<base>` element inside HTML head.
            if (jQuery(this).get(0).nodeName === 'HTML') {
                jQuery(this).find('base').each(function() {
                    subject = jQuery(this).attr('href');
                });
            }
        });
                
        if (!subject) {
            return undefined;
        }
                
        if (typeof subject === 'object') {
            return subject;
        }
    
        return (subject.indexOf("_:") === 0)? subject : "<" + subject + ">";
    },
    
    setElementSubject : function(subject, element) {
        if (jQuery(element).attr('src')) {
            return jQuery(element).attr('src', subject);
        }
        return jQuery(element).attr('about', subject);
    },
    
    getElementPredicate : function(element) {
        var predicate;
        predicate = element.attr('property');
        if (!predicate) {
            predicate = element.attr('rel');
        }
        return predicate;
    },
    
    getElementBySubject : function(subject, element) {
        var service = this;
        return jQuery(element).find(this.subjectSelector).add(jQuery(element).filter(this.subjectSelector)).filter(function() {
            if (service.getElementSubject(jQuery(this)) !== subject) {
                return false;
            }
     
            return true;
        });
    },
    
    getElementByPredicate : function(predicate, element) {
        var service = this;
        var subject = this.getElementSubject(element);
        return jQuery(element).find(this.predicateSelector).add(jQuery(element).filter(this.predicateSelector)).filter(function() {
            var foundPredicate = service.getElementPredicate(jQuery(this));
            if (service.vie.namespaces.curie(foundPredicate) !== service.vie.namespaces.curie(predicate)) {
                return false;
            }
    
            if (service.getElementSubject(jQuery(this)) !== subject) {
                return false;
            }
     
            return true;
        });
    },
    
    _readEntityPredicates : function(subject, element, emptyValues) {
        var service = this;
        var entityPredicates = {};
    
        this._findPredicateElements(subject, element, true).each(function() {
            var predicateElement = jQuery(this);
            var predicate = service.getElementPredicate(predicateElement);
            var value = service.readElementValue(predicate, predicateElement);
    
            if (value === null && !emptyValues) {
                return;
            }
   
            entityPredicates[predicate] = value;
        });
    
        if (jQuery(element).get(0).tagName !== 'HTML') {
            jQuery(element).parent('[rev]').each(function() {
                entityPredicates[jQuery(this).attr('rev')] = service.getElementSubject(this); 
            });
        }
    
        return entityPredicates;
    },
    
    _findPredicateElements : function(subject, element, allowNestedPredicates) {
        var service = this;
        return jQuery(element).find(this.predicateSelector).add(jQuery(element).filter(this.predicateSelector)).filter(function() {
            if (service.getElementSubject(this) !== subject) {
                return false;
            }
            if (!allowNestedPredicates) {
                if (!jQuery(this).parents('[property]').length) {
                    return true;
                }
                return false;
            }
    
            return true;
        });
    },
    
    readElementValue : function(predicate, element) {
        // The `content` attribute can be used for providing machine-readable
        // values for elements where the HTML presentation differs from the
        // actual value.
        var content = element.attr('content');
        if (content) {
            return content;
        }
                
        // The `resource` attribute can be used to link a predicate to another
        // RDF resource.
        var resource = element.attr('resource');
        if (resource) {
            return "<" + resource + ">";
        }
                
        // `href` attribute also links to another RDF resource.
        var href = element.attr('href');
        if (href && element.attr('rel') === predicate) {
            return "<" + href + ">";
        }
    
        // If the predicate is a relation, we look for identified child objects
        // and provide their identifiers as the values. To protect from scope
        // creep, we only support direct descentants of the element where the
        // `rel` attribute was set.
        if (element.attr('rel')) {
            var value = [];
            var service = this;
            jQuery(element).children(this.subjectSelector).each(function() {
                value.push(service.getElementSubject(this));
            });
            return value;
        }
    
        // If none of the checks above matched we return the HTML contents of
        // the element as the literal value.
        return element.html();
    },
    
    writeElementValue : function(predicate, element, value) {
        //TODO: this is a hack, please fix!
        if (value instanceof Array && value.length > 0) {
            value = value[0];
        }
        
        // The `content` attribute can be used for providing machine-readable
        // values for elements where the HTML presentation differs from the
        // actual value.
        var content = element.attr('content');
        if (content) {
            element.attr('content', value);
            return;
        }
                
        // The `resource` attribute can be used to link a predicate to another
        // RDF resource.
        var resource = element.attr('resource');
        if (resource) {
            element.attr('resource', value);
        }
    
        // Property has inline value. Change the HTML contents of the property
        // element to match the new value.
        element.html(value);
    },
    
    // mostyl copied from http://code.google.com/p/rdfquery/source/browse/trunk/jquery.xmlns.js
    xmlns : function (elem) {
        var $elem;
        if (!elem) {
            if (typeof document === 'undefined') { 
                return {};
            }
            $elem = jQuery(document);
        } else {
            $elem = jQuery(elem);
        }
        
        var obj = {};
        
        $elem.each(function (i, e) {
            if (e.attributes && e.attributes.getNamedItemNS) {
                for (i = 0; i < e.attributes.length; i += 1) {
                    var attr = e.attributes[i];
                    if (/^xmlns(:(.+))?$/.test(attr.nodeName)) {
                        var prefix = /^xmlns(:(.+))?$/.exec(attr.nodeName)[2] || '';
                        var value = attr.nodeValue;
                        if (prefix === '' || value !== '') {
                            obj[prefix] = attr.nodeValue;
                        }
                    }
                }
            }
        });
        
        return obj;
    }

};
// File:   StanbolService.js
// Author: <a href="mailto:sebastian.germesin@dfki.de">Sebastian Germesin</a>
// Author: <a href="mailto:szaby.gruenwald@salzburgresearch.at">Szaby Gruenwald</a>
//
(function(){
VIE.prototype.StanbolService = function(options) {
    var defaults = {
        name : 'stanbol',
        url: 'http://dev.iks-project.eu:8080/',
        defaultProxyUrl : "../utils/proxy/proxy.php",
        namespaces : {
            semdeski : "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#",
            semdeskf : "http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#",
            skos: "http://www.w3.org/2004/02/skos/core#",
            foaf: "http://xmlns.com/foaf/0.1/",
            opengis: "http://www.opengis.net/gml/",
            dbpedia: "http://dbpedia.org/ontology/",
            owl : "http://www.w3.org/2002/07/owl#",
            geonames : "http://www.geonames.org/ontology#",
            enhancer : "http://fise.iks-project.eu/ontology/",
            entityhub: "http://www.iks-project.eu/ontology/rick/model/",
            entityhub2: "http://www.iks-project.eu/ontology/rick/query/",
            rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            rdfs: "http://www.w3.org/2000/01/rdf-schema#",
            dc  : 'http://purl.org/dc/terms/',
            foaf: 'http://xmlns.com/foaf/0.1/',
            schema: 'http://schema.org/',
            geo: 'http://www.w3.org/2003/01/geo/wgs84_pos#'
        }
    };
    this.options = jQuery.extend(true, defaults, options ? options : {});

    this.vie = null; // will be set via VIE.use();
    this.name = this.options.name;
    this.connector = new StanbolConnector(this.options);
    
    jQuery.ajaxSetup({
        converters: {"text application/rdf+json": function(s){return JSON.parse(s);}}
    });

};

VIE.prototype.StanbolService.prototype = {
    init: function(){
        
        for (var key in this.options.namespaces) {
            try {
                var val = this.options.namespaces[key];
                this.vie.namespaces.add(key, val);
            } catch (e) {
                //this means that the namespace is already in the VIE.namespace
                //ignore for now!
            }
        }
        this.namespaces = new this.vie.Namespaces(this.vie.namespaces.base(), this.options.namespaces);
        
        this.rules = [
            //rule to add backwards-relations to the triples
            //this makes querying for entities a lot easier!
            {'left' : [
                '?subject a <http://fise.iks-project.eu/ontology/EntityAnnotation>',
                '?subject enhancer:entity-type ?type',
                '?subject enhancer:confidence ?confidence',
                '?subject enhancer:entity-reference ?entity',
                '?subject dc:relation ?relation',
                '?relation a <http://fise.iks-project.eu/ontology/TextAnnotation>',
                '?relation enhancer:selected-text ?selected-text',
                '?relation enhancer:selection-context ?selection-context',
                '?relation enhancer:start ?start',
                '?relation enhancer:end ?end'
            ],
             'right' : [
                 '?entity a ?type',
                 '?entity enhancer:hasTextAnnotation ?relation',
                 '?entity enhancer:hasEntityAnnotation ?subject'
             ]
             },
             //rule(s) to transform a Stanbol person into a VIE person
             {
                'left' : [
                    '?subject a dbpedia:Person',
                    '?subject rdfs:label ?label'
                 ],
                 'right': function(ns){
                     return function(){
                         return [
                             jQuery.rdf.triple(this.subject.toString(),
                                 'a',
                                 '<' + ns.base() + 'Person>', {
                                     namespaces: ns.toObj()
                                 }),
                             jQuery.rdf.triple(this.subject.toString(),
                                 '<' + ns.base() + 'name>',
                                 this.label, {
                                     namespaces: ns.toObj()
                                 })
                             ];
                     };
                 }(this.namespaces)
             },
             {
                 'left' : [
                     '?subject a dbpedia:Place',
                     '?subject rdfs:label ?label'
                  ],
                  'right': function(ns) {
                      return function() {
                          return [
                          jQuery.rdf.triple(this.subject.toString(),
                              'a',
                              '<' + ns.base() + 'Place>', {
                                  namespaces: ns.toObj()
                              }),
                          jQuery.rdf.triple(this.subject.toString(),
                                  '<' + ns.base() + 'name>',
                              this.label.toString(), {
                                  namespaces: ns.toObj()
                              })
                          ];
                      };
                  }(this.namespaces)
              },
        ];
        
        this.vie.types.addOrOverwrite('enhancer:EntityAnnotation', [
            //TODO: add attributes
        ]).inherit("Thing");
        this.vie.types.addOrOverwrite('enhancer:TextAnnotation', [
            //TODO: add attributes
        ]).inherit("Thing");
        this.vie.types.addOrOverwrite('enhancer:Enhancement', [
            //TODO: add attributes
        ]).inherit("Thing");
    },
    // VIE API analyze implementation
    analyze: function(analyzable) {
        var service = this;

        var correct = analyzable instanceof this.vie.Analyzable;
        if (!correct) {throw "Invalid Analyzable passed";}

        var element = analyzable.options.element ? analyzable.options.element : jQuery('body');

        var text = service._extractText(element);

        if (text.length > 0) {
            var service = this;
            //query enhancer with extracted text
            var success = function (results) {
                _.defer(function(){
                    var entities = service._enhancer2Entities(service, results);
                    analyzable.resolve(entities);
                });
            };
            var error = function (e) {
                analyzable.reject(e);
            };

            this.connector.analyze(text, success, error);

        } else {
            console.warn("No text found in element.");
            analyzable.resolve([]);
        }

    },
    
    // VIE API load implementation
    // Runs a Stanbol entityhub find
    find: function(findable){
        var correct = findable instanceof this.vie.Findable;
        if (!correct) {throw "Invalid Findable passed";}
        var service = this;
        // The term to find, * as wildcard allowed
        var term = escape(findable.options.term);
        if(!term){
            console.warn("StanbolConnector: No term to look for!");
            findable.resolve([]);
        };
        var limit = (typeof findable.options.limit === "undefined") ? 20 : findable.options.limit;
        var offset = (typeof findable.options.offset === "undefined") ? 0 : findable.options.offset;
        var success = function (results) {
            _.defer(function(){
                var entities = service._enhancer2Entities(service, results);
                findable.resolve(entities);
            });
        };
        var error = function (e) {
            findable.reject(e);
        };
        this.connector.find(term, limit, offset, success, error);
    },
    
    // VIE API load implementation
    // Runs a Stanbol entityhub find
    load: function(loadable){
        var correct = loadable instanceof this.vie.Loadable;
        if (!correct) {throw "Invalid Loadable passed";}
        var service = this;
        
        var entity = loadable.options.entity;
        if(!entity){
            console.warn("StanbolConnector: No entity to look for!");
            loadable.resolve([]);
        };
        var success = function (results) {
            _.defer(function(){
                var entities = service._enhancer2Entities(service, results);
                loadable.resolve(entities);
            });
        };
        var error = function (e) {
            loadable.reject(e);
        };
        this.connector.load(entity, success, error);
    },
    
    _extractText: function (element) {
        if (element.get(0) && 
            element.get(0).tagName && 
            (element.get(0).tagName == 'TEXTAREA' ||
            element.get(0).tagName == 'INPUT' && element.attr('type', 'text'))) {
            return element.get(0).val();
        }
        else {
            var res = element
                .text()    //get the text of element
                .replace(/\s+/g, ' ') //collapse multiple whitespaces
                .replace(/\0\b\n\r\f\t/g, ''); // remove non-letter symbols
            return jQuery.trim(res);
        }
    },

    _enhancer2Entities: function (service, results) {
        //transform data from Stanbol into VIE.Entities

        if (typeof jQuery.rdf !== 'function') {
            return this._enhancer2EntitiesNoRdfQuery(service, results);
        }
        var rdf = jQuery.rdf().load(results, {});

        //execute rules here!
        if (service.rules) {
            var rules = jQuery.rdf.ruleset();
            for (var prefix in service.namespaces.toObj()) {
                if (prefix !== "") {
                	rules.prefix(prefix, service.namespaces.get(prefix));
                }
            }
            for (var i = 0; i < service.rules.length; i++) {
                rules.add(service.rules[i]['left'], service.rules[i]['right']);
            }
            rdf = rdf.reason(rules, 10); // execute the rules only 10 times to avoid looping
        }
        var entities = {};
        rdf.where('?subject ?property ?object').each(function() {
            var subject = this.subject.toString();
            if (!entities[subject]) {
                entities[subject] = {
                    '@subject': subject,
                    '@context': service.namespaces.toObj(),
                    '@type': []
                };
            }
            var propertyUri = this.property.toString();
            var propertyCurie;

            propertyUri = propertyUri.substring(1, propertyUri.length - 1);
            try {
                property = jQuery.createCurie(propertyUri, {namespaces: service.namespaces.toObj()});
            } catch (e) {
                property = propertyUri;
                console.warn(propertyUri + " doesn't have a namespace definition in '", service.namespaces.toObj());
            }
            entities[subject][property] = entities[subject][property] || [];

            function getValue(rdfQueryLiteral){
                if(typeof rdfQueryLiteral.value === "string"){
                    if (rdfQueryLiteral.lang)
                        return rdfQueryLiteral.toString();
                    else 
                        return rdfQueryLiteral.value;
                    return rdfQueryLiteral.value.toString();
                } else if (rdfQueryLiteral.type === "uri"){
                    return rdfQueryLiteral.toString();
                } else {
                    return rdfQueryLiteral.value;
                }
            }
            entities[subject][property].push(getValue(this.object));
        });

        _(entities).each(function(ent){
            ent["@type"] = ent["@type"].concat(ent["rdf:type"]);
            delete ent["rdf:type"];
            _(ent).each(function(value, property){
                if(value.length === 1){
                    ent[property] = value[0];
                }
            });
        });

        var vieEntities = [];
        jQuery.each(entities, function() {
            var entityInstance = new service.vie.Entity(this);
            entityInstance = service.vie.entities.addOrUpdate(entityInstance);
            vieEntities.push(entityInstance);
        });
        return vieEntities; 
    },

    _enhancer2EntitiesNoRdfQuery: function (service, results) {
        jsonLD = [];
        _.forEach(results, function(value, key) {
            var entity = {};
            entity['@subject'] = '<' + key + '>';
            _.forEach(value, function(triples, predicate) {
                predicate = '<' + predicate + '>';
                _.forEach(triples, function(triple) {
                    if (triple.type === 'uri') {
                        triple.value = '<' + triple.value + '>';
                    }

                    if (entity[predicate] && !_.isArray(entity[predicate])) {
                        entity[predicate] = [entity[predicate]];
                    }

                    if (_.isArray(entity[predicate])) {
                        entity[predicate].push(triple.value);
                        return;
                    }
                    entity[predicate] = triple.value;
                });
            });
            jsonLD.push(entity);
        });
        return jsonLD;
    }
};

var StanbolConnector = function(options){
    this.options = options;
    this.baseUrl = options.url.replace(/\/$/, '');
    this.enhancerUrlPrefix = "/engines";
    this.entityhubUrlPrefix = "/entityhub";
    //TODO: this.ontonetUrlPrefix = "/ontonet";
    //TODO: this.rulesUrlPrefix = "/rules";
    //TODO: this.factstoreUrlPrefix = "/factstore";
};
StanbolConnector.prototype = {
    
    analyze: function(text, success, error, options) {
        if (!options) { options = {}; }
        var enhancerUrl = this.baseUrl + this.enhancerUrlPrefix;
        var proxyUrl = this._proxyUrl();
        var format = options.format || "application/rdf+json";

        if (typeof exports !== "undefined" && typeof process !== "undefined") {
            // We're on Node.js, don't use jQuery.ajax
            return this.analyzeNode(enhancerUrl, text, success, error, options, format);
        }
        
        jQuery.ajax({
            success: function(response){
                success(response);
            },
            error: error,
            type: "POST",
            url: proxyUrl || enhancerUrl,
            data: (proxyUrl) ? {
                    proxy_url: enhancerUrl, 
                    content: text,
                    verb: "POST",
                    format: format
                } : text,
            dataType: format,
            contentType: proxyUrl ? undefined : "text/plain",
            accepts: {"application/rdf+json": "application/rdf+json"}

        });
    },

    analyzeNode: function(url, text, success, error, options, format) {
        var request = require('request');
        var r = request({
            method: "POST",
            uri: url,
            body: text,
            headers: {
                Accept: format
            }
        }, function(error, response, body) {
            success({results: JSON.parse(body)});
        });
        r.end();
    },
    
    load: function (uri, success, error, options) {
        if (!options) { options = {}; }
        uri = uri.replace(/^</, '').replace(/>$/, '');
        var url = this.baseUrl + this.entityhubUrlPrefix + "/sites/entity?id=" + escape(uri);
        var proxyUrl = this._proxyUrl();
        var format = options.format || "application/rdf+json";
        
        jQuery.ajax({
            success: function(response){
                success(response);
            },
            error: error,
            type: (proxyUrl) ? "POST" : "GET",
            url: proxyUrl || url,
            data: (proxyUrl) ? {
                    proxy_url: url, 
                    content: "",
                    verb: "GET",
                    format: format
                } : null,
            dataType: format,
            contentType: proxyUrl ? undefined : "text/plain",
            accepts: {"application/rdf+json": "application/rdf+json"}
        });
    },
    
    find: function (term, limit, offset, success, error, options) {
        // curl -X POST -d "name=Bishofsh&limit=10&offset=0" http://localhost:8080/entityhub/sites/find
        if (!options) { options = {}; }
        if (offset == null) {
            offset = 0;
        }
        if (limit == null) {
            limit = 10;
        }
        
        var url = this.baseUrl + this.entityhubUrlPrefix + "/sites/find";
        var proxyUrl = this._proxyUrl();
        var format = options.format || "application/rdf+json";
        
        jQuery.ajax({
            success: function(response){
                success(response);
            },
            error: error,
            type: "POST",
            url: proxyUrl || url,
            data: (proxyUrl) ? {
                    proxy_url: url, 
                    content: {
                        name : term,
                        limit : limit,
                        offset: offset
                    },
                    verb: "POST",
                    format: format,
                    type: "text/plain"
                } : "name=" + term + "&limit=" + limit + "&offset=" + offset,
            dataType: format,
            accepts: {"application/rdf+json": "application/rdf+json"}
        });
    },
    
    _proxyUrl: function(){
        this.proxyUrl = "";
        if(this.baseUrl.indexOf(":") !== -1 && !this.options.proxyDisabled){
            return this.options.proxyUrl || this.options.defaultProxyUrl;
        } else {
            return '';
        }
    }
};
})();

if (!VIE.prototype.view) {
    VIE.prototype.view = {};
}

VIE.prototype.view.Collection = Backbone.View.extend({
    // Ensure the collection view gets updated when items get added or removed
    initialize: function() {
        this.template = this.options.template;
        this.service = this.options.service;
        if (!this.service) {
            throw "No RDFa service provided to the Collection View";
        }

        this.entityViews = {};
        _.bindAll(this, 'addItem', 'removeItem', 'refreshItems');
        this.collection.bind('add', this.addItem);
        this.collection.bind('remove', this.removeItem);

        // Make the view aware of existing entities in collection
        var view = this;
        this.collection.forEach(function(entity) {
            view.registerItem(entity, view.collection);
        });
    },

    addItem: function(entity, collection) {
        if (collection !== this.collection) {
            return;
        }

        if (!this.template || this.template.length === 0) {
            return;
        }

        var entityView = this.service._registerEntityView(entity, this.cloneElement(this.template));
        var entityElement = entityView.render().el;
        if (entity.id) {
            this.service.setElementSubject(entity.getSubjectUri(), entityElement);
        }

        // TODO: Ordering
        this.el.append(entityElement);

        // Ensure we catch all inferred predicates. We add these via JSONLD
        // so the references get properly Collectionized.
        var service = this.service;
        jQuery(entityElement).parent('[rev]').each(function() {
            var predicate = jQuery(this).attr('rev');
            var relations = {};
            relations[predicate] = new service.vie.Collection();
            relations[predicate].addOrUpdate(service.vie.entities.get(service.getElementSubject(this)));
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

        this.entityViews[entity.cid].el.remove();
        delete(this.entityViews[entity.cid]);
    },

    refreshItems: function(collection) {
        var view = this;
        jQuery(this.el).empty();
        collection.forEach(function(entity) {
            view.addItem(entity, collection);
        });
    },

    cloneElement: function(element) {
        var newElement = jQuery(element).clone(false);
        var service = this.service;
        if (typeof newElement.attr('about') !== 'undefined') {
            // Direct match with container
            newElement.attr('about', '');
        }
        newElement.find('[about]').attr('about', '');
        var subject = this.service.getElementSubject(newElement);
        service._findPredicateElements(subject, newElement, false).each(function() {
            service.writeElementValue(null, jQuery(this), '');
        });
        return newElement;
    }
});
if (!VIE.prototype.view) {
    VIE.prototype.view = {};
}

VIE.prototype.view.Entity = Backbone.View.extend({
    initialize: function(options) {
        this.service = options.service ? options.service : 'rdfa';
        this.vie = options.vie;

        // Ensure view gets updated when properties of the Entity change.
        _.bindAll(this, 'render');
        this.model.bind('change', this.render);
    },

    // Rendering a view means writing the properties of the Entity back to
    // the element containing our RDFa annotations.
    render: function() {
        this.vie.save({
                element: this.el, 
                entity: this.model
            }).
            to(this.service).
            execute();
        return this;
    }
}); })();
