//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     (c) 2011 Sebastian Germesin, IKS Consortium
//     (c) 2011 Szaby Grünwald, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://viejs.org/
(function(){
VIE.prototype.StanbolService = function(options) {
    var defaults = {
        name : 'stanbol',
        // you can also pass an array of URLs which are then tried sequentially
        url: ["http://dev.iks-project.eu/stanbolfull"],
        namespaces : {
            semdeski : "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#",
            semdeskf : "http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#",
            skos: "http://www.w3.org/2004/02/skos/core#",
            foaf: "http://xmlns.com/foaf/0.1/",
            opengis: "http://www.opengis.net/gml/",
            dbpedia: "http://dbpedia.org/ontology/",
            dbprop: "http://dbpedia.org/property/",
            owl : "http://www.w3.org/2002/07/owl#",
            geonames : "http://www.geonames.org/ontology#",
            enhancer : "http://fise.iks-project.eu/ontology/",
            entityhub: "http://www.iks-project.eu/ontology/rick/model/",
            entityhub2: "http://www.iks-project.eu/ontology/rick/query/",
            rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            rdfs: "http://www.w3.org/2000/01/rdf-schema#",
            dcterms  : 'http://purl.org/dc/terms/',
            schema: 'http://schema.org/',
            geo: 'http://www.w3.org/2003/01/geo/wgs84_pos#'
        }
    };
    this.options = jQuery.extend(true, defaults, options ? options : {});

    this.vie = null; /* will be set via VIE.use(); */
    this.name = this.options.name;
    this.connector = new StanbolConnector(this.options);

    jQuery.ajaxSetup({
        converters: {"text application/rdf+json": function(s){return JSON.parse(s);}}
    });

};

VIE.prototype.StanbolService.prototype = {
    init: function(){

        for (var key in this.options.namespaces) {
            var val = this.options.namespaces[key];
            this.vie.namespaces.add(key, val);
        }
        this.namespaces = this.vie.namespaces;

        this.rules = [
            /* rule to add backwards-relations to the triples
             * this makes querying for entities a lot easier!
             */
            {'left' : [
                '?subject a <http://fise.iks-project.eu/ontology/EntityAnnotation>',
                '?subject enhancer:entity-type ?type',
                '?subject enhancer:confidence ?confidence',
                '?subject enhancer:entity-reference ?entity',
                '?subject dcterms:relation ?relation',
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
             /* rule(s) to transform a Stanbol person into a VIE person */
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
                 }(this.namespaces)
             },
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
                  }(this.namespaces)
              },
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
                  }(this.namespaces)
              },
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
                              '<' + ns.base() + 'Place>', {
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
                  }(this.namespaces)
              },
        ];

        this.vie.types.addOrOverwrite('enhancer:EntityAnnotation', [
            /*TODO: add attributes */
        ]).inherit("owl:Thing");
        this.vie.types.addOrOverwrite('enhancer:TextAnnotation', [
            /*TODO: add attributes */
        ]).inherit("owl:Thing");
        this.vie.types.addOrOverwrite('enhancer:Enhancement', [
            /*TODO: add attributes */
        ]).inherit("owl:Thing");
    },
    // VIE API analyze implementation
    analyze: function(analyzable) {
        var service = this;

        var correct = analyzable instanceof this.vie.Analyzable;
        if (!correct) {throw "Invalid Analyzable passed";}

        var element = analyzable.options.element ? analyzable.options.element : jQuery('body');

        var text = service._extractText(element);

        if (text.length > 0) {
            //query enhancer with extracted text
            var success = function (results) {
                _.defer(function(){
                    var entities = VIE.Util.rdf2Entities(service, results);
                    analyzable.resolve(entities);
                });
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
    find: function (findable) {
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
            _.defer(function(){
                var entities = VIE.Util.rdf2Entities(service, results);
                findable.resolve(entities);
            });
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
            _.defer(function(){
                var entities = VIE.Util.rdf2Entities(service, results);
                loadable.resolve(entities);
            });
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
            var res = element
                .text()    //get the text of element
                .replace(/\s+/g, ' ') //collapse multiple whitespaces
                .replace(/\0\b\n\r\f\t/g, ''); // remove non-letter symbols
            return jQuery.trim(res);
        }
    }
};

var StanbolConnector = function(options){
    this.options = options;
    this.baseUrl = (_.isArray(options.url))? options.url : [ options.url ];
    this.enhancerUrlPrefix = "/engines";
    this.entityhubUrlPrefix = "/entityhub";
    //TODO: this.ontonetUrlPrefix = "/ontonet";
    //TODO: this.rulesUrlPrefix = "/rules";
    //TODO: this.factstoreUrlPrefix = "/factstore";
};
StanbolConnector.prototype = {

    analyze: function(text, success, error, options) {
        if (!options) { options = { urlIndex : 0}; }
        if (options.urlIndex >= this.baseUrl.length) {
            error("Could not connect to the given Stanbol endpoints! Please check for their setup!");
            return;
        }
        
        var enhancerUrl = this.baseUrl[options.urlIndex].replace(/\/$/, '');
        enhancerUrl += this.enhancerUrlPrefix;
        
        var format = options.format || "application/rdf+json";
        
        var retryErrorCb = function (c, t, s, e, o) {
            return  function () {
                c.analyze(t, s, e, _.extend(o, {urlIndex : o.urlIndex+1}));
            };
        }(this, text, success, error, options);

        if (typeof exports !== "undefined" && typeof process !== "undefined") {
            // We're on Node.js, don't use jQuery.ajax
            return this.analyzeNode(enhancerUrl, text, success, retryErrorCb, options, format);
        }

        jQuery.ajax({
            success: function(response){
                success(response);
            },
            error: retryErrorCb,
            type: "POST",
            url: enhancerUrl,
            data: text,
            dataType: format,
            contentType: "text/plain",
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
        if (!options) { options = { urlIndex : 0}; }
        if (options.urlIndex >= this.baseUrl.length) {
            error("Could not connect to the given Stanbol endpoints! Please check for their setup!");
            return;
        }
        
        uri = uri.replace(/^</, '').replace(/>$/, '');
        var url = this.baseUrl[options.urlIndex].replace(/\/$/, '');
        url += this.entityhubUrlPrefix + "/sites/entity?id=" + escape(uri);
        
        var format = options.format || "application/rdf+json";
        
        var retryErrorCb = function (c, u, s, e, o) {
            return  function () {
                c.load(u, s, e, _.extend(o, {urlIndex : o.urlIndex+1}));
            };
        }(this, uri, success, error, options);
        
        jQuery.ajax({
            success: function(response){
                success(response);
            },
            error: retryErrorCb,
            type: "GET",
            url: url,
            data: null,
            dataType: format,
            contentType: "text/plain",
            accepts: {"application/rdf+json": "application/rdf+json"}
        });
    },

    find: function (term, limit, offset, success, error, options) {
        // curl -X POST -d "name=Bishofsh&limit=10&offset=0" http://localhost:8080/entityhub/sites/find
        if (!options) { options = { urlIndex : 0}; }
        
        if (options.urlIndex >= this.baseUrl.length) {
            error("Could not connect to the given Stanbol endpoints! Please check for their setup!");
            return;
        }
        
        var url = this.baseUrl[options.urlIndex].replace(/\/$/, '');
        url += this.entityhubUrlPrefix + "/sites/find";
        
        var format = options.format || "application/rdf+json";
        
        if (offset == null) {
            offset = 0;
        }
        if (limit == null) {
            limit = 10;
        }
        
        var retryErrorCb = function (c, t, l, of, s, e, o) {
            return  function () {
                c.find(t, l, of, s, e, _.extend(o, {urlIndex : o.urlIndex+1}));
            };
        }(this, term, limit, offset, success, error, options);
        
        jQuery.ajax({
            success: function(response){
                success(response);
            },
            error: retryErrorCb,
            type: "POST",
            url: url,
            data: "name=" + term + "&limit=" + limit + "&offset=" + offset,
            dataType: format,
            accepts: {"application/rdf+json": "application/rdf+json"}
        });
    }
};
})();

