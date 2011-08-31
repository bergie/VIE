// File:   Type.js
// Author: <a href="mailto:sebastian.germesin@dfki.de">Sebastian Germesin</a>
//

Zart.prototype.Type = function (id, parent, attrs, options) {
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
        return this.typs.get(id);
    }
   
    this.id = '<' + this.zart.defaultNamespace + id + '>';
    this.sid = id;
    
    this._parent = (jQuery.isArray(parent) || parent === undefined)? parent : [ parent ];
    for (var p in this._parent) {
        var parentObj = this.zart.types.get(this._parent[p]);
        if (parentObj) {
            parentObj._children.push(this);
        } else {
            throw "Parent type with id '" + this._parent[p] + "' not found!";
        }
    }
    
    this._children = [];
    this._attrs = (jQuery.isArray(attrs))? attrs : [ attrs ];
    
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
            for (var c in this._children) {
                var childObj = this.zart.types.get(this._children[c]);
                if (childObj) {
                     if (childObj.id === type.id) {
                         return true;
                     } else {
                         childObj.subsumes(type);
                     }
                }
            }
            return false;
        } else {
            throw "No valid type given";
        }
    };
    
    this.extend = function () {
        //TODO
    };
    
    this.attributes = function () {
        //TODO
    };
    
    this.hierarchy = function () {
        var obj = {id : this.id, children: []};
        for (var c in this._children) {
            var childObj = this.zart.types.get(this._children[c]);
            obj.children.push(childObj.hierarchy());
        }
        return obj;
    };
    
    this.parent = function () {
        //TODO
    };
};

Zart.prototype.Types = function (zart) {
    
    this.zart = zart;
    
    this._types = {},
    
    this.add = function (id, parent, attrs) {
        if (this.get(id)) {
            return this.get(id);
        } else {
            var options = {
                zart : this.zart
            };
            var t = new this.zart.Type(id, parent, attrs, options);
            this._types[t.id] = t;
            return t;
        }
    };
    
    this.get = function (id) {
        if (typeof id === 'string') {
            return this._types[id];
        } else if (id instanceof this.zart.Type) {
            return this._types[id.id];
        } else {
            return undefined;
        }
    };
    
    this.remove = function () {
        var t = this.get(id);
        delete this._types[id];
        for (var c in t._children) {
            var childObj = this.zart.types.get(t._children[c]);
            if (childObj && 
                childObj.parent().length === 1 &&
                childObj.parent()[0].id === t.id) {
                    //recursively remove all children 
                    //that inherit only from this type
                childObj.remove();
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