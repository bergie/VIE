// File:   schema.js
// Author: <a href="mailto:sebastian.germesin@dfki.de">Sebastian Germesin</a>
//

//This bootstraps the <a href="http://schema.org">http://schema.org</a> 
//ontology into VIE.

VIE.prototype.loadSchemaOrg = function () {
    
    if (!SchemaOrg) {
        throw "Please load the schema.json file."
    }
    this.types.remove("Thing");
    
    this.namespaces.base("http://schema.org/");
    this.namespaces.add("xsd", "http://www.w3.org/2001/XMLSchema#");
    
    var datatypeMapping = {
        'DataType': 'xsd:anyType',
        'Boolean' : 'xsd:boolean',
        'Date'    : 'xsd:date',
        'Float'   : 'xsd:float',
        'Integer' : 'xsd:integer',
        'Number'  : 'xsd:anySimpleType',
        'Text'    : 'xsd:string',
        'URL'     : 'xsd:anyURI'
    };
    
    var dataTypeHelper = function (ancestors, id) {
        var type = this.types.add(id, [{'id' : 'value', 'range' : datatypeMapping[id]}]);
        
        for (var i = 0; i < ancestors.length; i++) {
            var supertype = (this.types.get(ancestors[i]))? this.types.get(ancestors[i]) :
                dataTypeHelper.call(this, SchemaOrg["datatypes"][ancestors[i]].supertypes, ancestors[i]);
            type.inherit(supertype);
        }
        return type;
    };
    
    for (var dt in SchemaOrg["datatypes"]) {
        if (!this.types.get(dt)) {
            var ancestors = SchemaOrg["datatypes"][dt].supertypes;
            dataTypeHelper.call(this, ancestors, dt);
        }
    }
    
    var typeProps = function (id) {
        var props = [];
        var specProps = SchemaOrg["types"][id]["specific_properties"];
        for (var p = 0; p < specProps.length; p++) {
            var pId = specProps[p];
            var range = SchemaOrg["properties"][pId]["ranges"];
            props.push({
                'id'    : pId,
                'range' : range
            });
        }
        return props;
    };
    
    var typeHelper = function (ancestors, id, props) {
        var type = this.types.add(id, props);
       
        for (var i = 0; i < ancestors.length; i++) {
            var supertype = (this.types.get(ancestors[i]))? this.types.get(ancestors[i]) :
                typeHelper.call(this, SchemaOrg["types"][ancestors[i]].supertypes, ancestors[i], typeProps(ancestors[i]));
            type.inherit(supertype);
        }
        return type;
    };
    
    for (var t in SchemaOrg["types"]) {
        if (!this.types.get(t)) {
            var ancestors = SchemaOrg["types"][t].supertypes;
            typeHelper.call(this, ancestors, t, typeProps(t));
        }
    }

};