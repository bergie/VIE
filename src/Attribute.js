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
    this.count = {}; //TODO!
   
    this.id = this.zart.namespaces.isUri(id) ? id : this.zart.namespaces.uri(id);
            
    this.applies = function (range) {
        if (this.zart.types.get(range)) {
            range = this.zart.types.get(range);
        }
        for (var r in this.range) {
            var x = this.zart.types.get(this.range[r]);
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
    
    this.remove = function () {
        return this.domain.attributes.remove(this);
    };
        
};

Zart.prototype.Attributes = function (domain, attrs, options) {
    
    this.zart = options.zart;
    
    this.domain = domain;
    
    this._local = {};
    this._attributes = {};
    
    this.add = function (id, range) {
        if (this.get(id)) {
            throw "Attribute '" + id + "' already registered for domain " + this.domain.id + "!";
        } 
        else {
            if (typeof id === "string") {
                var options = {
                    zart: this.zart
                };
                var a = new this.zart.Attribute(id, range, this.domain, options);
                this._local[a.id] = a;
                return a;
            } else if (id instanceof this.zart.Type) {
                id.domain = this.domain;
                id.zart = this.zart;
            	this._local[id.id] = id;
                return id;
            } else {
                throw "Wrong argument to Zart.Types.add()!";
            }
        }
    };
    
    this.remove = function (id) {
        var a = this.get(id);
        if (a.id in this._local) {
            delete this._local[a.id];
            return a;
        }
        throw "The attribute " + id + " is inherited and cannot be removed from the domain " + this.domain.id + "!";
    };
        
    this.get = function (id) {
        if (typeof id === 'string') {
            var lid = this.zart.namespaces.isUri(id) ? id : this.zart.namespaces.uri(id);
            return this._inherit()._attributes[lid];
        } else if (id instanceof this.zart.Attribute) {
            return this.get(id.id);
        } else {
            throw "Wrong argument in Zart.Attributes.get()";
        }
    };
    
    this._inherit = function () {
        var attributes = jQuery.extend(true, {}, this._local);
        
        var inherited = this.domain.supertypes.list().map(
            function (x) {
               return x.attributes; 
            });
        
        var add = {};
        var merge = {};
        
        for (var a in inherited) {
            var attrs = inherited[a].list();
            for (var x in attrs) {
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
                        merge[id] = Zart.Util.unduplicate(merge[id]);
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
            for (var r in merged) {
                var p = this.zart.types.get(merged[r]);
                var isAncestorOf = false;
                if (p) {
                    for (var x in merged) {
                        if (x === r) {
                            continue;
                        }
                        var c = this.zart.types.get(merged[x]);
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
            var options = {
                zart: this.zart
            };
            attributes[id] = new this.zart.Attribute(id, ranges, this, options);
        }

        this._attributes = attributes;
        return this;
    };

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
    for (var a in attrs) {
        this.add(attrs[a].id, attrs[a].range);
    }
};