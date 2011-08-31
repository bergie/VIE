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
    
    this.extend = function (range) {
        //TODO: returns a new attribute
        throw "Not yet implemented!";
    };
        
    this.applies = function (range) {
        if (this.zart.types.get(range)) {
            range = this.zart.types.get(range);
        }
        for (var r in this.range) {
            var x = this.zart.types.get(range[r]);
            if (x === undefined && typeof range === "string") {
                if (range === range[r]) {
                    return true;
                }
            }
            else {
                if (range.isof(range[r])) {
                    return true;
                }
            }
        }
        return false;
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
        var ids = {};
        for (var a in attributes) {
            for (var x in attributes[a].list()) {
                var id = attributes[a].list()[x].id;
                if (!this.get(id)) {
                    var count = 0;
                    if (ids[id]) {
                        count = ids[id];
                    }
                    ids[id] = (count + 1);
                }
            }
        }
        for (var id in ids) {
            if (ids[id] === 1) {
                //TODO: search for that attribute and just add it!
            } else {
                //TODO: 
                // (1) if level of inheritance of domains equals
                // -> extend range
                // (2) if level of inheritance of domains differs
                // -> only add most-specific ones
            }
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
                    if (a) {
                        break;
                    }
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
    
    //TODO: filter for range!
    this.list = function (range) {
        var ret = [];
        for (var a in this._attributes) {
            if (!range || this._attributes[a].applies(range)) {
                ret.push(this._attributes[a]);
            }
        }
        return ret;
    };
    
    for (var a in attrs) {
        this.add(attrs[a].id, attrs[a].range);
    }
};