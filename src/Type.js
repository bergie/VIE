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
    
    this._parent = parent;
    this._children = [];
    this._attrs = attrs;
    
    this.subsumes = function () {
        //TODO
    };
    
    this.extend = function () {
        //TODO
    };
    
    this.attributes = function () {
        //TODO
    };
    
    this.hierarchy = function () {
        
    };
    
    this.parent = function () {
        
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
            return null;
        }
    };
    
    this.remove = function () {
        var t = this.get(id);
        delete this._types[id];
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