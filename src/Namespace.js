//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     (c) 2011 Sebastian Germesin, IKS Consortium
//     (c) 2011 Szaby Grünwald, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://viejs.org/

if (VIE.prototype.Namespaces) {
    throw new Error("ERROR: VIE.Namespaces is already defined. " + 
        "Please check your installation!");
}

// ## VIE Namespaces constructor
//
// In general, a namespace is a container that provides context for the identifiers.
// Within VIE, namespaces are used to distinguish different ontolgies or vocabularies
// of identifiers, types and attributes. However, because of their verbosity, namespaces
// tend to make their usage pretty circuitous. The ``VIE.Namespaces(...)`` class provides VIE
// with methods to maintain abbreviations (akak **prefixes**) for namespaces in order to
// alleviate their usage. By default, every VIE instance is equipped with a main instance
// of the namespaces in ``myVIE.namespaces``. Furthermore, VIE uses a **base namespace**, 
// which is used if no prefix is given (has an empty prefix).
// In the upcoming sections, we will explain the
// methods to add, access and remove prefixes.
//
// The constructor: The constructor initially needs a *base namespace* and can optionally be initialised
// with an associative array of prefixes and namespaces.
//
//     var namespaces = new myVIE.Namespaces("http://viejs.org/ns/");
//
// The above code initialises the namespaces with a base namespace ``http://viejs.org/ns/``. Which means
// that every non-prefixed, non-expanded attribute or type is assumed to be of that namespace. This helps, e.g.,
// in an environment where only one namespace is given.
//
// We can also bootstrap namespaces within the constructor:
//
//     var ns = new myVIE.Namespaces("http://viejs.org/ns/", 
//           {
//            "foaf": "http://xmlns.com/foaf/0.1/"
//           });
VIE.prototype.Namespaces = function (base, namespaces) {
    
    if (!base) {
        throw new Error("Please provide a base namespace!");
    }
    this._base = base;
    
    this._namespaces = (namespaces)? namespaces : {};
    if (typeof this._namespaces !== "object" || _.isArray(this._namespaces)) {
        throw new Error("If you want to initialise VIE namespace prefixes, " + 
            "please provide a proper object!");
    }
};

// This is a **getter** and **setter** for the base
// namespace. If called like ``myVIE.namespaces.base();`` it
// returns the actual base namespace as a string. If provided
// with a string, e.g., ``myVIE.namespaces.base("http://viejs.org/ns/");``
// it sets the current base namespace and retuns the namespace object
// for the purpose of chaining. If provided with anything except a string,
// it throws an Error. 
VIE.prototype.Namespaces.prototype.base = function (ns) {
    if (!ns) { 
        return this._base;
    }
    else if (typeof ns === "string") {
        this._base = ns;
        return this;
    } else {
        throw new Error("Please provide a valid namespace!");
    }
};
    
// Add new namespacs. This also checks if there are
//prefixes or namespaces already defined to avoid
//ambiguities in the namespaces. Use `addOrReplace()`
//to simply overwrite them. 
VIE.prototype.Namespaces.prototype.add = function (k, v) {
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
        throw new Error("ERROR: Trying to register namespace prefix mapping (" + k + "," + v + ")!" +
              "There is already a mapping existing: '(" + k + "," + this.get(k) + ")'!");
    } else {
        jQuery.each(this._namespaces, function (k1,v1) {
            if (v1 === v && k1 !== k) {
                throw new Error("ERROR: Trying to register namespace prefix mapping (" + k + "," + v + ")!" +
                      "There is already a mapping existing: '(" + k1 + "," + v + ")'!");
            }
        });
    }
    this._namespaces[k] = v;
    
    return this;
};
    
    // this has the same capabilities as `add(k, v);` but
    // overwrites already exising mappings.
VIE.prototype.Namespaces.prototype.addOrReplace = function (k, v) {
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
VIE.prototype.Namespaces.prototype.get = function (k) {
    if (k === "") {
        return this.base();
    }
    return this._namespaces[k];
};

// get a prefix (or *undefined*) for a given namespace.
VIE.prototype.Namespaces.prototype.getPrefix = function (namespace) {
    var prefix = undefined;
    jQuery.each(this._namespaces, function (k1,v1) {
        if (v1 === namespace) {
            prefix = k1;
        }
    });
    return prefix;
};

// This method (``containsPrefix()``) checks, whether a prefix is stored in the instance and
// returns ``true`` if so and ``false`` otherwise. 
VIE.prototype.Namespaces.prototype.containsPrefix = function (prefix) {
    return (prefix in this._namespaces);
};
    
// This method (``containsNamespace()``) checks, whether a namespace is stored in the instance and
// returns ``true`` if so and ``false`` otherwise. 
VIE.prototype.Namespaces.prototype.containsNamespace = function (namespace) {
    return this.getPrefix(namespace) !== undefined;
};

// This method (``update()``) overwrite the namespace that is stored under the prefix ``prefix``
// with the new namespace ``namespace``.
// The method returns the namespace instance for the purpose of chaining.
VIE.prototype.Namespaces.prototype.update = function (prefix, namespace) {
    this._namespaces[prefix] = namespace;
    return this;
};

// This method (``remove()``) removes the namespace that is stored under the prefix ``prefix``.
// The method returns the namespace instance for the purpose of chaining.
VIE.prototype.Namespaces.prototype.remove = function (prefix) {
    delete this._namespaces[prefix];
    return this;
};

// This method (``removeNamespace()``) removes the namespace ``namespace``
// from the instance.
// The method returns the namespace instance for the purpose of chaining.
VIE.prototype.Namespaces.prototype.removeNamespace = function (namespace) {
    var prefix = this.getPrefix(namespace);
    alert(prefix);
    if (prefix) {
        delete this._namespaces[prefix];
    }
    return this;
};
    
// This serializes the namespace instance into an associative
// array representation. The base namespace is given an empty
// string as key.
VIE.prototype.Namespaces.prototype.toObj = function () {
    return jQuery.extend({'' : this._base}, this._namespaces);
};
    
// This method transforms a URI into a CURIE, based on the given
// namespace instance. If ``safe`` is set to ``true``, it will
// return a safe CURIE. If no prefix can be found, an Error is
// thrown.
//
//     calling: 
//     myVIE.namespaces.curie("...", true|false); 
//     // is always equal to
//     VIE.Util.toCurie("...", true|false, myVIE.namespaces);
VIE.prototype.Namespaces.prototype.curie = function(uri, safe){
    return VIE.Util.toCurie(uri, safe, this);
};
    
// This method checks, whether the passed string is a proper CURIE, 
// based on the prefixes in the current namespace instance and
// returns ``true`` if so and ``false`` otherwise.
//
//     calling: 
//     myVIE.namespaces.isCurie("..."); 
//     // is always equal to
//     VIE.Util.isCurie("...", myVIE.namespaces);
VIE.prototype.Namespaces.prototype.isCurie = function (something) {
    return VIE.Util.isCurie(something, this);
};
    
// This method transforms the passed ``curie`` into a URI, based
// on the current namespace instance. If no prefix could be found, 
// an Error is thrown. 
//
//     calling: 
//     myVIE.namespaces.uri("..."); 
//     // is always equal to
//     VIE.Util.toUri("...", myVIE.namespaces);
VIE.prototype.Namespaces.prototype.uri = function (curie) {
    return VIE.Util.toUri(curie, this);
};
    
// This method checks, whether the given string is a URI and
// returns ``true`` if so and ``false`` otherwise.
//
//     calling: 
//     myVIE.namespaces.isUri("..."); 
//     // is always equal to
//     VIE.Util.isUri("...");
VIE.prototype.Namespaces.prototype.isUri = VIE.Util.isUri;
