// File:   Type.js
// Author: <a href="mailto:sebastian.germesin@dfki.de">Sebastian Germesin</a>
//

Zart.prototype.Type = function (id, attrs, options) {
    if (id === undefined || typeof id !== 'string') {
        throw "The type constructor needs an 'id' of type string! E.g., 'Person'";
    }
    if (attrs === undefined) {
        throw "The type constructor needs 'attributes'.";
    }
    if (!options || !options.zart || !(options.zart instanceof Zart)) {
        throw "Zart.Type needs an instance of Zart given.";
    }
    this.zart = options.zart;
    
    if (this.zart.types.get(id)) {
        return this.zart.types.get(id);
    }
   
    this.id = '<' + this.zart.defaultNamespace + id + '>';
    this.sid = id;
    
    this._supertypes = {};
    this.subtypes = [];
    
    this.isof = function (type) {
        type = this.zart.types.get(type);
        if (type) {
            return type.subsumes(this.id);
        } else {
            throw "No valid type given";
        }
    };
    
    this.subsumes = function (type) {
        type = this.zart.types.get(type);
        if (type) {
            var subsumedByChildren = false;
            for (var c in this.subtypes) {
                var childObj = this.zart.types.get(this.subtypes[c]);
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
    
    this.extend = function (id, attrs, options) {
        if (!options) { options = {} };
        options.zart = this.zart;
        
        var childObj = (typeof id === "string")?        
            this.zart.types.add(id, attrs, options) :
            this.zart.types.get(id);
        if (childObj) {
            var supertypes = childObj.supertypes();
            this.attributes.extend(
                supertypes.map(
                    function (t) {
                        return t.attributes;
                    })
            );
            childObj._supertypes[this.id] = this;
            this.subtypes.push(childObj);
            return childObj;
        }
        return undefined;
    };
        
    this.hierarchy = function () {
        var obj = {id : this.id, subtypes: []};
        for (var c in this.subtypes) {
            var childObj = this.zart.types.get(this.subtypes[c]);
            obj.subtypes.push(childObj.hierarchy());
        }
        return obj;
    };
    
    this.supertypes = function () {
        var ret = [];
        for (var p in this._supertypes) {
            ret.push(this._supertypes[p]);
        }
        return ret;
    };
    
    this.remove = function () {
        return this.zart.types.remove(this);
    };
    
    this.attributes = new this.zart.Attributes(this, attrs, options);
};

Zart.prototype.Types = function (options) {
    
    this.zart = options.zart;
    
    this._types = {},
    
    this.add = function (id, attrs) {
        if (this.get(id)) {
            throw "Type '" + id + "' already registered.";
        } else {
            var options = {
                zart : this.zart
            };
            var t = new this.zart.Type(id, attrs, options);
            this._types[t.id] = t;
            return t;
        }
    };
    
    this.get = function (id) {
        if (typeof id === 'string') {
            var t = this._types[id];
            if (t) {
                return t;
            } else {
                return this._types['<' + this.zart.defaultNamespace + id + '>'];
            }
        } else if (id instanceof this.zart.Type) {
            return this.get(id.id);
        } else {
            throw "Wrong argument in Zart.Types.get()";
        }
    };
    
    this.remove = function (id) {
        var t = this.get(id);
        delete this._types[t.id];
        for (var c in t.subtypes) {
            var childObj = this.get(t.subtypes[c]);
            if (childObj) {
                if (childObj.supertypes().length === 1 &&
                    childObj.supertypes()[0].id === t.id) {
                    //recursively remove all children 
                    //that inherit only from this type
                    this.zart.types.remove(childObj);
                } else {
                    delete childObj._supertypes[t.id];
                }
            }
        }
        return t;
    };
    
    this.list = function () {
        var ret = [];
        for (var i in this._types) {
            ret.push(this._types[i]);
        }
        return ret;
    };
};