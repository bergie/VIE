// File:   Util.js <br />
// Author: <a href="http://github.com/neogermi/">Sebastian Germesin</a>
//

// Utilities for the day-to-day VIE.js usage

// extension to jQuery to compare two arrays on equality
// found: <a href="http://stackoverflow.com/questions/1773069/using-jquery-to-compare-two-arrays">http://stackoverflow.com/questions/1773069/using-jquery-to-compare-two-arrays</a>
jQuery.fn.compare = function(t) {
    if (this.length !== t.length) { return false; }
    var a = this.sort(),
        b = t.sort();
    for (var i = 0; t[i]; i++) {
        if (a[i] !== b[i]) { 
                return false;
        }
    }
    return true;
};

// Extension to the JS native Array implementation to remove values from an array.
// from: <a href="http://sebastian.germes.in/blog/2011/09/javascripts-missing-array-remove-function/">http://sebastian.germes.in/blog/2011/09/javascripts-missing-array-remove-function/</a>
if (!Array.prototype.remove) {
  Array.prototype.remove = function () {
    var args = this.remove.arguments;
    var i;

    if (args[0] && args[0] instanceof Array) {
      var a = args[0];
      for (i = 0; i < a.length; i++) {
        this.remove(a[i]);
      }
    } else {
      for (i = 0; i < args.length; i++) {
        while(true) {
          var index = this.indexOf(args[i]);
          if (index !== -1) {
            this.splice(index, 1);
          } else {
            break;
          }
        }
      }
    }
  return this;
  };
}

//Extension to the JS native Array implementation to remove duplicates from an array.
//This actually leaves the original Array untouched and returns a copy with no duplicates.
if (!Array.prototype.unduplicate) {
	Array.prototype.unduplicate = function () {
	    var sorted_arr = this.sort();
	    var results = [];
	    for (var i = 0; i < sorted_arr.length; i++) {
	        if (i === sorted_arr.length-1 || sorted_arr[i] !== sorted_arr[i+1]) {
	            results.push(sorted_arr[i]);
	        }
	    }
	    return results;
	};
} 


VIE.Util = {
		// converts a given URI into a CURIE (or save CURIE), based
		// on the given VIE.Namespaces object.
	toCurie : function (uri, safe, namespaces) {
        if (VIE.Util.isCurie(uri, namespaces)) {
            return uri;
        }
        var delim = ":";
        for (var k in namespaces.toObj()) {
            if (uri.indexOf(namespaces.get(k)) === 1) {
                var pattern = new RegExp("^" + "<" + namespaces.get(k));
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

	// checks, whether the given string is a CURIE.
    isCurie : function (something, namespaces) {
        try {
            VIE.Util.toUri(something, namespaces);
            return true;
        } catch (e) {
            return false;
        }
    },

	// converts a given CURIE (or save CURIE) into a URI, based
	// on the given VIE.Namespaces object.
    toUri : function (curie, namespaces) {
        var delim = ":";
        for (var k in namespaces.toObj()) {
            if (k !== "" && (curie.indexOf(k) === 0 || curie.indexOf(k) === 1)) {
                var pattern = new RegExp("^" + "\\[{0,1}" + k + delim);
                return "<" + curie.replace(pattern, namespaces.get(k)).replace(/\]{0,1}$/, '') + ">";
            }
        }
        //default:
        if (curie.indexOf(delim) === -1 && namespaces.base()) {
            return "<" + namespaces.base() + curie + ">";
        }
        throw new Error("No prefix found for CURIE '" + curie + "'!");
    },
    
    // checks, whether the given string is a URI.
    isUri : function (something) {
        return (typeof something === "string" && something.search(/^<.+:.+>$/) === 0);
    },
    
    _blankNodeSeed : new Date().getTime() % 1000,
    
    // generates a new blank node ID
    blankNodeID : function () {
      this._blankNodeSeed += 1;
      return '_:bnode' + this._blankNodeSeed.toString(16);
    },
    
    // this method converts rdf/json data from an external service
    // into VIE.Entities. (this has been embedded in the StanbolService
    // but as it is needed in other services, too, it made sense to 
    // put it into the utils.)
    rdf2Entities: function (service, results) {
        //transform data from Stanbol into VIE.Entities

        if (typeof jQuery.rdf !== 'function') {
            return VIE.Util.rdf2EntitiesNoRdfQuery(service, results);
        }
        var rdf = jQuery.rdf().load(results, {});

        //execute rules here!
        if (service.rules) {
            var rules = jQuery.rdf.ruleset();
            for (var prefix in service.namespaces.toObj()) {
                if (prefix !== "") {
                    rules.prefix(prefix, service.namespaces.get(prefix));
                }
            }
            for (var i = 0; i < service.rules.length; i++) {
                rules.add(service.rules[i]['left'], service.rules[i]['right']);
            }
            rdf = rdf.reason(rules, 10); // execute the rules only 10 times to avoid looping
        }
        var entities = {};
        rdf.where('?subject ?property ?object').each(function() {
            var subject = this.subject.toString();
            if (!entities[subject]) {
                entities[subject] = {
                    '@subject': subject,
                    '@context': service.namespaces.toObj(),
                    '@type': []
                };
            }
            var propertyUri = this.property.toString();
            var propertyCurie;

            propertyUri = propertyUri.substring(1, propertyUri.length - 1);
            try {
                property = jQuery.createCurie(propertyUri, {namespaces: service.namespaces.toObj()});
            } catch (e) {
                property = propertyUri;
                console.warn(propertyUri + " doesn't have a namespace definition in '", service.namespaces.toObj());
            }
            entities[subject][property] = entities[subject][property] || [];

            function getValue(rdfQueryLiteral){
                if(typeof rdfQueryLiteral.value === "string"){
                    if (rdfQueryLiteral.lang)
                        return rdfQueryLiteral.toString();
                    else
                        return rdfQueryLiteral.value;
                    return rdfQueryLiteral.value.toString();
                } else if (rdfQueryLiteral.type === "uri"){
                    return rdfQueryLiteral.toString();
                } else {
                    return rdfQueryLiteral.value;
                }
            }
            entities[subject][property].push(getValue(this.object));
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

        var vieEntities = [];
        jQuery.each(entities, function() {
            var entityInstance = new service.vie.Entity(this);
            entityInstance = service.vie.entities.addOrUpdate(entityInstance);
            vieEntities.push(entityInstance);
        });
        return vieEntities;
    },
    
    // helper if no rdfQuery can be loaded.
    rdf2EntitiesNoRdfQuery: function (service, results) {
        jsonLD = [];
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
    }
    
};
