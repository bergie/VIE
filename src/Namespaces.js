// File:   Namespaces.js
// Author: <a href="mailto:sebastian.germesin@dfki.de">Sebastian Germesin</a>
//

Zart.prototype.Namespaces = function (namespaces) {
    
    this._namespaces = (namespaces)? namespaces : {};
    
    this.add = function (k, v) {
        //check if we overwrite existing mappings
        if (this.containsKey(k) && v !== this._namespaces[k]) {
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
    
    this.get = function (k) {
        return this._namespaces[k];
    };
    
    this.containsKey = function (k) {
        return (k in this._namespaces);
    };
    
    this.containsValue = function (v) {
        jQuery.each(this._namespaces, function (k1,v1) {
            if (v1 === v) {
                return true;
            }
        });
        return false;
    };

	this.update = function (k, v) {
        this._namespaces[k] = v;
        return this;
    };
    
    this.remove = function (k, v) {
        delete this._namespaces[k];
        return this;
    };
    
    this.toObj = function () {
        return this._namespaces;
    };
    
    this.curie = function(uri, safe){
        return jQuery.toCurie(uri, safe, this);
    };
    
    this.isCurie = jQuery.isCurie;
    
    this.uri = function (curie) {
        return jQuery.toUri (curie, this);
    };
    
    this.isUri = jQuery.isUri;
};