//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     (c) 2011 Sebastian Germesin, IKS Consortium
//     (c) 2011 Szaby Grünwald, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://viejs.org/
if (VIE.prototype.Namespaces) {
    throw new Error("ERROR: VIE.Namespaces is already defined. " +
        "Please check your VIE installation!");
}

// ## VIE Namespaces
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



// ## VIE.Namespaces(base, namespaces)
// This is the constructor of a VIE.Namespaces. The constructor initially
// needs a *base namespace* and can optionally be initialised with an
// associative array of prefixes and namespaces. The base namespace is used in a way
// that every non-prefixed, non-expanded attribute or type is assumed to be of that
// namespace. This helps, e.g., in an environment where only one namespace is given.
// **Parameters**:
// *{string}* **base** The base namespace.
// *{object}* **namespaces** Initial namespaces to bootstrap the namespaces. (optional)
// **Throws**:
// *{Error}* if the base namespace is missing.
// **Returns**:
// *{VIE.Attribute}* : A **new** VIE.Attribute object.
// **Example usage**:
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


// ### base(ns)
// This is a **getter** and **setter** for the base
// namespace. If called like ``base();`` it
// returns the actual base namespace as a string. If provided
// with a string, e.g., ``base("http://viejs.org/ns/");``
// it sets the current base namespace and retuns the namespace object
// for the purpose of chaining. If provided with anything except a string,
// it throws an Error.
// **Parameters**:
// *{string}* **ns** The namespace to be set. (optional)
// **Throws**:
// *{Error}* if the namespace is not of type string.
// **Returns**:
// *{string}* : The current base namespace.
// **Example usage**:
//
//     var namespaces = new vie.Namespaces("http://base.ns/");
//     console.log(namespaces.base()); // <-- "http://base.ns/"
//     namespaces.base("http://viejs.org/ns/");
//     console.log(namespaces.base()); // <-- "http://viejs.org/ns/"
VIE.prototype.Namespaces.prototype.base = function (ns) {
    if (!ns) {
        return this._base;
    }
    else if (typeof ns === "string") {
        /* remove another mapping */
        this.removeNamespace(ns);
        this._base = ns;
        return this._base;
    } else {
        throw new Error("Please provide a valid namespace!");
    }
};

// ### add(prefix, namespace)
// This method adds new prefix mappings to the
// current instance. If a prefix or a namespace is already
// present (in order to avoid ambiguities), an Error is thrown.
// ``prefix`` can also be an object in which case, the method
// is called sequentially on all elements.
// **Parameters**:
// *{string|object}* **prefix** The prefix to be set. If it is an object, the
// method will be applied to all key,value pairs sequentially.
// *{string}* **namespace** The namespace to be set.
// **Throws**:
// *{Error}* If a prefix or a namespace is already
// present (in order to avoid ambiguities).
// **Returns**:
// *{VIE.Namespaces}* : The current namespaces instance.
// **Example usage**:
//
//     var namespaces = new vie.Namespaces("http://base.ns/");
//     namespaces.add("", "http://...");
//     // is always equal to
//     namespaces.base("http://..."); // <-- setter of base namespace
VIE.prototype.Namespaces.prototype.add = function (prefix, namespace) {
    if (typeof prefix === "object") {
        for (var k1 in prefix) {
            this.add(k1, prefix[k1]);
        }
        return this;
    }
    if (prefix === "") {
        this.base(namespace);
        return this;
    }
    /* checking if we overwrite existing mappings */
    else if (this.contains(prefix) && namespace !== this._namespaces[prefix]) {
        throw new Error("ERROR: Trying to register namespace prefix mapping (" + prefix + "," + namespace + ")!" +
              "There is already a mapping existing: '(" + prefix + "," + this.get(prefix) + ")'!");
    }
    /* if not, just add them */
    this._namespaces[prefix] = namespace;
    return this;
};

// ### addOrReplace(prefix, namespace)
// This method adds new prefix mappings to the
// current instance. This will overwrite existing mappings.
// **Parameters**:
// *{string|object}* **prefix** The prefix to be set. If it is an object, the
// method will be applied to all key,value pairs sequentially.
// *{string}* **namespace** The namespace to be set.
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.Namespaces}* : The current namespaces instance.
// **Example usage**:
//
//     var namespaces = new vie.Namespaces("http://base.ns/");
//     namespaces.addOrReplace("", "http://...");
//     // is always equal to
//     namespaces.base("http://..."); // <-- setter of base namespace
VIE.prototype.Namespaces.prototype.addOrReplace = function (prefix, namespace) {
    if (typeof prefix === "object") {
        for (var k1 in prefix) {
            this.addOrReplace(k1, prefix[k1]);
        }
        return this;
    }
    this.remove(prefix);
    return this.add(prefix, namespace);
};

// ### get(prefix)
// This method retrieves a namespaces, given a prefix. If the
// prefix is the empty string, the base namespace is returned.
// **Parameters**:
// *{string}* **prefix** The prefix to be retrieved.
// **Throws**:
// *nothing*
// **Returns**:
// *{string|undefined}* : The namespace or ```undefined``` if no namespace could be found.
// **Example usage**:
//
//     var namespaces = new vie.Namespaces("http://base.ns/");
//     namespaces.addOrReplace("test", "http://test.ns");
//     console.log(namespaces.get("test")); // <-- "http://test.ns"
VIE.prototype.Namespaces.prototype.get = function (prefix) {
    if (prefix === "") {
        return this.base();
    }
    return this._namespaces[prefix];
};

// ### getPrefix(namespace)
// This method retrieves a prefix, given a namespace.
// **Parameters**:
// *{string}* **namespace** The namespace to be retrieved.
// **Throws**:
// *nothing*
// **Returns**:
// *{string|undefined}* : The prefix or ```undefined``` if no prefix could be found.
// **Example usage**:
//
//     var namespaces = new vie.Namespaces("http://base.ns/");
//     namespaces.addOrReplace("test", "http://test.ns");
//     console.log(namespaces.getPrefix("http://test.ns")); // <-- "test"
VIE.prototype.Namespaces.prototype.getPrefix = function (namespace) {
    var prefix;
    if (namespace.indexOf('<') === 0) {
        namespace = namespace.substring(1, namespace.length - 1);
    }
    jQuery.each(this._namespaces, function (k1,v1) {
        if (namespace.indexOf(v1) === 0) {
            prefix = k1;
        }

        if (namespace.indexOf(k1 + ':') === 0) {
            prefix = k1;
        }
    });
    return prefix;
};

// ### contains(prefix)
// This method checks, whether a prefix is stored in the instance.
// **Parameters**:
// *{string}* **prefix** The prefix to be checked.
// **Throws**:
// *nothing*
// **Returns**:
// *{boolean}* : ```true``` if the prefix could be found, ```false``` otherwise.
// **Example usage**:
//
//     var namespaces = new vie.Namespaces("http://base.ns/");
//     namespaces.addOrReplace("test", "http://test.ns");
//     console.log(namespaces.contains("test")); // <-- true
VIE.prototype.Namespaces.prototype.contains = function (prefix) {
    return (prefix in this._namespaces);
};

// ### containsNamespace(namespace)
// This method checks, whether a namespace is stored in the instance.
// **Parameters**:
// *{string}* **namespace** The namespace to be checked.
// **Throws**:
// *nothing*
// **Returns**:
// *{boolean}* : ```true``` if the namespace could be found, ```false``` otherwise.
// **Example usage**:
//
//     var namespaces = new vie.Namespaces("http://base.ns/");
//     namespaces.addOrReplace("test", "http://test.ns");
//     console.log(namespaces.containsNamespace("http://test.ns")); // <-- true
VIE.prototype.Namespaces.prototype.containsNamespace = function (namespace) {
    return this.getPrefix(namespace) !== undefined;
};

// ### update(prefix, namespace)
// This method overwrites the namespace that is stored under the
// prefix ``prefix`` with the new namespace ``namespace``.
// If a namespace is already bound to another prefix, an Error is thrown.
// **Parameters**:
// *{string}* **prefix** The prefix.
// *{string}* **namespace** The namespace.
// **Throws**:
// *{Error}* If a namespace is already bound to another prefix.
// **Returns**:
// *{VIE.Namespaces}* : The namespace instance.
// **Example usage**:
//
//     ...
VIE.prototype.Namespaces.prototype.update = function (prefix, namespace) {
    this.remove(prefix);
    return this.add(prefix, namespace);
};

// ### updateNamespace(prefix, namespace)
// This method overwrites the prefix that is bound to the
// namespace ``namespace`` with the new prefix ``prefix``. If another namespace is
// already registered with the given ``prefix``, an Error is thrown.
// **Parameters**:
// *{string}* **prefix** The prefix.
// *{string}* **namespace** The namespace.
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.Namespaces}* : The namespace instance.
// **Example usage**:
//
//     var namespaces = new vie.Namespaces("http://base.ns/");
//     namespaces.add("test", "http://test.ns");
//     namespaces.updateNamespace("test2", "http://test.ns");
//     namespaces.get("test2"); // <-- "http://test.ns"
VIE.prototype.Namespaces.prototype.updateNamespace = function (prefix, namespace) {
    this.removeNamespace(prefix);
    return this.add(prefix, namespace);
};

// ### remove(prefix)
// This method removes the namespace that is stored under the prefix ``prefix``.
// **Parameters**:
// *{string}* **prefix** The prefix to be removed.
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.Namespaces}* : The namespace instance.
// **Example usage**:
//
//     var namespaces = new vie.Namespaces("http://base.ns/");
//     namespaces.add("test", "http://test.ns");
//     namespaces.get("test"); // <-- "http://test.ns"
//     namespaces.remove("test");
//     namespaces.get("test"); // <-- undefined
VIE.prototype.Namespaces.prototype.remove = function (prefix) {
    if (prefix) {
        delete this._namespaces[prefix];
    }
    return this;
};

// ### removeNamespace(namespace)
// This method removes removes the namespace ``namespace`` from the instance.
// **Parameters**:
// *{string}* **namespace** The namespace to be removed.
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.Namespaces}* : The namespace instance.
// **Example usage**:
//
//     var namespaces = new vie.Namespaces("http://base.ns/");
//     namespaces.add("test", "http://test.ns");
//     namespaces.get("test"); // <-- "http://test.ns"
//     namespaces.removeNamespace("http://test.ns");
//     namespaces.get("test"); // <-- undefined
VIE.prototype.Namespaces.prototype.removeNamespace = function (namespace) {
    var prefix = this.getPrefix(namespace);
    if (prefix) {
        delete this._namespaces[prefix];
    }
    return this;
};

// ### toObj()
// This method serializes the namespace instance into an associative
// array representation. The base namespace is given an empty
// string as key.
// **Parameters**:
// *{boolean}* **omitBase** If set to ```true``` this omits the baseNamespace.
// **Throws**:
// *nothing*
// **Returns**:
// *{object}* : A serialization of the namespaces as an object.
// **Example usage**:
//
//     var namespaces = new vie.Namespaces("http://base.ns/");
//     namespaces.add("test", "http://test.ns");
//     console.log(namespaces.toObj());
//     // <-- {""    : "http://base.ns/",
//             "test": "http://test.ns"}
//     console.log(namespaces.toObj(true));
//     // <-- {"test": "http://test.ns"}
VIE.prototype.Namespaces.prototype.toObj = function (omitBase) {
    if (omitBase) {
        return jQuery.extend({}, this._namespaces);
    }
    return jQuery.extend({'' : this._base}, this._namespaces);
};

// ### curie(uri, safe)
// This method converts a given
// URI into a CURIE (or SCURIE), based on the given ```VIE.Namespaces``` object.
// If the given uri is already a URI, it is left untouched and directly returned.
// If no prefix could be found, an ```Error``` is thrown.
// **Parameters**:
// *{string}* **uri** The URI to be transformed.
// *{boolean}* **safe** A flag whether to generate CURIEs or SCURIEs.
// **Throws**:
// *{Error}* If no prefix could be found in the passed namespaces.
// **Returns**:
// *{string}* The CURIE or SCURIE.
// **Example usage**:
//
//     var ns = new myVIE.Namespaces(
//           "http://viejs.org/ns/",
//           { "dbp": "http://dbpedia.org/ontology/" }
//     );
//     var uri = "<http://dbpedia.org/ontology/Person>";
//     ns.curie(uri, false); // --> dbp:Person
//     ns.curie(uri, true); // --> [dbp:Person]
VIE.prototype.Namespaces.prototype.curie = function(uri, safe){
    return VIE.Util.toCurie(uri, safe, this);
};

// ### isCurie(curie)
// This method checks, whether
// the given string is a CURIE and returns ```true``` if so and ```false```otherwise.
// **Parameters**:
// *{string}* **curie** The CURIE (or SCURIE) to be checked.
// **Throws**:
// *nothing*
// **Returns**:
// *{boolean}* ```true``` if the given curie is a CURIE or SCURIE and ```false``` otherwise.
// **Example usage**:
//
//     var ns = new myVIE.Namespaces(
//           "http://viejs.org/ns/",
//           { "dbp": "http://dbpedia.org/ontology/" }
//     );
//     var uri = "<http://dbpedia.org/ontology/Person>";
//     var curie = "dbp:Person";
//     var scurie = "[dbp:Person]";
//     var text = "This is some text.";
//     ns.isCurie(uri);    // --> false
//     ns.isCurie(curie);  // --> true
//     ns.isCurie(scurie); // --> true
//     ns.isCurie(text);   // --> false
VIE.prototype.Namespaces.prototype.isCurie = function (something) {
    return VIE.Util.isCurie(something, this);
};

// ### uri(curie)
// This method converts a
// given CURIE (or save CURIE) into a URI, based on the given ```VIE.Namespaces``` object.
// **Parameters**:
// *{string}* **curie** The CURIE to be transformed.
// **Throws**:
// *{Error}* If no URI could be assembled.
// **Returns**:
// *{string}* : A string, representing the URI.
// **Example usage**:
//
//     var ns = new myVIE.Namespaces(
//           "http://viejs.org/ns/",
//           { "dbp": "http://dbpedia.org/ontology/" }
//     );
//     var curie = "dbp:Person";
//     var scurie = "[dbp:Person]";
//     ns.uri(curie);
//          --> <http://dbpedia.org/ontology/Person>
//     ns.uri(scurie);
//          --> <http://dbpedia.org/ontology/Person>
VIE.prototype.Namespaces.prototype.uri = function (curie) {
    return VIE.Util.toUri(curie, this);
};

// ### isUri(something)
// This method checks, whether the given string is a URI.
// **Parameters**:
// *{string}* **something** : The string to be checked.
// **Throws**:
// *nothing*
// **Returns**:
// *{boolean}* : ```true``` if the string is a URI, ```false``` otherwise.
// **Example usage**:
//
//     var namespaces = new vie.Namespaces("http://base.ns/");
//     namespaces.addOrReplace("test", "http://test.ns");
//     var uri = "<http://test.ns/Person>";
//     var curie = "test:Person";
//     namespaces.isUri(uri);   // --> true
//     namespaces.isUri(curie); // --> false
VIE.prototype.Namespaces.prototype.isUri = VIE.Util.isUri;
