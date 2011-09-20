// File:   Type.js
// Author: <a href="mailto:sebastian.germesin@dfki.de">Sebastian Germesin</a>
//

VIE.prototype.Type = function (id, attrs, options) {
    if (id === undefined || typeof id !== 'string') {
        throw "The type constructor needs an 'id' of type string! E.g., 'Person'";
    }
    if (!options || !options.vie || !(options.vie instanceof VIE)) {
        throw "VIE.Type needs an instance of VIE given.";
    }
    this.vie = options.vie;
    
    if (this.vie.types.get(id)) {
        return this.vie.types.get(id);
    }
   
    this.id = this.vie.namespaces.isUri(id) ? id : this.vie.namespaces.uri(id);
        
    this.supertypes = new this.vie.Types(options);
    this.subtypes = new this.vie.Types(options);
    
    if (attrs === undefined) {
        attrs = [];
    }
    this.attributes = new this.vie.Attributes(this, attrs, options);
    
    this.isof = function (type) {
        type = this.vie.types.get(type);
        if (type) {
            return type.subsumes(this.id);
        } else {
            throw "No valid type given";
        }
    };
    
    this.subsumes = function (type) {
        type = this.vie.types.get(type);
        if (type) {
            if (this.id === type.id) {
                return true;
            }
            var subsumedByChildren = false;
            var subtypes = this.subtypes.list();
            for (var c in subtypes) {
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
    
    this.inherit = function (supertype) {
        if (typeof supertype === "string") {
            this.inherit(this.vie.types.get(supertype));
        }
        else if (supertype instanceof this.vie.Type) {
            supertype.subtypes.add(this);
            this.supertypes.add(supertype);
            try {
                // only for validation of attribute-inheritance!
                this.attributes.list();
            } catch (e) {
                supertype.subtypes.remove(this);
                this.supertypes.remove(supertype);
                throw e;
            }
        } else if (jQuery.isArray(supertype)) {
            for (var i in supertype) {
                this.inherit(supertype[i]);
            }
        } else {
            throw "Wrong argument in VIE.Type.inherit()";
        }
        return this;
    };
        
    this.hierarchy = function () {
        var obj = {id : this.id, subtypes: []};
        for (var c in this.subtypes.list()) {
            var childObj = this.vie.types.get(this.subtypes.list()[c]);
            obj.subtypes.push(childObj.hierarchy());
        }
        return obj;
    };
        
    this.remove = function () {
        return this.vie.types.remove(this);
    };
    
    this.toString = function () {
        return this.id;
    };
};

VIE.prototype.Types = function (options) {
    
    this.vie = options.vie;
    
    this._types = {};
    
    this.add = function (id, attrs) {
        if (this.get(id)) {
            throw "Type '" + id + "' already registered.";
        } 
        else {
            if (typeof id === "string") {
                var options = {
                    vie: this.vie
                };
                var t = new this.vie.Type(id, attrs, options);
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
        return this.add(id);
    };
    
    this.get = function (id) {
        if (typeof id === 'string') {
            var lid = this.vie.namespaces.isUri(id) ? id : this.vie.namespaces.uri(id);
            return this._types[lid];
        } else if (id instanceof this.vie.Type) {
            return this.get(id.id);
        }
        throw "Wrong argument in VIE.Types.get()";
    };
    
    this.remove = function (id) {
        var t = this.get(id);
        if (!t) {
            return this;
        }
        delete this._types[t.id];
        
        var subtypes = t.subtypes.list();
        for (var c in subtypes) {
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
