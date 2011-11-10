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
