// File:   Attribute.js <br />
// Author: <a href="http://github.com/neogermi/">Sebastian Germesin</a>
//

// Adding capability of handling attribute structure and inheritance to VIE. 
if (VIE.prototype.Attribute) {
	throw new Error("ERROR: VIE.Attribute is already defined. Please check your installation!");
}
if (VIE.prototype.Attributes) {
	throw new Error("ERROR: VIE.Attributes is already defined. Please check your installation!");
}

//The constructor of a VIE.Attribute. 
//Usage: ``var knowsAttr = new vie.Attribute("knows", ["Person"]);``
//This creates a attribute that describes a **knows** relationship between persons.
VIE.prototype.Attribute = function (id, range, domain) {
    if (id === undefined || typeof id !== 'string') {
        throw new Error("The attribute constructor needs an 'id' of type string! E.g., 'Person'");
    }
    if (range === undefined) {
        throw new Error("The attribute constructor needs 'range'.");
    }
    if (domain === undefined) {
        throw new Error("The attribute constructor needs a 'domain'.");
    }
    
    this._domain = domain;
    this.range = (jQuery.isArray(range))? range : [ range ];
   
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
            throw new Error("Attribute '" + id + "' already registered for domain " + this.domain.id + "!");
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
                throw new Error("Wrong argument to VIE.Types.add()!");
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
        throw new Error("The attribute " + id + " is inherited and cannot be removed from the domain " + this.domain.id + "!");
    };
    
    //retrieve a `VIE.Attribute` from the attributes by it's id.
    this.get = function (id) {
        if (typeof id === 'string') {
            var lid = this.vie.namespaces.isUri(id) ? id : this.vie.namespaces.uri(id);
            return this._inherit()._attributes[lid];
        } else if (id instanceof this.vie.Attribute) {
            return this.get(id.id);
        } else {
            throw new Error("Wrong argument in VIE.Attributes.get()");
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
