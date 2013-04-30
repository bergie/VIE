//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     (c) 2011 Sebastian Germesin, IKS Consortium
//     (c) 2011 Szaby Grünwald, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://viejs.org/

// ## VIE Utils
//
// The here-listed methods are utility methods for the day-to-day
// VIE.js usage. All methods are within the static namespace ```VIE.Util```.
VIE.Util = {
  isReference: function(uri){
    var matcher = new RegExp("^\\<([^\\>]*)\\>$");
    if (matcher.exec(uri)) {
      return true;
    }
    return false;
  },

  toReference: function(uri, ns) {
    if (_.isArray(uri)) {
      return _.map(uri, function(part) {
       return this.toReference(part);
      }, this);
    }
    if (!_.isString(uri)) {
      return uri;
    }
    var ret = uri;
    if (uri.substring(0, 2) === "_:") {
      ret = uri;
    } else if (ns && ns.isCurie(uri)) {
      ret = ns.uri(uri);
      if (ret === "<" + ns.base() + uri + ">") {
        // no base namespace extension with IDs
        ret = '<' + uri + '>';
      }
    } else if (ns && !ns.isUri(uri)) {
      ret = '<' + uri + '>';
    }
    return ret;
  },

  fromReference: function(uri, ns) {
    if (ns && !ns.isUri(uri)) {
      return uri;
    }
    return uri.substring(1, uri.length - 1);
  },

// ### VIE.Util.toCurie(uri, safe, namespaces)
// This method converts a given
// URI into a CURIE (or SCURIE), based on the given ```VIE.Namespaces``` object.
// If the given uri is already a URI, it is left untouched and directly returned.
// If no prefix could be found, an ```Error``` is thrown.
// **Parameters**:
// *{string}* **uri** The URI to be transformed.
// *{boolean}* **safe** A flag whether to generate CURIEs or SCURIEs.
// *{VIE.Namespaces}* **namespaces** The namespaces to be used for the prefixes.
// **Throws**:
// *{Error}* If no prefix could be found in the passed namespaces.
// **Returns**:
// *{string}* The CURIE or SCURIE.
// **Example usage**:
//
//     var ns = new myVIE.Namespaces(
//           "http://viejs.org/ns/",
//           { "dbp": "http://dbpedia.org/ontology/" }
//     );
//     var uri = "<http://dbpedia.org/ontology/Person>";
//     VIE.Util.toCurie(uri, false, ns); // --> dbp:Person
//     VIE.Util.toCurie(uri, true, ns); // --> [dbp:Person]
    toCurie : function (uri, safe, namespaces) {
        if (VIE.Util.isCurie(uri, namespaces)) {
            return uri;
        }
        var delim = ":";
        for (var k in namespaces.toObj()) {
            if (uri.indexOf(namespaces.get(k)) === 1) {
                var pattern = new RegExp("^" + "<?" + namespaces.get(k));
                if (k === '') {
                    delim = '';
                }
                return ((safe)? "[" : "") +
                        uri.replace(pattern, k + delim).replace(/>$/, '') +
                        ((safe)? "]" : "");
            }
        }
        throw new Error("No prefix found for URI '" + uri + "'!");
    },

// ### VIE.Util.isCurie(curie, namespaces)
// This method checks, whether
// the given string is a CURIE and returns ```true``` if so and ```false```otherwise.
// **Parameters**:
// *{string}* **curie** The CURIE (or SCURIE) to be checked.
// *{VIE.Namespaces}* **namespaces** The namespaces to be used for the prefixes.
// **Throws**:
// *nothing*
// **Returns**:
// *{boolean}* ```true``` if the given curie is a CURIE or SCURIE and ```false``` otherwise.
// **Example usage**:
//
//     var ns = new myVIE.Namespaces(
//           "http://viejs.org/ns/",
//           { "dbp": "http://dbpedia.org/ontology/" }
//     );
//     var uri = "<http://dbpedia.org/ontology/Person>";
//     var curie = "dbp:Person";
//     var scurie = "[dbp:Person]";
//     var text = "This is some text.";
//     VIE.Util.isCurie(uri, ns);    // --> false
//     VIE.Util.isCurie(curie, ns);  // --> true
//     VIE.Util.isCurie(scurie, ns); // --> true
//     VIE.Util.isCurie(text, ns);   // --> false
    isCurie : function (curie, namespaces) {
        if (VIE.Util.isUri(curie)) {
            return false;
        } else {
            try {
                VIE.Util.toUri(curie, namespaces);
                return true;
            } catch (e) {
                return false;
            }
        }
    },

// ### VIE.Util.toUri(curie, namespaces)
// This method converts a
// given CURIE (or save CURIE) into a URI, based on the given ```VIE.Namespaces``` object.
// **Parameters**:
// *{string}* **curie** The CURIE to be transformed.
// *{VIE.Namespaces}* **namespaces** The namespaces object
// **Throws**:
// *{Error}* If no URI could be assembled.
// **Returns**:
// *{string}* : A string, representing the URI.
// **Example usage**:
//
//     var ns = new myVIE.Namespaces(
//           "http://viejs.org/ns/",
//           { "dbp": "http://dbpedia.org/ontology/" }
//     );
//     var curie = "dbp:Person";
//     var scurie = "[dbp:Person]";
//     VIE.Util.toUri(curie, ns);
//          --> <http://dbpedia.org/ontology/Person>
//     VIE.Util.toUri(scurie, ns);
//          --> <http://dbpedia.org/ontology/Person>
    toUri : function (curie, namespaces) {
        if (VIE.Util.isUri(curie)) {
            return curie;
        }
        var delim = ":";
        for (var prefix in namespaces.toObj()) {
            if (prefix !== "" && (curie.indexOf(prefix + ":") === 0 || curie.indexOf("[" + prefix + ":") === 0)) {
                var pattern = new RegExp("^" + "\\[{0,1}" + prefix + delim);
                return "<" + curie.replace(pattern, namespaces.get(prefix)).replace(/\]{0,1}$/, '') + ">";
            }
        }
        /* check for the default namespace */
        if (curie.indexOf(delim) === -1) {
            return "<" + namespaces.base() + curie + ">";
        }
        throw new Error("No prefix found for CURIE '" + curie + "'!");
    },

// ### VIE.Util.isUri(something)
// This method checks, whether the given string is a URI.
// **Parameters**:
// *{string}* **something** : The string to be checked.
// **Throws**:
// *nothing*
// **Returns**:
// *{boolean}* : ```true``` if the string is a URI, ```false``` otherwise.
// **Example usage**:
//
//     var uri = "<http://dbpedia.org/ontology/Person>";
//     var curie = "dbp:Person";
//     VIE.Util.isUri(uri);   // --> true
//     VIE.Util.isUri(curie); // --> false
    isUri : function (something) {
        return (typeof something === "string" && something.search(/^<.+>$/) === 0);
    },

// ### VIE.Util.mapAttributeNS(attr, ns)
// This method maps an attribute of an entity into namespaces if they have CURIEs.
// **Parameters**:
// *{string}* **attr** : The attribute to be transformed.
// *{VIE.Namespaces}* **ns** : The namespaces.
// **Throws**:
// *nothing*
// **Returns**:
// *{string}* : The transformed attribute's name.
// **Example usage**:
//
//      var attr = "name";
//      var ns = myVIE.namespaces;
//      VIE.Util.mapAttributeNS(attr, ns); // '<' + ns.base() + attr + '>';
    mapAttributeNS : function (attr, ns) {
        var a = attr;
        if (ns.isUri (attr) || attr.indexOf('@') === 0) {
            //ignore
        } else if (ns.isCurie(attr)) {
            a = ns.uri(attr);
        } else if (!ns.isUri(attr)) {
            if (attr.indexOf(":") === -1) {
                a = '<' + ns.base() + attr + '>';
            } else {
                a = '<' + attr + '>';
            }
        }
        return a;
    },

// ### VIE.Util.rdf2Entities(service, results)
// This method converts *rdf/json* data from an external service
// into VIE.Entities.
// **Parameters**:
// *{object}* **service** The service that retrieved the data.
// *{object}* **results** The data to be transformed.
// **Throws**:
// *nothing*
// **Returns**:
// *{[VIE.Entity]}* : An array, containing VIE.Entity instances which have been transformed from the given data.
    rdf2Entities: function (service, results) {
        if (typeof jQuery.rdf !== 'function') {
            /* fallback if no rdfQuery has been loaded */
            return VIE.Util._rdf2EntitiesNoRdfQuery(service, results);
        }
        var entities = {};
        try {
            var rdf = (results instanceof jQuery.rdf)?
                    results.base(service.vie.namespaces.base()) :
                        jQuery.rdf().base(service.vie.namespaces.base()).load(results, {});

            /* if the service contains rules to apply special transformation, they are executed here.*/
            if (service.rules) {
                var rules = jQuery.rdf.ruleset();
                for (var prefix in service.vie.namespaces.toObj()) {
                    if (prefix !== "") {
                        rules.prefix(prefix, service.vie.namespaces.get(prefix));
                    }
                }
                for (var i = 0; i < service.rules.length; i++)if(service.rules.hasOwnProperty(i)) {
                    var rule = service.rules[i];
                    rules.add(rule.left, rule.right);
                }
                rdf = rdf.reason(rules, 10); /* execute the rules only 10 times to avoid looping */
            }
            rdf.where('?subject ?property ?object').each(function() {
                var subject = this.subject.toString();
                if (!entities[subject]) {
                    entities[subject] = {
                        '@subject': subject,
                        '@context': service.vie.namespaces.toObj(true),
                        '@type': []
                    };
                }
                var propertyUri = this.property.toString();
                var propertyCurie;

                try {
                    propertyCurie = service.vie.namespaces.curie(propertyUri);
                    //jQuery.createCurie(propertyUri, {namespaces: service.vie.namespaces.toObj(true)});
                } catch (e) {
                    propertyCurie = propertyUri;
                    // console.warn(propertyUri + " doesn't have a namespace definition in '", service.vie.namespaces.toObj());
                }
                entities[subject][propertyCurie] = entities[subject][propertyCurie] || [];

                function getValue(rdfQueryLiteral){
                    if(typeof rdfQueryLiteral.value === "string"){
                        if (rdfQueryLiteral.lang){
                            var literal = {
                                toString: function(){
                                    return this["@value"];
                                },
                                "@value": rdfQueryLiteral.value.replace(/^"|"$/g, ''),
                                "@language": rdfQueryLiteral.lang
                            };
                            return literal;
                        }
                        else
                            return rdfQueryLiteral.value;
                        return rdfQueryLiteral.value.toString();
                    } else if (rdfQueryLiteral.type === "uri"){
                        return rdfQueryLiteral.toString();
                    } else {
                        return rdfQueryLiteral.value;
                    }
                }
                entities[subject][propertyCurie].push(getValue(this.object));
            });

            _(entities).each(function(ent){
                ent["@type"] = ent["@type"].concat(ent["rdf:type"]);
                delete ent["rdf:type"];
                _(ent).each(function(value, property){
                    if(value.length === 1){
                        ent[property] = value[0];
                    }
                });
            });
        } catch (e) {
            // console.warn("Something went wrong while parsing the returned results!", e);
            return [];
        }
        var vieEntities = [];
        jQuery.each(entities, function() {
            try {
                var entityInstance = new service.vie.Entity(this);
                vieEntities.push(entityInstance);
            } catch (e) {
                // console.warn("Something went wrong while creating VIE entities out of the returned results!", e, this, entityInstance);
            }
        });
        return vieEntities;
    },

    /*
    VIE.Util.getPreferredLangForPreferredProperty(entity, preferredFields, preferredLanguages)
    looks for specific ranking fields and languages. It calculates all possibilities and gives them
    a score. It returns the value with the best score.
    */
    getPreferredLangForPreferredProperty: function(entity, preferredFields, preferredLanguages) {
      var labelArr, lang, property, resArr, valueArr, _len, _len2,
        _this = this;
      resArr = [];
      /* Try to find a label in the preferred language
      */
      _.each(preferredLanguages, function (lang, l) {
        _.each(preferredFields, function (property, p) {
          labelArr = null;
          /* property can be a string e.g. "skos:prefLabel"
          */
          if (typeof property === "string" && entity.get(property)) {
            labelArr = _.flatten([entity.get(property)]);
            _(labelArr).each(function(label) {
              /*
              The score is a natural number with 0 for the
              best candidate with the first preferred language
              and first preferred property
              */
              var labelLang, value, p, score, l;
              score = p = l = 0;
              labelLang = label["@language"];
              /*
                                      legacy code for compatibility with uotdated stanbol,
                                      to be removed after may 2012
              */
              if (typeof label === "string" && (label.indexOf("@") === label.length - 3 || label.indexOf("@") === label.length - 5)) {
                labelLang = label.replace(/(^\"*|\"*@)..(..)?$/g, "");
              }
              /* end of legacy code
              */
              if (labelLang) {
                if (labelLang === lang) {
                  score += l;
                } else {
                  score += 20;
                }
              } else {
                score += 10;
              }
              value = label.toString();
              /* legacy code for compatibility with uotdated stanbol, to be removed after may 2012
              */
              value = value.replace(/(^\"*|\"*@..$)/g, "");
              /* end of legacy code
              */
              return resArr.push({
                score: score,
                value: value
              });
            });
            /*
            property can be an object like
            {
              property: "skos:broader",
              makeLabel: function(propertyValueArr) { return "..."; }
            }
            */
          } else if (typeof property === "object" && entity.get(property.property)) {
            valueArr = _.flatten([entity.get(property.property)]);
            valueArr = _(valueArr).map(function(termUri) {
              if (termUri.isEntity) {
                return termUri.getSubject();
              } else {
                return termUri;
              }
            });
            resArr.push({
              score: p,
              value: property.makeLabel(valueArr)
            });
          }
        });
      });
      /*
              take the result with the best score
      */
      resArr = _(resArr).sortBy(function(a) {
        return a.score;
      });
      if(resArr.length) {
        return resArr[0].value;
      } else {
        return "n/a";
      }
    },


// ### VIE.Util._rdf2EntitiesNoRdfQuery(service, results)
// This is a **private** method which should
// only be accessed through ```VIE.Util._rdf2Entities()``` and is a helper method in case there is no
// rdfQuery loaded (*not recommended*).
// **Parameters**:
// *{object}* **service** The service that retrieved the data.
// *{object}* **results** The data to be transformed.
// **Throws**:
// *nothing*
// **Returns**:
// *{[VIE.Entity]}* : An array, containing VIE.Entity instances which have been transformed from the given data.
    _rdf2EntitiesNoRdfQuery: function (service, results) {
        var jsonLD = [];
        _.forEach(results, function(value, key) {
            var entity = {};
            entity['@subject'] = '<' + key + '>';
            _.forEach(value, function(triples, predicate) {
                predicate = '<' + predicate + '>';
                _.forEach(triples, function(triple) {
                    if (triple.type === 'uri') {
                        triple.value = '<' + triple.value + '>';
                    }

                    if (entity[predicate] && !_.isArray(entity[predicate])) {
                        entity[predicate] = [entity[predicate]];
                    }

                    if (_.isArray(entity[predicate])) {
                        entity[predicate].push(triple.value);
                        return;
                    }
                    entity[predicate] = triple.value;
                });
            });
            jsonLD.push(entity);
        });
        return jsonLD;
    },

// ### VIE.Util.loadSchemaOrg(vie, SchemaOrg, baseNS)
// This method is a wrapper around
// the <a href="http://schema.org/">schema.org</a> ontology. It adds all the
// given types and properties as ```VIE.Type``` instances to the given VIE instance.
// If the paramenter **baseNS** is set, the method automatically sets the namespace
// to the provided one. If it is not set, it will keep the base namespace of VIE untouched.
// **Parameters**:
// *{VIE}* **vie** The instance of ```VIE```.
// *{object}* **SchemaOrg** The data imported from schema.org.
// *{string|undefined}* **baseNS** If set, this will become the new baseNamespace within the given ```VIE``` instance.
// **Throws**:
// *{Error}* If the parameter was not given.
// **Returns**:
// *nothing*
    loadSchemaOrg : function (vie, SchemaOrg, baseNS) {

        if (!SchemaOrg) {
            throw new Error("Please load the schema.json file.");
        }
        vie.types.remove("<http://schema.org/Thing>");

        var baseNSBefore = (baseNS)? baseNS : vie.namespaces.base();
        vie.namespaces.base(baseNS);

        var datatypeMapping = {
            'DataType': 'xsd:anyType',
            'Boolean' : 'xsd:boolean',
            'Date'    : 'xsd:date',
            'DateTime': 'xsd:dateTime',
            'Time'    : 'xsd:time',
            'Float'   : 'xsd:float',
            'Integer' : 'xsd:integer',
            'Number'  : 'xsd:anySimpleType',
            'Text'    : 'xsd:string',
            'URL'     : 'xsd:anyURI'
        };

        var dataTypeHelper = function (ancestors, id) {
            var type = vie.types.add(id, [{'id' : 'value', 'range' : datatypeMapping[id]}]);

            for (var i = 0; i < ancestors.length; i++) {
                var supertype = (vie.types.get(ancestors[i]))? vie.types.get(ancestors[i]) :
                    dataTypeHelper.call(vie, SchemaOrg.datatypes[ancestors[i]].supertypes, ancestors[i]);
                type.inherit(supertype);
            }
            return type;
        };

        for (var dt in SchemaOrg.datatypes) {
            if (!vie.types.get(dt)) {
                var ancestors = SchemaOrg.datatypes[dt].supertypes;
                dataTypeHelper.call(vie, ancestors, dt);
            }
        }

        var metadataHelper = function (definition) {
            var metadata = {};

            if (definition.label) {
              metadata.label = definition.label;
            }

            if (definition.url) {
              metadata.url = definition.url;
            }

            if (definition.comment) {
              metadata.comment = definition.comment;
            }

            if (definition.metadata) {
              metadata = _.extend(metadata, definition.metadata);
            }
            return metadata;
        };

        var typeProps = function (id) {
            var props = [];
            _.each(SchemaOrg.types[id].specific_properties, function (pId) {
                var property = SchemaOrg.properties[pId];
                props.push({
                    'id'    : property.id,
                    'range' : property.ranges,
                    'min'   : property.min,
                    'max'   : property.max,
                    'metadata': metadataHelper(property)
                });
            });
            return props;
        };

        var typeHelper = function (ancestors, id, props, metadata) {
            var type = vie.types.add(id, props, metadata);

            for (var i = 0; i < ancestors.length; i++) {
                var supertype = (vie.types.get(ancestors[i]))? vie.types.get(ancestors[i]) :
                    typeHelper.call(vie, SchemaOrg.types[ancestors[i]].supertypes, ancestors[i], typeProps.call(vie, ancestors[i]), metadataHelper(SchemaOrg.types[ancestors[i]]));
                type.inherit(supertype);
            }
            if (id === "Thing" && !type.isof("owl:Thing")) {
                type.inherit("owl:Thing");
            }
            return type;
        };

        _.each(SchemaOrg.types, function (typeDef) {
            if (vie.types.get(typeDef.id)) {
                return;
            }
            var ancestors = typeDef.supertypes;
            var metadata = metadataHelper(typeDef);
            typeHelper.call(vie, ancestors, typeDef.id, typeProps.call(vie, typeDef.id), metadata);
        });

        /* set the namespace to either the old value or the provided baseNS value */
        vie.namespaces.base(baseNSBefore);
    },

// ### VIE.Util.getEntityTypeUnion(entity)
// This generates a entity-specific VIE type that is a subtype of all the
// types of the entity. This makes it easier to deal with attribute definitions
// specific to an entity because they're merged to a single list. This custom
// type is transient, meaning that it won't be automatilly added to the entity
// or the VIE type registry.
    getEntityTypeUnion : function(entity) {
      var vie = entity.vie;
      return new vie.Type('Union').inherit(entity.get('@type'));
    },

// ### VIE.Util.getFormSchemaForType(type)
// This creates a [Backbone Forms](https://github.com/powmedia/backbone-forms)
// -compatible form schema for any VIE Type.
    getFormSchemaForType : function(type, allowNested) {
      var schema = {};

      // Generate a schema
      _.each(type.attributes.toArray(), function (attribute) {
        var key = VIE.Util.toCurie(attribute.id, false, attribute.vie.namespaces);
        schema[key] = VIE.Util.getFormSchemaForAttribute(attribute);
      });

      // Clean up unknown attribute types
      _.each(schema, function (field, id) {
        if (!field.type) {
          delete schema[id];
        }

        if (field.type === 'URL') {
          field.type = 'Text';
          field.dataType = 'url';
        }

        if (field.type === 'List' && !field.listType) {
          delete schema[id];
        }

        if (!allowNested) {
          if (field.type === 'NestedModel' || field.listType === 'NestedModel') {
            delete schema[id];
          }
        }
      });

      return schema;
    },

/// ### VIE.Util.getFormSchemaForAttribute(attribute)
    getFormSchemaForAttribute : function(attribute) {
      var primaryType = attribute.range[0];
      var schema = {};

      var getWidgetForType = function (type) {
        switch (type) {
          case 'xsd:anySimpleType':
          case 'xsd:float':
          case 'xsd:integer':
            return 'Number';
          case 'xsd:string':
            return 'Text';
          case 'xsd:date':
            return 'Date';
          case 'xsd:dateTime':
            return 'DateTime';
          case 'xsd:boolean':
            return 'Checkbox';
          case 'xsd:anyURI':
            return 'URL';
          default:
            var typeType = attribute.vie.types.get(type);
            if (!typeType) {
              return null;
            }
            if (typeType.attributes.get('value')) {
              // Convert to proper xsd type
              return getWidgetForType(typeType.attributes.get('value').range[0]);
            }
            return 'NestedModel';
        }
      };

      // TODO: Generate a nicer label
      schema.title = VIE.Util.toCurie(attribute.id, false, attribute.vie.namespaces);

      // TODO: Handle attributes linking to other VIE entities

      if (attribute.min > 0) {
        schema.validators = ['required'];
      }

      if (attribute.max > 1) {
        schema.type = 'List';
        schema.listType = getWidgetForType(primaryType);
        if (schema.listType === 'NestedModel') {
          schema.nestedModelType = primaryType;
        }
        return schema;
      }

      schema.type = getWidgetForType(primaryType);
      if (schema.type === 'NestedModel') {
        schema.nestedModelType = primaryType;
      }
      return schema;
    },

// ### VIE.Util.getFormSchema(entity)
// This creates a [Backbone Forms](https://github.com/powmedia/backbone-forms)
// -compatible form schema for any VIE Entity. The form schema creation
// utilizes type information attached to the entity.
// **Parameters**:
// *{```Entity```}* **entity** An instance of VIE ```Entity```.
// **Throws**:
// *nothing*..
// **Returns**:
// *{object}* a JavaScript object representation of the form schema
    getFormSchema : function(entity) {
      if (!entity || !entity.isEntity) {
        return {};
      }

      var unionType = VIE.Util.getEntityTypeUnion(entity);
      var schema = VIE.Util.getFormSchemaForType(unionType, true);

      // Handle nested models
      _.each(schema, function (property, id) {
        if (property.type !== 'NestedModel' && property.listType !== 'NestedModel') {
          return;
        }
        schema[id].model = entity.vie.getTypedEntityClass(property.nestedModelType);
      });

      return schema;
    },

// ### VIE.Util.xsdDateTime(date)
// This transforms a ```Date``` instance into an xsd:DateTime format.
// **Parameters**:
// *{```Date```}* **date** An instance of a javascript ```Date```.
// **Throws**:
// *nothing*..
// **Returns**:
// *{string}* A string representation of the dateTime in the xsd:dateTime format.
    xsdDateTime : function(date) {
        function pad(n) {
            var s = n.toString();
            return s.length < 2 ? '0'+s : s;
        }

        var yyyy = date.getFullYear();
        var mm1  = pad(date.getMonth()+1);
        var dd   = pad(date.getDate());
        var hh   = pad(date.getHours());
        var mm2  = pad(date.getMinutes());
        var ss   = pad(date.getSeconds());

        return yyyy +'-' +mm1 +'-' +dd +'T' +hh +':' +mm2 +':' +ss;
    },

// ### VIE.Util.extractLanguageString(entity, attrs, langs)
// This method extracts a literal string from an entity, searching through the given attributes and languages.
// **Parameters**:
// *{```VIE.Entity```}* **entity** An instance of a VIE.Entity.
// *{```array|string```}* **attrs** Either a string or an array of possible attributes.
// *{```array|string```}* **langs** Either a string or an array of possible languages.
// **Throws**:
// *nothing*..
// **Returns**:
// *{string|undefined}* The string that was found at the attribute with the wanted language, undefined if nothing could be found.
// **Example usage**:
//
//          var attrs = ["name", "rdfs:label"];
//          var langs = ["en", "de"];
//          VIE.Util.extractLanguageString(someEntity, attrs, langs); // "Barack Obama";
    extractLanguageString : function(entity, attrs, langs) {
        var p, attr, name, i, n;
        if (entity && typeof entity !== "string") {
            attrs = (_.isArray(attrs))? attrs : [ attrs ];
            langs = (_.isArray(langs))? langs : [ langs ];
            for (p = 0; p < attrs.length; p++) {
                for (var l = 0; l < langs.length; l++) {
                    var lang = langs[l];
                    attr = attrs[p];
                    if (entity.has(attr)) {
                        name = entity.get(attr);
                        name = (_.isArray(name))? name : [ name ];
                        for (i = 0; i < name.length; i++) {
                            n = name[i];
                            if (n.isEntity) {
                                n = VIE.Util.extractLanguageString(n, attrs, lang);
                            } else if (typeof n === "string") {
                                n = n;
                            } else {
                                n = "";
                            }
                            if (n && n.indexOf('@' + lang) > -1) {
                                return n.replace(/"/g, "").replace(/@[a-z]+/, '').trim();
                            }
                        }
                    }
                }
            }
            /* let's do this again in case we haven't found a name but are dealing with
            broken data where no language is given */
            for (p = 0; p < attrs.length; p++) {
                attr = attrs[p];
                if (entity.has(attr)) {
                    name = entity.get(attr);
                    name = (_.isArray(name))? name : [ name ];
                    for (i = 0; i < name.length; i++) {
                        n = name[i];
                        if (n.isEntity) {
                            n = VIE.Util.extractLanguageString(n, attrs, []);
                        }
                        if (n && (typeof n === "string") && n.indexOf('@') === -1) {
                            return n.replace(/"/g, "").replace(/@[a-z]+/, '').trim();
                        }
                    }
                }
            }
        }
        return undefined;
    },

// ### VIE.Util.transformationRules(service)
// This returns a default set of rdfQuery rules that transform semantic data into the
// VIE entity types.
// **Parameters**:
// *{object}* **service** An instance of a vie.service.
// **Throws**:
// *nothing*..
// **Returns**:
// *{array}* An array of rules with 'left' and 'right' side.
    transformationRules : function (service) {
        var res = [
            // rule(s) to transform a dbpedia:Person into a VIE:Person
             {
                'left' : [
                    '?subject a dbpedia:Person',
                    '?subject rdfs:label ?label'
                 ],
                 'right': function(ns){
                     return function(){
                         return [
                             jQuery.rdf.triple(this.subject.toString(),
                                 'a',
                                 '<' + ns.base() + 'Person>', {
                                     namespaces: ns.toObj()
                                 }),
                             jQuery.rdf.triple(this.subject.toString(),
                                 '<' + ns.base() + 'name>',
                                 this.label, {
                                     namespaces: ns.toObj()
                                 })
                             ];
                     };
                 }(service.vie.namespaces)
             },
             // rule(s) to transform a foaf:Person into a VIE:Person
             {
             'left' : [
                     '?subject a foaf:Person',
                     '?subject rdfs:label ?label'
                  ],
                  'right': function(ns){
                      return function(){
                          return [
                              jQuery.rdf.triple(this.subject.toString(),
                                  'a',
                                  '<' + ns.base() + 'Person>', {
                                      namespaces: ns.toObj()
                                  }),
                              jQuery.rdf.triple(this.subject.toString(),
                                  '<' + ns.base() + 'name>',
                                  this.label, {
                                      namespaces: ns.toObj()
                                  })
                              ];
                      };
                  }(service.vie.namespaces)
              },
             // rule(s) to transform a dbpedia:Place into a VIE:Place
             {
                 'left' : [
                     '?subject a dbpedia:Place',
                     '?subject rdfs:label ?label'
                  ],
                  'right': function(ns) {
                      return function() {
                          return [
                          jQuery.rdf.triple(this.subject.toString(),
                              'a',
                              '<' + ns.base() + 'Place>', {
                                  namespaces: ns.toObj()
                              }),
                          jQuery.rdf.triple(this.subject.toString(),
                                  '<' + ns.base() + 'name>',
                              this.label.toString(), {
                                  namespaces: ns.toObj()
                              })
                          ];
                      };
                  }(service.vie.namespaces)
              },
             // rule(s) to transform a dbpedia:City into a VIE:City
              {
                 'left' : [
                     '?subject a dbpedia:City',
                     '?subject rdfs:label ?label',
                     '?subject dbpedia:abstract ?abs',
                     '?subject dbpedia:country ?country'
                  ],
                  'right': function(ns) {
                      return function() {
                          return [
                          jQuery.rdf.triple(this.subject.toString(),
                              'a',
                              '<' + ns.base() + 'City>', {
                                  namespaces: ns.toObj()
                              }),
                          jQuery.rdf.triple(this.subject.toString(),
                                  '<' + ns.base() + 'name>',
                              this.label.toString(), {
                                  namespaces: ns.toObj()
                              }),
                          jQuery.rdf.triple(this.subject.toString(),
                                  '<' + ns.base() + 'description>',
                              this.abs.toString(), {
                                  namespaces: ns.toObj()
                              }),
                          jQuery.rdf.triple(this.subject.toString(),
                                  '<' + ns.base() + 'containedIn>',
                              this.country.toString(), {
                                  namespaces: ns.toObj()
                              })
                          ];
                      };
                  }(service.vie.namespaces)
              }
        ];
        return res;
    },

    getAdditionalRules : function (service) {

        var mapping = {
            Work : "CreativeWork",
            Film : "Movie",
            TelevisionEpisode : "TVEpisode",
            TelevisionShow : "TVSeries", // not listed as equivalent class on dbpedia.org
            Website : "WebPage",
            Painting : "Painting",
            Sculpture : "Sculpture",

            Event : "Event",
            SportsEvent : "SportsEvent",
            MusicFestival : "Festival",
            FilmFestival : "Festival",

            Place : "Place",
            Continent : "Continent",
            Country : "Country",
            City : "City",
            Airport : "Airport",
            Station : "TrainStation", // not listed as equivalent class on dbpedia.org
            Hospital : "GovernmentBuilding",
            Mountain : "Mountain",
            BodyOfWater : "BodyOfWater",

            Company : "Organization",
            Person : "Person"
        };

        var additionalRules = [];
        _.each(mapping, function (map, key) {
            var tripple = {
                'left' : [ '?subject a dbpedia:' + key, '?subject rdfs:label ?label' ],
                'right' : function(ns) {
                    return function() {
                        return [ jQuery.rdf.triple(this.subject.toString(), 'a', '<' + ns.base() + map + '>', {
                            namespaces : ns.toObj()
                        }), jQuery.rdf.triple(this.subject.toString(), '<' + ns.base() + 'name>', this.label.toString(), {
                            namespaces : ns.toObj()
                        }) ];
                    };
                }(service.vie.namespaces)
            };
            additionalRules.push(tripple);
        });
        return additionalRules;
    }
};
