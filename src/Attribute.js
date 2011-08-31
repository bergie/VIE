// File:   Attribute.js
// Author: <a href="mailto:sebastian.germesin@dfki.de">Sebastian Germesin</a>
//

Zart.prototype.Attribute = function (id, range, domain, options) {
    if (id === undefined || typeof id !== 'string') {
        throw "The attribute constructor needs an 'id' of type string! E.g., 'Person'";
    }
    if (range === undefined) {
        throw "The attribute constructor needs 'range'.";
    }
    if (domain === undefined) {
        throw "The attribute constructor needs a 'domain'.";
    }
    if (!options || !options.zart || !(options.zart instanceof Zart)) {
        throw "Zart.Attribute needs an instance of Zart given.";
    }
    this.zart = options.zart;
    
    this._domain = domain;
    this.range = (jQuery.isArray(range))? range : [ range ];
   
    this.id = '<' + this.zart.defaultNamespace + id + '>';
    this.sid = id;
    
    this.extend = function (attr) {
        //TODO: returns a new attribute
    };
        
    this.remove = function () {
        return this.domain.attributes.remove(this);
    };
    
};

Zart.prototype.Attributes = function (domain, attrs, options) {
    
    this.zart = options.zart;
    
    this._domain = domain;
    
    this._attributes = {};
    
    this.add = function (id, range) {
        if (this.get(id)) {
            return this.get(id);
        } else {
            var options = {
                zart : this.zart
            };
            var a = new this.zart.Attribute(id, range, this._domain, options);
            this._attributes[a.id] = a;
            return a;
        }
    };
    
    this.extend = function (attributes) {
        if (!jQuery.isArray(attributes)) {
            return this.extend([attributes]);
        }
        for (var a in attributes) {
            var attr = attributes[a];
            if (attr instanceof this.zart.Attributes) {
                //TODO
                //throw "Not yet implemented!";
                return this;
            } else {
                throw "Wrong argument given to Zart.Attributes.extend()!";
            }
        }
        
    };
    
    this.get = function (id) {
        if (typeof id === 'string') {
            var a = (this._attributes[id])? 
                this._attributes[id] : 
                this._attributes['<' + this.zart.defaultNamespace + id + '>'];
            if (a) {
                return a;
            } else {
                var a = undefined;
                var supertypes = this._domain.supertypes();
                for (var s in supertypes) {
                    a = supertypes[s].attributes.get(id);
                }
                return a;
            }
        } else if (id instanceof this.zart.Attribute) {
            return this.get(id.id);
        } else {
            throw "Wrong argument in Zart.Attributes.get()";
        }
    };
    
    this.remove = function (id) {
        var a = this.get(id);
        delete this._attributes[a.id];
        return a;
    };
    
    // recursively include (and merge) the inherited attributes
    this.list = function (range) {
        var ret = {};
        var supertypes = this._domain.supertypes();
        for (var s in supertypes) {
            var sTypeObj = supertypes[s];
            var sTypeObjAttrs = sTypeObj.attributes.list();
            for (var a in sTypeObjAttrs) {
                if (!ret[sTypeObjAttrs[a].id]) {
                    ret[sTypeObjAttrs[a].id] = sTypeObjAttrs[a];
                } else {
                    var oldRange = ret[sTypeObjAttrs[a].id].range;
                    var newRange = sTypeObjAttrs[a].range;
                    //TODO: merge!!!
                    
                    ret[sTypeObjAttrs[a].id] = sTypeObjAttrs[a];
                }
            }
        }
        for (var a in this._attributes) {
            if (!ret[this._attributes[a].id]) {
                ret[this._attributes[a].id] = this._attributes[a];
            } else {
                ret[this._attributes[a].id] = this._attributes[a];
            }
        }
        var x = [];
        for (var r in ret) {
            x.push(ret[r]);
        }
        return x;
    };
    
    for (var a in attrs) {
        this.add(attrs[a].id, attrs[a].range);
    }
};