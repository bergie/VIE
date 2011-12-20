//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     (c) 2011 Sebastian Germesin, IKS Consortium
//     (c) 2011 Szaby Grünwald, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://viejs.org/
//

// ## VIE.Attributes
// Within VIE, we provide special capabilities of handling attributes of types of entites. This
// helps first of all to list all attributes of an entity type, but furthermore fully supports
// inheritance of attributes from the type-class to inherit from.
if (VIE.prototype.Attribute) {
	throw new Error("ERROR: VIE.Attribute is already defined. Please check your VIE installation!");
}
if (VIE.prototype.Attributes) {
	throw new Error("ERROR: VIE.Attributes is already defined. Please check your VIE installation!");
}

// ### VIE.Attribute(id, range, domain)
// This is the constructor of a VIE.Attribute.  
// **Parameters**:  
// *{string}* **id** The id of the attribute.  
// *{string|array}* **range** A string or an array of strings of the target range of 
// the attribute.  
// *{string}* **domain** The domain of the attribute.  
// **Throws**:  
// *{Error}* if one of the given paramenters is missing.  
// **Returns**:  
// *{VIE.Attribute}* : A **new** VIE.Attribute object.  
// **Example usage**:  
//
//     var knowsAttr = new vie.Attribute("knows", ["Person"], "Person");
//      // Creates an attribute to describe a *knows*-relationship
//      // between persons.
VIE.prototype.Attribute = function (id, range, domain) {
    if (id === undefined || typeof id !== 'string') {
        throw new Error("The attribute constructor needs an 'id' of type string! E.g., 'Person'");
    }
    if (range === undefined) {
        throw new Error("The attribute constructor needs 'range'.");
    }
    if (domain === undefined) {
        throw new Error("The attribute constructor needs a 'domain'.");
    }
    
    this._domain = domain;
    
// ### range
// This field stores the ranges of the attribute's instance.  
// **Parameters**:  
// nothing
// **Throws**:  
// nothing  
// **Returns**:  
// *{array}* : An array of strings which represent the types.  
// **Example usage**:  
//
//     var knowsAttr = new vie.Attribute("knows", ["Person"], "Person");
//     console.log(knowsAttr.range);
//      // --> ["Person"]
    this.range = (_.isArray(range))? range : [ range ];
     
// ### id
// This field stores the id of the attribute's instance.  
// **Parameters**:  
// nothing
// **Throws**:  
// nothing  
// **Returns**:  
// *{string}* : A URI, representing the id of the attribute.  
// **Example usage**:  
//
//     var knowsAttr = new vie.Attribute("knows", ["Person"], "Person");
//     console.log(knowsAttr.id);
//     // --> <http://viejs.org/ns/knows>
    this.id = this.vie.namespaces.isUri(id) ? id : this.vie.namespaces.uri(id);

// ### applies(range)
// This method checks, whether the current attribute applies in the given range.
// If ```range``` is a string and cannot be transformed into a ```VIE.Type```, 
// this performs only string comparison, if it is a VIE.Type 
// or an ID of a VIE.Type, then inheritance is checked as well.
// **Parameters**:  
// *{string|VIE.Type}* **range** The ```VIE.Type``` (or it's string representation) to be checked. 
// **Throws**:  
// nothing  
// **Returns**:  
// *{boolean}* : ```true``` if the given type applies to this attribute and ```false``` otherwise.  
// **Example usage**:  
//
//     var knowsAttr = new vie.Attribute("knows", ["Person"], "Person");
//     console.log(knowsAttr.applies("Person")); // --> true
//     console.log(knowsAttr.applies("Place")); // --> false
    this.applies = function (range) {
        if (this.vie.types.get(range)) {
            range = this.vie.types.get(range);
        }
        for (var r = 0, len = this.range.length; r < len; r++) {
            var x = this.vie.types.get(this.range[r]);
            if (x === undefined && typeof range === "string") {
                if (range === this.range[r]) {
                    return true;
                }
            }
            else {
                if (range.isof(this.range[r])) {
                    return true;
                }
            }
        }
        return false;
    };
            
};

// ## VIE.Attributes(domain, attrs)
// This is the constructor of a VIE.Attributes. Basically a convenience class
// that represents a list of ```VIE.Attribute```. As attributes are part of a 
// certain ```VIE.Type```, it needs to be passed for inheritance checks.  
// **Parameters**:  
// *{string}* **domain** The domain of the attributes (the type they will be part of).  
// *{string|VIE.Attribute|array}* **attrs** Either a string representation of an attribute,
// a proper instance of ```VIE.Attribute``` or an array of both.  
// *{string}* **domain** The domain of the attribute.  
// **Throws**:  
// *{Error}* if one of the given paramenters is missing.  
// **Returns**:  
// *{VIE.Attribute}* : A **new** VIE.Attribute instance.  
// **Example usage**:  
//
//     var knowsAttr = new vie.Attribute("knows", ["Person"], "Person");
//     var personAttrs = new vie.Attributes("Person", knowsAttr);
VIE.prototype.Attributes = function (domain, attrs) {
    
    this._local = {};
    this._attributes = {};
    
// ### domain
// This field stores the domain of the attributes' instance.  
// **Parameters**:  
// nothing
// **Throws**:  
// nothing  
// **Returns**:  
// *{string}* : The string representation of the domain.  
// **Example usage**:  
//
//     console.log(personAttrs.domain);
//     // --> ["Person"]
    this.domain = domain;
    
// ### add(id, range)
// This method adds a ```VIE.Attribute``` to the attributes instance.
// **Parameters**:  
// *{string|VIE.Attribute}* **id** The string representation of an attribute, or a proper
// instance of a ```VIE.Attribute```.  
// **Throws**:  
// *{Error}* If an atribute with the given id is already registered.  
// *{Error}* If the ```id``` parameter is not a string, nor a ```VIE.Type``` instance.  
// **Returns**:  
// *{VIE.Attribute}* : The generated or passed attribute.  
// **Example usage**:  
//
//     personAttrs.add("name", "Text");
    this.add = function (id, range) {
        if (this.get(id)) {
            throw new Error("Attribute '" + id + "' already registered for domain " + this.domain.id + "!");
        } 
        else {
            if (typeof id === "string") {
                var a = new this.vie.Attribute(id, range, this.domain);
                this._local[a.id] = a;
                return a;
            } else if (id instanceof this.vie.Type) {
                id.domain = this.domain;
                id.vie = this.vie;
                this._local[id.id] = id;
                return id;
            } else {
                throw new Error("Wrong argument to VIE.Types.add()!");
            }
        }
    };
    
// ### remove(id)
// This method removes a ```VIE.Attribute``` from the attributes instance.
// **Parameters**:  
// *{string|VIE.Attribute}* **id** The string representation of an attribute, or a proper
// instance of a ```VIE.Attribute```.  
// **Throws**:  
// *{Error}* When the attribute is inherited from a parent ```VIE.Type``` and thus cannot be removed.
// **Returns**:  
// *{VIE.Attribute}* : The removed attribute.  
// **Example usage**:  
//
//     personAttrs.remove("knows");
    this.remove = function (id) {
        var a = this.get(id);
        if (a.id in this._local) {
            delete this._local[a.id];
            return a;
        }
        throw new Error("The attribute " + id + " is inherited and cannot be removed from the domain " + this.domain.id + "!");
    };
    
// ### get(id)
// This method returns a ```VIE.Attribute``` from the attributes instance by it's id.  
// **Parameters**:  
// *{string|VIE.Attribute}* **id** The string representation of an attribute, or a proper
// instance of a ```VIE.Attribute```.  
// **Throws**:  
// *{Error}* When the method is called with an unknown datatype.  
// **Returns**:  
// *{VIE.Attribute}* : The attribute.  
// **Example usage**:  
//
//     personAttrs.get("knows");
    this.get = function (id) {
        if (typeof id === 'string') {
            var lid = this.vie.namespaces.isUri(id) ? id : this.vie.namespaces.uri(id);
            return this._inherit()._attributes[lid];
        } else if (id instanceof this.vie.Attribute) {
            return this.get(id.id);
        } else {
            throw new Error("Wrong argument in VIE.Attributes.get()");
        }
    };
    
// ### _inherit()
// The private method ```_inherit``` creates a full list of all attributes. This includes
// local attributes as well as inherited attributes from the parents. The ranges of attributes
// with the same id will be merged. This method is called everytime an attribute is requested or
// the list of all attributes. Usually this method should not be invoked outside of the class.  
// **Parameters**:  
// *nothing*  
// instance of a ```VIE.Attribute```.  
// **Throws**:  
// *nothing*  
// **Returns**:  
// *nothing*  
// **Example usage**:  
//
//     personAttrs._inherit();
    this._inherit = function () {
        var attributes = jQuery.extend(true, {}, this._local);
        
        var inherited = _.map(this.domain.supertypes.list(),
            function (x) {
               return x.attributes; 
            }
        );

        var add = {};
        var merge = {};
        
        for (var a = 0, ilen = inherited.length; a < ilen; a++) {
            var attrs = inherited[a].list();
            for (var x = 0, alen = attrs.length; x < alen; x++) {
                var id = attrs[x].id;
                if (!(id in attributes)) {
                    if (!(id in add) && !(id in merge)) {
                        add[id] = attrs[x];
                    }
                    else {
                        if (!merge[id]) {
                            merge[id] = [];
                        }
                        if (id in add) {
                            merge[id] = jQuery.merge(merge[id], add[id].range);
                            delete add[id];
                        }
                        merge[id] = jQuery.merge(merge[id], attrs[x].range);
                        merge[id] = VIE.Util.unduplicate(merge[id]);
                    }
                }
            }
        }
        
        /* adds inherited attributes that do not need to be merged */
        jQuery.extend(attributes, add);
        
        /* merges inherited attributes */
        for (var id in merge) {
            var merged = merge[id];
            var ranges = [];
            for (var r = 0, mlen = merged.length; r < mlen; r++) {
                var p = this.vie.types.get(merged[r]);
                var isAncestorOf = false;
                if (p) {
                    for (var x = 0; x < mlen; x++) {
                        if (x === r) {
                            continue;
                        }
                        var c = this.vie.types.get(merged[x]);
                        if (c && c.isof(p)) {
                            isAncestorOf = true;
                            break;
                        }
                    }
                }
                if (!isAncestorOf) {
                    ranges.push(merged[r]);
                }
            }
            attributes[id] = new this.vie.Attribute(id, ranges, this);
        }

        this._attributes = attributes;
        return this;
    };

// ### toArray() === list()
// This method return an array of ```VIE.Attribute```s from the attributes instance.  
// **Parameters**:  
// *nothing.  
// **Throws**:  
// *nothing*  
// **Returns**:  
// *{array}* : An array of ```VIE.Attribute```.  
// **Example usage**:  
//
//     personAttrs.list();
    this.toArray = this.list = function (range) {
        var ret = [];
        var attributes = this._inherit()._attributes;
        for (var a in attributes) {
            if (!range || attributes[a].applies(range)) {
                ret.push(attributes[a]);
            }
        }
        return ret;
    };
        
    attrs = _.isArray(attrs) ? attrs : [ attrs ];
    
    for (var a = 0, len = attrs.length; a < len; a++) {
        this.add(attrs[a].id, attrs[a].range);
    }
};
