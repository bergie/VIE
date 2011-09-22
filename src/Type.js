// File:   Type.js
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
            supertype.subtypes.add(this);
            this.supertypes.add(supertype);
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
        
    // returns the id of the type.
    this.toString = function () {
        return this.id;
    };
    
};

VIE.prototype.Types = function () {
        
    this._types = {};
    
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
    
    this.addOrOverwrite = function(id, attrs){
        if (this.get(id)) {
            this.remove(id);
        }
        return this.add(id, attrs);
    };
    
    this.get = function (id) {
        if (!id) return undefined;
        if (typeof id === 'string') {
            var lid = this.vie.namespaces.isUri(id) ? id : this.vie.namespaces.uri(id);
            return this._types[lid];
        } else if (id instanceof this.vie.Type) {
            return this.get(id.id);
        }
        return undefined;
    };
    
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
    
    this.toArray = this.list = function () {
        var ret = [];
        for (var i in this._types) {
            ret.push(this._types[i]);
        }
        return ret;
    };
};