//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     (c) 2011 Sebastian Germesin, IKS Consortium
//     (c) 2011 Szaby Grünwald, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://viejs.org/
//

// ## VIE.Types
// Within VIE, we provide special capabilities of handling types of entites. This helps
// for example to query easily for certain entities (e.g., you only need to query for *Person*s
// and not for all subtypes).

// ### VIE.Type(id, attrs, metadata)
// This is the constructor of a VIE.Type.
// **Parameters**:
// *{string}* **id** The id of the type.
// *{string|array|VIE.Attribute}* **attrs** A string, proper ```VIE.Attribute``` or an array of these which
// *{object}* **metadata** Possible metadata about the type
// are the possible attributes of the type
// **Throws**:
// *{Error}* if one of the given paramenters is missing.
// **Returns**:
// *{VIE.Type}* : A **new** VIE.Type object.
// **Example usage**:
//
//     var person = new vie.Type("Person", ["name", "knows"]);
VIE.prototype.Type = function (id, attrs, metadata) {
    if (id === undefined || typeof id !== 'string') {
        throw "The type constructor needs an 'id' of type string! E.g., 'Person'";
    }

// ### id
// This field stores the id of the type's instance.
// **Parameters**:
// nothing
// **Throws**:
// nothing
// **Returns**:
// *{string}* : The id of the type as a URI.
// **Example usage**:
//
//     console.log(person.id);
//      // --> "<http://viejs.org/ns/Person>"
    this.id = this.vie.namespaces.isUri(id) ? id : this.vie.namespaces.uri(id);

    /* checks whether such a type is already defined. */
    if (this.vie.types.get(this.id)) {
        throw new Error("The type " + this.id + " is already defined!");
    }

// ### supertypes
// This field stores all parent types of the type's instance. This
// is set if the current type inherits from another type.
// **Parameters**:
// nothing
// **Throws**:
// nothing
// **Returns**:
// *{VIE.Types}* : The supertypes (parents) of the type.
// **Example usage**:
//
//     console.log(person.supertypes);
    this.supertypes = new this.vie.Types();

// ### subtypes
// This field stores all children types of the type's instance. This
// will be set if another type inherits from the current type.
// **Parameters**:
// nothing
// **Throws**:
// nothing
// **Returns**:
// *{VIE.Types}* : The subtypes (parents) of the type.
// **Example usage**:
//
//     console.log(person.subtypes);
    this.subtypes = new this.vie.Types();

// ### attributes
// This field stores all attributes of the type's instance as
// a proper ```VIE.Attributes``` class. (see also <a href="Attribute.html">VIE.Attributes</a>)
// **Parameters**:
// nothing
// **Throws**:
// nothing
// **Returns**:
// *{VIE.Attributes}* : The attributes of the type.
// **Example usage**:
//
//     console.log(person.attributes);
    this.attributes = new this.vie.Attributes(this, (attrs)? attrs : []);

// ### metadata
// This field stores possible additional information about the type, like
// a human-readable label.
    this.metadata = metadata ? metadata : {};

// ### isof(type)
// This method checks whether the current type is a child of the given type.
// **Parameters**:
// *{string|VIE.Type}* **type** The type (or the id of that type) to be checked.
// **Throws**:
// *{Error}* If the type is not valid.
// **Returns**:
// *{boolean}* : ```true``` if the current type inherits from the type, ```false``` otherwise.
// **Example usage**:
//
//     console.log(person.isof("owl:Thing"));
//     // <-- true
    this.isof = function (type) {
        if(!(type instanceof VIE.prototype.Type)){
            type = (this.vie.types.get(type)) ? this.vie.types.get(type) : new this.vie.Type(type);
        }
        if (type) {
            return type.subsumes(this.id);
        } else {
            throw new Error("No valid type given");
        }
    };

// ### subsumes(type)
// This method checks whether the current type is a parent of the given type.
// **Parameters**:
// *{string|VIE.Type}* **type** The type (or the id of that type) to be checked.
// **Throws**:
// *{Error}* If the type is not valid.
// **Returns**:
// *{boolean}* : ```true``` if the current type is a parent of the type, ```false``` otherwise.
// **Example usage**:
//
//     var x = new vie.Type(...);
//     var y = new vie.Type(...).inherit(x);
//     y.isof(x) === x.subsumes(y);
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
            throw new Error("No valid type given");
        }
    };

// ### inherit(supertype)
// This method invokes inheritance throught the types. This adds the current type to the
// subtypes of the supertype and vice versa.
// **Parameters**:
// *{string|VIE.Type|array}* **supertype** The type to be inherited from. If this is an array
// the inherit method is called sequentially on all types.
// **Throws**:
// *{Error}* If the type is not valid.
// **Returns**:
// *{VIE.Type}* : The instance itself.
// **Example usage**:
//
//     var x = new vie.Type(...);
//     var y = new vie.Type(...).inherit(x);
//     y.isof(x) // <-- true
    this.inherit = function (supertype) {
        if (typeof supertype === "string") {
            this.inherit(this.vie.types.get(supertype));
        }
        else if (supertype instanceof this.vie.Type) {
            supertype.subtypes.addOrOverwrite(this);
            this.supertypes.addOrOverwrite(supertype);
            try {
                /* only for validation of attribute-inheritance!
                   if this throws an error (inheriting two attributes
                   that cannot be combined) we reverse all changes. */
                this.attributes.list();
            } catch (e) {
                supertype.subtypes.remove(this);
                this.supertypes.remove(supertype);
                throw e;
            }
        } else if (jQuery.isArray(supertype)) {
            for (var i = 0, slen = supertype.length; i < slen; i++) {
                this.inherit(supertype[i]);
            }
        } else {
            throw new Error("Wrong argument in VIE.Type.inherit()");
        }
        return this;
    };

// ### hierarchy()
// This method serializes the hierarchy of child types into an object.
// **Parameters**:
// *nothing*
// **Throws**:
// *nothing*
// **Returns**:
// *{object}* : The hierachy of child types as an object.
// **Example usage**:
//
//     var x = new vie.Type(...);
//     var y = new vie.Type(...).inherit(x);
//     x.hierarchy();
    this.hierarchy = function () {
        var obj = {id : this.id, subtypes: []};
        var list = this.subtypes.list();
        for (var c = 0, llen = list.length; c < llen; c++) {
            var childObj = this.vie.types.get(list[c]);
            obj.subtypes.push(childObj.hierarchy());
        }
        return obj;
    };

// ### instance()
// This method creates a ```VIE.Entity``` instance from this type.
// **Parameters**:
// *{object}* **attrs**  see <a href="Entity.html">constructor of VIE.Entity</a>
// *{object}* **opts**  see <a href="Entity.html">constructor of VIE.Entity</a>
// **Throws**:
// *{Error}* if the instance could not be built
// **Returns**:
// *{VIE.Entity}* : A **new** instance of a ```VIE.Entity``` with the current type.
// **Example usage**:
//
//     var person = new vie.Type("person");
//     var sebastian = person.instance(
//         {"@subject" : "#me",
//          "name" : "Sebastian"});
//     console.log(sebastian.get("name")); // <-- "Sebastian"
    this.instance = function (attrs, opts) {
      var typedClass = this.vie.getTypedEntityClass(this);
      return new typedClass(attrs, opts);
    };

// ### toString()
// This method returns the id of the type.
// **Parameters**:
// *nothing*
// **Throws**:
// *nothing*
// **Returns**:
// *{string}* : The id of the type.
// **Example usage**:
//
//     var x = new vie.Type(...);
//     x.toString() === x.id;
    this.toString = function () {
        return this.id;
    };
};

// ### VIE.Types()
// This is the constructor of a VIE.Types. This is a convenience class
// to store ```VIE.Type``` instances properly.
// **Parameters**:
// *nothing*
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.Types}* : A **new** VIE.Types object.
// **Example usage**:
//
//     var types = new vie.Types();
VIE.prototype.Types = function () {

    this._types = {};

// ### add(id, attrs, metadata)
// This method adds a `VIE.Type` to the types.
// **Parameters**:
// *{string|VIE.Type}* **id** If this is a string, the type is created and directly added.
// *{string|object}* **attrs** Only used if ```id``` is a string.
// *{object}* **metadata** potential additional metadata about the type.
// **Throws**:
// *{Error}* if a type with the given id already exists a ```VIE.Entity``` instance from this type.
// **Returns**:
// *{VIE.Types}* : The instance itself.
// **Example usage**:
//
//     var types = new vie.Types();
//     types.add("Person", ["name", "knows"]);
    this.add = function (id, attrs, metadata) {
        if (_.isArray(id)) {
           _.each(id, function (type) {
             this.add(type);
           }, this);
           return this;
        }

        if (this.get(id)) {
            throw new Error("Type '" + id + "' already registered.");
        }  else {
            if (typeof id === "string") {
                var t = new this.vie.Type(id, attrs, metadata);
                this._types[t.id] = t;
                return t;
            } else if (id instanceof this.vie.Type) {
                this._types[id.id] = id;
                return id;
            } else {
                throw new Error("Wrong argument to VIE.Types.add()!");
            }
        }
        return this;
    };

// ### addOrOverwrite(id, attrs)
// This method adds or overwrites a `VIE.Type` to the types. This is the same as
// ``this.remove(id); this.add(id, attrs);``
// **Parameters**:
// *{string|VIE.Type}* **id** If this is a string, the type is created and directly added.
// *{string|object}* **attrs** Only used if ```id``` is a string.
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.Types}* : The instance itself.
// **Example usage**:
//
//     var types = new vie.Types();
//     types.addOrOverwrite("Person", ["name", "knows"]);
    this.addOrOverwrite = function(id, attrs){
        if (this.get(id)) {
            this.remove(id);
        }
        return this.add(id, attrs);
    };

// ### get(id)
// This method retrieves a `VIE.Type` from the types by it's id.
// **Parameters**:
// *{string|VIE.Type}* **id** The id or the type itself.
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.Type}* : The instance of the type or ```undefined```.
// **Example usage**:
//
//     var types = new vie.Types();
//     types.addOrOverwrite("Person", ["name", "knows"]);
//     types.get("Person");
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

// ### remove(id)
// This method removes a type of given id from the type. This also
// removes all children if their only parent were this
// type. Furthermore, this removes the link from the
// super- and subtypes.
// **Parameters**:
// *{string|VIE.Type}* **id** The id or the type itself.
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.Type}* : The removed type.
// **Example usage**:
//
//     var types = new vie.Types();
//     types.addOrOverwrite("Person", ["name", "knows"]);
//     types.remove("Person");
    this.remove = function (id) {
        var t = this.get(id);
        /* test whether the type actually exists in VIE
         * and prevents removing *owl:Thing*.
         */
        if (!t) {
            return this;
        }
        if (!t || t.subsumes("owl:Thing")) {
            return this;
        }
        delete this._types[t.id];

        var subtypes = t.subtypes.list();
        for (var c = 0; c < subtypes.length; c++) {
            var childObj = subtypes[c];
            if (childObj.supertypes.list().length === 1) {
                /* recursively remove all children
                   that inherit only from this type */
                this.remove(childObj);
            } else {
                childObj.supertypes.remove(t.id);
            }
        }
        return t;
    };

// ### toArray() === list()
// This method returns an array of all types.
// **Parameters**:
// *nothing*
// **Throws**:
// *nothing*
// **Returns**:
// *{array}* : An array of ```VIE.Type``` instances.
// **Example usage**:
//
//     var types = new vie.Types();
//     types.addOrOverwrite("Person", ["name", "knows"]);
//     types.list();
    this.toArray = this.list = function () {
        var ret = [];
        for (var i in this._types) {
            ret.push(this._types[i]);
        }
        return ret;
    };

// ### sort(types, desc)
// This method sorts an array of types in their order, given by the
// inheritance. This returns a copy and leaves the original array untouched.
// **Parameters**:
// *{array|VIE.Type}* **types** The array of ```VIE.Type``` instances or ids of types to be sorted.
// *{boolean}* **desc** If 'desc' is given and 'true', the array will be sorted
// in descendant order.
// *nothing*
// **Throws**:
// *nothing*
// **Returns**:
// *{array}* : A sorted copy of the array.
// **Example usage**:
//
//     var types = new vie.Types();
//     types.addOrOverwrite("Person", ["name", "knows"]);
//     types.sort(types.list(), true);
    this.sort = function (types, desc) {
        var self = this;
        types = (jQuery.isArray(types))? types : [ types ];
        desc = (desc)? true : false;

        if (types.length === 0) return [];
        var copy = [ types[0] ];
        var x, tlen;
        for (x = 1, tlen = types.length; x < tlen; x++) {
            var insert = types[x];
            var insType = self.get(insert);
            if (insType) {
                for (var y = 0; y < copy.length; y++) {
                    if (insType.subsumes(copy[y])) {
                        copy.splice(y,0,insert);
                        break;
                    } else if (y === copy.length - 1) {
                        copy.push(insert);
                    }
                }
            }
        }

        //unduplicate
        for (x = 0; x < copy.length; x++) {
            if (copy.lastIndexOf(copy[x]) !== x) {
                copy.splice(x, 1);
                x--;
            }
        }

        if (!desc) {
            copy.reverse();
        }
        return copy;
    };
};
