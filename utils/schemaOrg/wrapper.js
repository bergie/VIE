// File:   schema.js
// Author: <a href="mailto:sebastian.germesin@dfki.de">Sebastian Germesin</a>
//

//This bootstraps the <a href="http://schema.org">http://schema.org</a> 
//ontology into Zart.

Zart.prototype.loadSchemaOrg = function () {
    if (!SchemaOrg) {
        throw "Please load the schema.json file."
    }
    
    var datatypeMapping = {
        'DataType': 'xsd:anyType',
        'Boolean' : 'xsd:boolean',
        'Date'    : 'xsd:date',
        'Float'   : 'xsd:float',
        'Integer' : 'xsd:integer',
        'Number'  : 'xsd:anySimpleType',
        'Text'    : 'xsd:string',
        'URL'     : 'anyURI'
    };
    
    var dataTypeHelper = function (ancestors, id) {
        
        if (ancestors.length === 0) {
            return this.types.add(id, [{'id' : 'value', 'range' : datatypeMapping[id]}]);
        } else {
            var type = undefined;
            for (var i = 0; i < ancestors.length; i++) {
                var supertype = (this.types.get(ancestors[i]))? this.types.get(ancestors[i]) :
                    dataTypeHelper.call(this, SchemaOrg["datatypes"][ancestors[i]].supertypes, ancestors[i]);
                type = supertype.extend((type)? type : id, [{'id' : 'value', 'range' : datatypeMapping[id]}]);
            }
            return type;
        }
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
        for (var p in specProps) {
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
        
        if (ancestors.length === 0) {
            return this.types.add(id, props);
        } else {
            var type = undefined;
            for (var i = 0; i < ancestors.length; i++) {
                var supertype = (this.types.get(ancestors[i]))? this.types.get(ancestors[i]) :
                    typeHelper.call(this, SchemaOrg["types"][ancestors[i]].supertypes, ancestors[i], typeProps(ancestors[i]));
                type = supertype.extend((type)? type : id, typeProps(id));
            }
            return type;
        }
    };
    
    for (var t in SchemaOrg["types"]) {
        if (!this.types.get(t)) {
            var ancestors = SchemaOrg["types"][t].supertypes;
            var props = typeProps(t);
            typeHelper.call(this, ancestors, t, props);
        }
    }

};