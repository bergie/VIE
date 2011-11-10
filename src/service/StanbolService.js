// File:   StanbolService.js
// Author: <a href="mailto:sebastian.germesin@dfki.de">Sebastian Germesin</a>
// Author: <a href="mailto:szaby.gruenwald@salzburgresearch.at">Szaby Gruenwald</a>
//
(function(){
VIE.prototype.StanbolService = function(options) {
    var defaults = {
        name : 'stanbol',
        url: 'http://dev.iks-project.eu:8080/',
        defaultProxyUrl : "../utils/proxy/proxy.php",
        namespaces : {
            semdeski : "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#",
            semdeskf : "http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#",
            skos: "http://www.w3.org/2004/02/skos/core#",
            foaf: "http://xmlns.com/foaf/0.1/",
            opengis: "http://www.opengis.net/gml/",
            dbpedia: "http://dbpedia.org/ontology/",
            owl : "http://www.w3.org/2002/07/owl#",
            geonames : "http://www.geonames.org/ontology#",
            enhancer : "http://fise.iks-project.eu/ontology/",
            entityhub: "http://www.iks-project.eu/ontology/rick/model/",
            entityhub2: "http://www.iks-project.eu/ontology/rick/query/",
            rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            rdfschema: "http://www.w3.org/2000/01/rdf-schema#",
            dc  : 'http://purl.org/dc/terms/',
            foaf: 'http://xmlns.com/foaf/0.1/',
            schema: 'http://schema.org/',
            geo: 'http://www.w3.org/2003/01/geo/wgs84_pos#'
        }
    };
    this.options = jQuery.extend(true, defaults, options ? options : {});

    this.vie = null; // will be set via VIE.use();
    this.name = this.options.name;
    this.connector = new StanbolConnector(this.options);
    
    jQuery.ajaxSetup({
        converters: {"text application/rdf+json": function(s){return JSON.parse(s);}}
    });

};

VIE.prototype.StanbolService.prototype = {
    init: function(){
        
        for (var key in this.options.namespaces) {
            try {
                var val = this.options.namespaces[key];
                this.vie.namespaces.add(key, val);
            } catch (e) {
                //this means that the namespace is already in the VIE.namespace
                //ignore for now!
            }
        }
        this.namespaces = new this.vie.Namespaces(this.vie.namespaces.base(), this.options.namespaces);
        
        this.rules = [
            //rule to add backwards-relations to the triples
            //this makes querying for entities a lot easier!
            {'left' : [
                '?subject a <http://fise.iks-project.eu/ontology/EntityAnnotation>',
                '?subject enhancer:entity-type ?type',
                '?subject enhancer:confidence ?confidence',
                '?subject enhancer:entity-reference ?entity',
                '?subject dc:relation ?relation',
                '?relation a <http://fise.iks-project.eu/ontology/TextAnnotation>',
                '?relation enhancer:selected-text ?selected-text',
                '?relation enhancer:selection-context ?selection-context',
                '?relation enhancer:start ?start',
                '?relation enhancer:end ?end'
            ],
             'right' : [
                 '?entity a ?type',
                 '?entity enhancer:hasTextAnnotation ?relation',
                 '?entity enhancer:hasEntityAnnotation ?subject'
             ]
             },
             //rule(s) to transform a Stanbol person into a VIE person
             {
                'left' : [
                    '?subject a dbpedia:Person',
                    '?subject rdfschema:label ?label'
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
                 }(this.namespaces)
             },
             {
             'left' : [
                     '?subject a foaf:Person',
                     '?subject rdfschema:label ?label'
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
                  }(this.namespaces)
              },
             {
                 'left' : [
                     '?subject a dbpedia:Place',
                     '?subject rdfschema:label ?label'
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
                  }(this.namespaces)
              },
        ];
        
        this.vie.types.addOrOverwrite('enhancer:EntityAnnotation', [
            //TODO: add attributes
        ]).inherit("Thing");
        this.vie.types.addOrOverwrite('enhancer:TextAnnotation', [
            //TODO: add attributes
        ]).inherit("Thing");
        this.vie.types.addOrOverwrite('enhancer:Enhancement', [
            //TODO: add attributes
        ]).inherit("Thing");
    },
    // VIE API analyze implementation
    analyze: function(analyzable) {
        var service = this;

        var correct = analyzable instanceof this.vie.Analyzable;
        if (!correct) {throw "Invalid Analyzable passed";}

        var element = analyzable.options.element ? analyzable.options.element : jQuery('body');

        var text = service._extractText(element);

        if (text.length > 0) {
            var service = this;
            //query enhancer with extracted text
            var success = function (results) {
                var entities = service._enhancer2Entities(service, results);
                analyzable.resolve(entities);
            };
            var error = function (e) {
                analyzable.reject(e);
            };

            this.connector.analyze(text, success, error);

        } else {
            console.warn("No text found in element.");
            analyzable.resolve([]);
        }

    },
    
    // VIE API load implementation
    // Runs a Stanbol entityhub find
    find: function(findable){
        var correct = findable instanceof this.vie.Findable;
        if (!correct) {throw "Invalid Findable passed";}
        var service = this;
        // The term to find, * as wildcard allowed
        var term = escape(findable.options.term);
        if(!term){
            console.warn("StanbolConnector: No term to look for!");
            findable.resolve([]);
        };
        var limit = (typeof findable.options.limit === "undefined") ? 20 : findable.options.limit;
        var offset = (typeof findable.options.offset === "undefined") ? 0 : findable.options.offset;
        var success = function (results) {
            var entities = service._enhancer2Entities(service, results);
            findable.resolve(entities);
        };
        var error = function (e) {
            findable.reject(e);
        };
        this.connector.find(term, limit, offset, success, error);
    },
    
    // VIE API load implementation
    // Runs a Stanbol entityhub find
    load: function(loadable){
        var correct = loadable instanceof this.vie.Loadable;
        if (!correct) {throw "Invalid Loadable passed";}
        var service = this;
        
        var entity = loadable.options.entity;
        if(!entity){
            console.warn("StanbolConnector: No entity to look for!");
            loadable.resolve([]);
        };
        var success = function (results) {
            var entities = service._enhancer2Entities(service, results);
            loadable.resolve(entities);
        };
        var error = function (e) {
            loadable.reject(e);
        };
        this.connector.load(entity, success, error);
    },
    
    _extractText: function (element) {
        if (element.get(0) && 
            element.get(0).tagName && 
            (element.get(0).tagName == 'TEXTAREA' ||
            element.get(0).tagName == 'INPUT' && element.attr('type', 'text'))) {
            return element.get(0).val();
        }
        else {
            return element
                .text()    //get the text of element
                .replace(/\s+/g, ' ') //collapse multiple whitespaces
                .replace(/\0\b\n\r\f\t/g, '').trim(); // remove non-letter symbols
        }
    },

    _enhancer2Entities: function (service, results) {
        //transform data from Stanbol into VIE.Entities

        if (typeof jQuery.rdf !== 'function') {
            return this._enhancer2EntitiesNoRdfQuery(service, results);
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

    _enhancer2EntitiesNoRdfQuery: function (service, results) {
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

var StanbolConnector = function(options){
    this.options = options;
    this.baseUrl = options.url.replace(/\/$/, '');
    this.enhancerUrlPrefix = "/engines";
    this.entityhubUrlPrefix = "/entityhub";
    //TODO: this.ontonetUrlPrefix = "/ontonet";
    //TODO: this.rulesUrlPrefix = "/rules";
    //TODO: this.factstoreUrlPrefix = "/factstore";
};
StanbolConnector.prototype = {
    
    analyze: function(text, success, error, options) {
        if (!options) { options = {}; }
        var enhancerUrl = this.baseUrl + this.enhancerUrlPrefix;
        var proxyUrl = this._proxyUrl();
        var format = options.format || "application/rdf+json";

        if (typeof exports !== "undefined" && typeof process !== "undefined") {
            // We're on Node.js, don't use jQuery.ajax
            return this.analyzeNode(enhancerUrl, text, success, error, options, format);
        }
        
        jQuery.ajax({
            success: function(response){
                success(response);
            },
            error: error,
            type: "POST",
            url: proxyUrl || enhancerUrl,
            data: (proxyUrl) ? {
                    proxy_url: enhancerUrl, 
                    content: text,
                    verb: "POST",
                    format: format
                } : text,
            dataType: format,
            contentType: proxyUrl ? undefined : "text/plain",
            accepts: {"application/rdf+json": "application/rdf+json"}

        });
    },

    analyzeNode: function(url, text, success, error, options, format) {
        var request = require('request');
        var r = request({
            method: "POST",
            uri: url,
            body: text,
            headers: {
                Accept: format
            }
        }, function(error, response, body) {
            success({results: JSON.parse(body)});
        });
        r.end();
    },
    
    load: function (uri, success, error, options) {
        if (!options) { options = {}; }
        uri = uri.replace(/^</, '').replace(/>$/, '');
        var url = this.baseUrl + this.entityhubUrlPrefix + "/sites/entity?id=" + escape(uri);
        var proxyUrl = this._proxyUrl();
        var format = options.format || "application/rdf+json";
        
        jQuery.ajax({
            success: function(response){
                success(response);
            },
            error: error,
            type: (proxyUrl) ? "POST" : "GET",
            url: proxyUrl || url,
            data: (proxyUrl) ? {
                    proxy_url: url, 
                    content: "",
                    verb: "GET",
                    format: format
                } : null,
            dataType: format,
            contentType: proxyUrl ? undefined : "text/plain",
            accepts: {"application/rdf+json": "application/rdf+json"}
        });
    },
    
    find: function (term, limit, offset, success, error, options) {
        // curl -X POST -d "name=Bishofsh&limit=10&offset=0" http://localhost:8080/entityhub/sites/find
        if (!options) { options = {}; }
        if (offset == null) {
            offset = 0;
        }
        if (limit == null) {
            limit = 10;
        }
        
        var url = this.baseUrl + this.entityhubUrlPrefix + "/sites/find";
        var proxyUrl = this._proxyUrl();
        var format = options.format || "application/rdf+json";
        
        jQuery.ajax({
            success: function(response){
                success(response);
            },
            error: error,
            type: "POST",
            url: proxyUrl || url,
            data: (proxyUrl) ? {
                    proxy_url: url, 
                    content: {
                        name : term,
                        limit : limit,
                        offset: offset
                    },
                    verb: "POST",
                    format: format,
                    type: "text/plain"
                } : "name=" + term + "&limit=" + limit + "&offset=" + offset,
            dataType: format,
            accepts: {"application/rdf+json": "application/rdf+json"}
        });
    },
    
    _proxyUrl: function(){
        this.proxyUrl = "";
        if(this.baseUrl.indexOf(":") !== -1 && !this.options.proxyDisabled){
            return this.options.proxyUrl || this.options.defaultProxyUrl;
        } else {
            return '';
        }
    }
};
})();

