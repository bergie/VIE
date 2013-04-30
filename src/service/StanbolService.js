//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     (c) 2011 Sebastian Germesin, IKS Consortium
//     (c) 2011 Szaby Grünwald, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://viejs.org/
/*global escape:false */

// ## VIE - StanbolService service
// The StanbolService service allows a VIE developer to directly query
// the <a href="http://incubator.apache.org/stanbol/">Apache Stanbol</a> entityhub for entities and their properties.
// Furthermore, it gives access to the enhance facilities of
// Stanbol to analyze content and semantically enrich it.
(function(){
var defaultStanbolUris = ["http://demo.iks-project.eu/stanbolfull", "http://dev.iks-project.eu/stanbolfull"];

// ## VIE.StanbolService(options)
// This is the constructor to instantiate a new service to collect
// properties of an entity from <a href="http://incubator.apache.org/stanbol/">Apache Stanbol</a>.
// **Parameters**:
// *{object}* **options** Optional set of fields, ```namespaces```, ```rules```, ```url```, or ```name```.
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.StanbolService}* : A **new** VIE.StanbolService instance.
// **Example usage**:
//
//     var stnblService = new vie.StanbolService({<some-configuration>});
VIE.prototype.StanbolService = function(options) {
    var defaults = {
        /* the default name of this service */
        name : 'stanbol',
        /* you can pass an array of URLs which are then tried sequentially */
        url: defaultStanbolUris,
        timeout : 20000, /* 20 seconds timeout */
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
        },
        /* default rules that are shipped with this service */
        rules : [
            /* rule to add backwards-relations to the triples
             * this makes querying for entities a lot easier!
             */
            {
                'left' : [
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
            }
        ],
        enhancer : {
            chain : "default"
        },
        entityhub : {
            /* if set to undefined, the Referenced Site Manager @ /entityhub/sites is used. */
            /* if set to, e.g., dbpedia, eferenced Site @ /entityhub/site/dbpedia is used. */
            site : undefined
        }
    };
    /* the options are merged with the default options */
    this.options = jQuery.extend(true, defaults, options ? options : {});

    this.vie = null; /* will be set via VIE.use(); */
    /* overwrite options.name if you want to set another name */
    this.name = this.options.name;

};

VIE.prototype.StanbolService.prototype = {

// ### init()
// This internal method initializes certain properties of the service and is called
// via ```VIE.use()```.
// **Parameters**:
// *nothing*
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.StanbolService}* : The VIE.StanbolService instance itself.
    init: function(){

        for (var key in this.options.namespaces) {
            var val = this.options.namespaces[key];
            this.vie.namespaces.add(key, val);
        }

        this.rules = jQuery.extend([], VIE.Util.transformationRules(this));
        this.rules = jQuery.merge(this.rules, (this.options.rules) ? this.options.rules : []);

        this.connector = new this.vie.StanbolConnector(this.options);

        /* adding these entity types to VIE helps later the querying */
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

// ### analyze(analyzable)
// This method extracts text from the jQuery element and sends it to Apache Stanbol for analysis.
// **Parameters**:
// *{VIE.Analyzable}* **analyzable** The analyzable.
// **Throws**:
// *{Error}* if an invalid VIE.Analyzable is passed.
// **Returns**:
// *{VIE.StanbolService}* : The VIE.StanbolService instance itself.
// **Example usage**:
//
//     vie.analyze({element : jQuery("#foo")})
//     .using(new vie.StanbolService({<some-configuration>}))
//     .execute().success(callback);
    analyze: function(analyzable) {
        var service = this;

        var correct = analyzable instanceof this.vie.Analyzable;
        if (!correct) {throw "Invalid Analyzable passed";}

        var element = analyzable.options.element ? analyzable.options.element : jQuery('body');

        var text = service._extractText(element);

        if (text.length > 0) {
            /* query enhancer with extracted text */
            var success = function (results) {
                _.defer(function(){
                    var entities = VIE.Util.rdf2Entities(service, results);
                    service.vie.entities.addOrUpdate(entities);
                    analyzable.resolve(entities);
                });
            };
            var error = function (e) {
                analyzable.reject(e);
            };

            var options = {
                chain : (analyzable.options.chain)? analyzable.options.chain : service.options.enhancer.chain
            };

            this.connector.analyze(text, success, error, options);

        } else {
            analyzable.resolve([]);
        }

    },

// ### find(findable)
// This method finds entities given the term from the entity hub.
// **Parameters**:
// *{VIE.Findable}* **findable** The findable.
// **Throws**:
// *{Error}* if an invalid VIE.Findable is passed.
// **Returns**:
// *{VIE.StanbolService}* : The VIE.StanbolService instance itself.
// **Example usage**:
//
//     vie.find({
//         term : "Bischofsh",
//         limit : 10,
//         offset: 0,
//         field: "skos:prefLabel", // used for the term lookup, default: "rdfs:label"
//         properties: ["skos:prefLabel", "rdfs:label"] // are going to be loaded with the result entities
//     })
//     .using(new vie.StanbolService({<some-configuration>}))
//     .execute()
//     .success(callback);
    find: function (findable) {
        var correct = findable instanceof this.vie.Findable;
        if (!correct) {throw "Invalid Findable passed";}
        var service = this;
        /* The term to find, * as wildcard allowed */
        if (!findable.options.term) {
            findable.reject([]);
        }
        var term = findable.options.term;
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

        findable.options.site = (findable.options.site)? findable.options.site : service.options.entityhub.site;

        var vie = this.vie;
        if(findable.options.properties){
            var properties = findable.options.properties;
            findable.options.ldPath = _(properties)
            .map(function(property){
                if (vie.namespaces.isCurie(property)){
                    return vie.namespaces.uri(property) + ";";
                } else {
                    return property;
                }
            })
            .join("");
        }
        if(findable.options.field && vie.namespaces.isCurie(field)){
            var field = findable.options.field;
                findable.options.field = vie.namespaces.uri(field);
        }
        this.connector.find(term, limit, offset, success, error, findable.options);
    },

// ### load(loadable)
// This method loads the entity that is stored within the loadable into VIE.
// **Parameters**:
// *{VIE.Loadable}* **lodable** The loadable.
// **Throws**:
// *{Error}* if an invalid VIE.Loadable is passed.
// **Returns**:
// *{VIE.StanbolService}* : The VIE.StanbolService instance itself.
// **Example usage**:
//     vie.load({
//         entity: "<http://...>"
//     })
//     .using(new vie.StanbolService({<some-configuration>}))
//     .execute()
//     .success(callback);
    load: function(loadable){
        var correct = loadable instanceof this.vie.Loadable;
        if (!correct) {throw "Invalid Loadable passed";}
        var service = this;

        var entity = loadable.options.entity;
        if (!entity){
            loadable.resolve([]);
        }
        var success = function (results) {
            _.defer(function(){
                var entities = VIE.Util.rdf2Entities(service, results);
                _.each(entities, function(vieEntity) {
                    service.vie.entities.addOrUpdate(vieEntity);
                });
                loadable.resolve(entities);
            });
        };
        var error = function (e) {
            loadable.reject(e);
        };

        var options = {
            site : (loadable.options.site)? loadable.options.site : service.options.entityhub.site,
            local : loadable.options.local
        };

        this.connector.load(entity, success, error, options);
    },

 // ### save(savable)
 // This method saves the given entity to the Apache Stanbol installation.
 // **Parameters**:
 // *{VIE.Savable}* **savable** The savable.
 // **Throws**:
 // *{Error}* if an invalid VIE.Savable is passed.
 // **Returns**:
 // *{VIE.StanbolService}* : The VIE.StanbolService instance itself.
 // **Example usage**:
 //
 //      var entity = new vie.Entity({'name' : 'Test Entity'});
 //      var stnblService = new vie.StanbolService({<some-configuration>});
 //      stnblService.save(new vie.Savable(entity));
     save: function(savable){
         var correct = savable instanceof this.vie.Savable;
         if (!correct) {throw "Invalid Savable passed";}
         var service = this;

         var entity = savable.options.entity;
         if (!entity){
             savable.reject("StanbolConnector: No entity to save!");
         }
         var success = function (results) {
             _.defer(function() {
                 var entities = VIE.Util.rdf2Entities(service, results);
                 savable.resolve(entities);
             });
         };

         var error = function (e) {
             savable.reject(e);
         };

         var options = {
            site : (savable.options.site)? savable.options.site : service.options.entityhub.site,
            local : savable.options.local
         };

         this.connector.save(entity, success, error, options);
     },

    /* this private method extracts text from a jQuery element */
    _extractText: function (element) {
        if (element.get(0) &&
            element.get(0).tagName &&
            (element.get(0).tagName == 'TEXTAREA' ||
            element.get(0).tagName == 'INPUT' && element.attr('type', 'text'))) {
            return element.get(0).val();
        }
        else {
            var res = element
                .text()    /* get the text of element */
                .replace(/\s+/g, ' ') /* collapse multiple whitespaces */
                .replace(/\0\b\n\r\f\t/g, ''); /* remove non-letter symbols */
            return jQuery.trim(res);
        }
    }
};

// ## VIE.StanbolConnector(options)
// The StanbolConnector is the connection between the VIE Stanbol service
// and the actual ajax calls.
// **Parameters**:
// *{object}* **options** The options.
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.StanbolConnector}* : The **new** VIE.StanbolConnector instance.
// **Example usage**:
//
//     var stnblConn = new vie.StanbolConnector({<some-configuration>});
VIE.prototype.StanbolConnector = function (options) {

    var defaults =  {
        /* you can pass an array of URLs which are then tried sequentially */
        url: defaultStanbolUris,
        timeout : 20000, /* 20 seconds timeout */
        enhancer : {
            urlPostfix : "/enhancer",
            chain : "default"
        },
        entityhub : {
            /* if set to undefined, the Referenced Site Manager @ /entityhub/sites is used. */
            /* if set to, e.g., dbpedia, referenced Site @ /entityhub/site/dbpedia is used. */
            site : undefined,
            urlPostfix : "/entityhub",
            local : false
        },
        sparql : {
            urlPostfix : "/sparql"
        },
        contenthub : {
            urlPostfix : "/contenthub",
            index : "contenthub"
        },
        ontonet : {
            urlPostfix : "/ontonet"
        },
        factstore : {
            urlPostfix : "/factstore"
        },
        rules : {
            urlPostfix : "/rules"
        },
        cmsadapter : {
            urlPostfix : "/cmsadapter"
        }
    };

    /* the options are merged with the default options */
    this.options = jQuery.extend(true, defaults, options ? options : {});
    this.options.url = (_.isArray(this.options.url))? this.options.url : [ this.options.url ];

    this._init();

    this.baseUrl = (_.isArray(options.url))? options.url : [ options.url ];
};

VIE.prototype.StanbolConnector.prototype = {

// ### _init()
// Basic setup of the stanbol connector.  This is called internally by the constructor!
// **Parameters**:
// *nothing*
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.StanbolConnector}* : The VIE.StanbolConnector instance itself.
    _init : function () {
        var connector = this;

        /* basic setup for the ajax connection */
        jQuery.ajaxSetup({
            converters: {"text application/rdf+json": function(s){return JSON.parse(s);}},
            timeout: connector.options.timeout
        });

        return this;
    },

    _iterate : function (params) {
        if (!params) { return; }

        if (params.urlIndex >= this.options.url.length) {
            params.error.call(this, "Could not connect to the given Stanbol endpoints! Please check for their setup!");
            return;
        }

        var retryErrorCb = function (c, p) {
            /* in case a Stanbol backend is not responding and
             * multiple URLs have been registered
             */
            return function () {
                p.urlIndex = p.urlIndex+1;
                c._iterate(p);
            };
        }(this, params);

        if (typeof exports !== "undefined" && typeof process !== "undefined") {
            /* We're on Node.js, don't use jQuery.ajax */
            return params.methodNode.call(
                    this,
                    params.url.call(this, params.urlIndex, params.args.options),
                    params.args,
                    params.success,
                    retryErrorCb);
        }

        return params.method.call(
                this,
                params.url.call(this, params.urlIndex, params.args.options),
                params.args,
                params.success,
                retryErrorCb);
    },

// ### analyze(text, success, error, options)
// This method sends the given text to Apache Stanbol returns the result by the success callback.
// **Parameters**:
// *{string}* **text** The text to be analyzed.
// *{function}* **success** The success callback.
// *{function}* **error** The error callback.
// *{object}* **options** Options, like the ```format```, or the ```chain``` to be used.
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.StanbolConnector}* : The VIE.StanbolConnector instance itself.
// **Example usage**:
//
//     var stnblConn = new vie.StanbolConnector(opts);
//     stnblConn.analyze("This is some text.",
//                 function (res) { ... },
//                 function (err) { ... });
    analyze: function(text, success, error, options) {
        options = (options)? options :  {};
        var connector = this;

        connector._iterate({
            method : connector._analyze,
            methodNode : connector._analyzeNode,
            url : function (idx, opts) {
                var chain = (opts.chain)? opts.chain : this.options.enhancer.chain;

                var u = this.options.url[idx].replace(/\/$/, '');
                u += this.options.enhancer.urlPostfix + "/chain/" + chain.replace(/\/$/, '');
                return u;
            },
            args : {
                text : text,
                format : options.format || "application/rdf+json",
                options : options
            },
            success : success,
            error : error,
            urlIndex : 0
        });
    },

    _analyze : function (url, args, success, error) {
        jQuery.ajax({
            success: success,
            error: error,
            url: url,
            type: "POST",
            data: args.text,
            dataType: args.format,
            contentType: "text/plain",
            accepts: {"application/rdf+json": "application/rdf+json"}
        });
    },

    _analyzeNode: function(url, args, success, error) {
        var request = require('request');
        var r = request({
            method: "POST",
            uri: url,
            body: args.text,
            headers: {
                Accept: args.format,
                'Content-Type': 'text/plain'
            }
        }, function(err, response, body) {
            try {
                success({results: JSON.parse(body)});
            } catch (e) {
                error(e);
            }
        });
        r.end();
    },

// ### load(uri, success, error, options)
// This method loads all properties from an entity and returns the result by the success callback.
// **Parameters**:
// *{string}* **uri** The URI of the entity to be loaded.
// *{function}* **success** The success callback.
// *{function}* **error** The error callback.
// *{object}* **options** Options, like the ```format```, the ```site```. If ```local``` is set, only the local entities are accessed.
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.StanbolConnector}* : The VIE.StanbolConnector instance itself.
// **Example usage**:
//
//     var stnblConn = new vie.StanbolConnector(opts);
//     stnblConn.load("<http://dbpedia.org/resource/Barack_Obama>",
//                 function (res) { ... },
//                 function (err) { ... });

    load: function (uri, success, error, options) {
        var connector = this;
        options = (options)? options :  {};

        options.uri = uri.replace(/^</, '').replace(/>$/, '');

        connector._iterate({
            method : connector._load,
            methodNode : connector._loadNode,
            success : success,
            error : error,
            url : function (idx, opts) {
                var site = (opts.site)? opts.site : this.options.entityhub.site;
                site = (site)? "/" + site : "s";

                var isLocal = opts.local;

                var u = this.options.url[idx].replace(/\/$/, '') + this.options.entityhub.urlPostfix;
                if (isLocal) {
                    u += "/entity?id=" + encodeURIComponent(opts.uri);
                } else {
                    u += "/site" + site + "/entity?id=" + encodeURIComponent(opts.uri);
                }
                return u;
            },
            args : {
                format : options.format || "application/rdf+json",
                options : options
            },
            urlIndex : 0
        });
    },

    _load : function (url, args, success, error) {
        jQuery.ajax({
            success: success,
            error: error,
            url: url,
            type: "GET",
            dataType: args.format,
            contentType: "text/plain",
            accepts: {"application/rdf+json": "application/rdf+json"}
        });
    },

    _loadNode: function(url, args, success, error) {
        var request = require('request');
        var r = request({
            method: "GET",
            uri: url,
            body: args.text,
            headers: {
                Accept: args.format
            }
        }, function(err, response, body) {
            try {
                success({results: JSON.parse(body)});
            } catch (e) {
                error(e);
            }
        });
        r.end();
    },

// ### find(term, limit, offset, success, error, options)
// This method finds entities given the term from the entity hub and returns the result by the success callback.
// **Parameters**:
// *{string}* **term** The term to be searched for.
// *{int}* **limit** The limit of results to be returned.
// *{int}* **offset** The offset to be search for.
// *{function}* **success** The success callback.
// *{function}* **error** The error callback.
// *{object}* **options** Options, like the ```format```. If ```local``` is set, only the local entities are accessed.
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.StanbolConnector}* : The VIE.StanbolConnector instance itself.
// **Example usage**:
//
//     var stnblConn = new vie.StanbolConnector(opts);
//     stnblConn.find("Bishofsh", 10, 0,
//                 function (res) { ... },
//                 function (err) { ... });
    find: function(term, limit, offset, success, error, options) {
        options = (options)? options :  {};
        /* curl -X POST -d "name=Bishofsh&limit=10&offset=0" http://localhost:8080/entityhub/sites/find */

        var connector = this;

        if (!term || term === "") {
            error ("No term given!");
            return;
        }

        offset = (offset)? offset : 0;
        limit  = (limit)? limit : 10;

        connector._iterate({
            method : connector._find,
            methodNode : connector._findNode,
            success : success,
            error : error,
            url : function (idx, opts) {
                var site = (opts.site)? opts.site : this.options.entityhub.site;
                site = (site)? "/" + site : "s";

                var isLocal = opts.local;

                var u = this.options.url[idx].replace(/\/$/, '') + this.options.entityhub.urlPostfix;
                if (isLocal) {
                    u += "/sites/find";
                } else {
                    u += "/site" + site + "/find";
                }

                return u;
            },
            args : {
                term : term,
                offset : offset,
                limit : limit,
                format : options.format || "application/rdf+json",
                options : options
            },
            urlIndex : 0
        });
    },

    _find : function (url, args, success, error) {
        var fields={
            "name": args.term,
            "limit": args.limit,
            "offset": args.offset
        };
        jQuery.ajax({
            success: success,
            error: error,
            url: url,
            type: "POST",
            data: jQuery.param(fields),
            dataType: args.format,
            contentType : "application/x-www-form-urlencoded",
            accepts: {"application/rdf+json": "application/rdf+json"}
        });
    },

    _findNode: function(url, args, success, error) {
        var request = require('request');
        var r = request({
            method: "POST",
            uri: url,
            body : "name=" + args.term + "&limit=" + args.limit + "&offset=" + args.offset,
            headers: {
                Accept: args.format
            }
        }, function(err, response, body) {
            try {
                success({results: JSON.parse(body)});
            } catch (e) {
                error(e);
            }
        });
        r.end();
    },

// ### lookup(uri, success, error, options)
// TODO.
// **Parameters**:
// *{string}* **uri** The URI of the entity to be loaded.
// *{function}* **success** The success callback.
// *{function}* **error** The error callback.
// *{object}* **options** Options, ```create```.
//    If the parsed ID is a URI of a Symbol, than the stored information of the Symbol are returned in the requested media type ('accept' header field).
//    If the parsed ID is a URI of an already mapped entity, then the existing mapping is used to get the according Symbol.
//    If "create" is enabled, and the parsed URI is not already mapped to a Symbol, than all the currently active referenced sites are searched for an Entity with the parsed URI.
//    If the configuration of the referenced site allows to create new symbols, than a the entity is imported in the Entityhub, a new Symbol and EntityMapping is created and the newly created Symbol is returned.
//    In case the entity is not found (this also includes if the entity would be available via a referenced site, but create=false) a 404 "Not Found" is returned.
//    In case the entity is found on a referenced site, but the creation of a new Symbol is not allowed a 403 "Forbidden" is returned.
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.StanbolConnector}* : The VIE.StanbolConnector instance itself.
    lookup: function(uri, success, error, options) {
        options = (options)? options :  {};
        /*/lookup/?id=http://dbpedia.org/resource/Paris&create=false"*/
        var connector = this;

        uri = uri.replace(/^</, '').replace(/>$/, '');

        options.uri = uri;
        options.create = (options.create)? options.create : false;

        connector._iterate({
            method : connector._lookup,
            methodNode : connector._lookupNode,
            success : success,
            error : error,
            url : function (idx, opts) {

                 var u = this.options.url[idx].replace(/\/$/, '') + this.options.entityhub.urlPostfix;
                 u += "/lookup?id=" + encodeURIComponent(opts.uri) + "&create=" + opts.create;
                 return u;
            },
            args : {
                format : options.format || "application/rdf+json",
                options : options
            },
            urlIndex : 0
         });
     },

     _lookup : function (url, args, success, error) {
        jQuery.ajax({
             success: success,
             error: error,
             url: url,
             type: "GET",
             dataType: args.format,
             contentType: "text/plain",
             accepts: {"application/rdf+json": "application/rdf+json"}
         });
     },

     _lookupNode: function(url, args, success, error) {
         var request = require('request');
         var r = request({
             method: "GET",
             uri: url,
             body: args.text,
             headers: {
                 Accept: args.format
             }
         }, function(err, response, body) {
             try {
                 success({results: JSON.parse(body)});
             } catch (e) {
                 error(e);
             }
         });
         r.end();
     },

 // ### referenced(success, error, options)
 // This method returns a list of all referenced sites that the entityhub comprises.
 // **Parameters**:
 // *{function}* **success** The success callback.
 // *{function}* **error** The error callback.
 // *{object}* **options** Options, unused here.
 // **Throws**:
 // *nothing*
 // **Returns**:
 // *{VIE.StanbolConnector}* : The VIE.StanbolConnector instance itself.
 // **Example usage**:
 //
//      var stnblConn = new vie.StanbolConnector(opts);
//      stnblConn.referenced(
//                  function (res) { ... },
//                  function (err) { ... });
     referenced: function(success, error, options) {
        options = (options)? options :  {};
        var connector = this;

        var successCB = function (sites) {
          if (!_.isArray(sites)) {
            sites = JSON.parse(sites);
          }
          var sitesStripped = [];
          for (var s = 0, l = sites.length; s < l; s++) {
            sitesStripped.push(sites[s].replace(/.+\/(.+?)\/?$/, "$1"));
          }
          return success(sitesStripped);
        };

        connector._iterate({
            method : connector._referenced,
            methodNode : connector._referencedNode,
            success : successCB,
            error : error,
            url : function (idx, opts) {
                 var u = this.options.url[idx].replace(/\/$/, '');
                 u += this.options.entityhub.urlPostfix + "/sites/referenced";

                return u;
            },
            args : {
                options : options
            },
            urlIndex : 0
         });
     },

     _referenced : function (url, args, success, error) {
        jQuery.ajax({
             success: success,
             error: error,
             url: url,
             type: "GET",
             accepts: {"application/rdf+json": "application/rdf+json"}
         });
     },

     _referencedNode: function(url, args, success, error) {
         var request = require('request');
         var r = request({
             method: "GET",
             uri: url,
             headers: {
                 Accept: args.format
             }
         }, function(err, response, body) {
             try {
                 success({results: JSON.parse(body)});
             } catch (e) {
                 error(e);
             }
         });
         r.end();
     },

// ### sparql(query, success, error, options)
// TODO.
// **Parameters**:
// TODO
// *{function}* **success** The success callback.
// *{function}* **error** The error callback.
// *{object}* **options** Options, unused here.
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.StanbolConnector}* : The VIE.StanbolConnector instance itself.
     sparql: function(query, success, error, options) {
        options = (options)? options :  {};
         var connector = this;

        connector._iterate({
            method : connector._sparql,
            methodNode : connector._sparqlNode,
            success : success,
            error : error,
            url : function (idx, opts) {
                var u = this.options.url[idx].replace(/\/$/, '');
                u += this.options.sparql.urlPostfix.replace(/\/$/, '');

                return u;
            },
            args : {
                query : query,
                options : options
            },
            urlIndex : 0
          });
      },

      _sparql : function (url, args, success, error) {
        jQuery.ajax({
              success: success,
              error: error,
              url: url,
              type: "POST",
              data : "query=" + args.query,
              contentType : "application/x-www-form-urlencoded"
          });
      },

      _sparqlNode: function(url, args, success, error) {
          var request = require('request');
          var r = request({
              method: "POST",
              uri: url,
              body : JSON.stringify({query : args.query}),
              headers: {
                  Accept: args.format
              }
          }, function(err, response, body) {
              try {
                  success({results: JSON.parse(body)});
              } catch (e) {
                  error(e);
              }
          });
          r.end();
      },

// ### ldpath(query, success, error, options)
// TODO.
// **Parameters**:
// TODO
// *{function}* **success** The success callback.
// *{function}* **error** The error callback.
// *{object}* **options** Options, unused here.
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.StanbolConnector}* : The VIE.StanbolConnector instance itself.
    ldpath: function(ldpath, context, success, error, options) {
        options = (options)? options :  {};
        var connector = this;

        context = (_.isArray(context))? context : [ context ];

        var contextStr = "";
        for (var c = 0; c < context.length; c++) {
            contextStr += "&context=" + context[c];
        }

        connector._iterate({
            method : connector._ldpath,
            methodNode : connector._ldpathNode,
            success : success,
            error : error,
            url : function (idx, opts) {
                var site = (opts.site)? opts.site : this.options.entityhub.site;
                site = (site)? "/" + site : "s";

                var isLocal = opts.local;

                var u = this.options.url[idx].replace(/\/$/, '') + this.options.entityhub.urlPostfix;
                if (!isLocal)
                    u += "/site" + site;
                u += "/ldpath";

                return u;
            },
            args : {
                ldpath : ldpath,
                context : contextStr,
                format : options.format || "application/rdf+json",
                options : options
            },
            urlIndex : 0
         });
     },

     _ldpath : function (url, args, success, error) {
        jQuery.ajax({
             success: success,
             error: error,
             url: url,
             type: "POST",
             data : "ldpath=" + args.ldpath + args.context,
             contentType : "application/x-www-form-urlencoded",
             dataType: args.format,
             accepts: {"application/rdf+json": "application/rdf+json"}
         });
     },

     _ldpathNode: function(url, args, success, error) {
         var request = require('request');
         var r = request({
             method: "POST",
             uri: url,
             body : "ldpath=" + args.ldpath + args.context,
             headers: {
                 Accept: args.format
             }
         }, function(err, response, body) {
             try {
                 success({results: JSON.parse(body)});
             } catch (e) {
                 error(e);
             }
         });
         r.end();
     },

// ### uploadContent(content, success, error, options)
// TODO.
// **Parameters**:
// TODO
// *{function}* **success** The success callback.
// *{function}* **error** The error callback.
// *{object}* **options** Options, unused here.
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.StanbolConnector}* : The VIE.StanbolConnector instance itself.
      uploadContent: function(content, success, error, options) {
        options = (options)? options :  {};
        var connector = this;

        connector._iterate({
            method : connector._uploadContent,
            methodNode : connector._uploadContentNode,
            success : success,
            error : error,
            url : function (idx, opts) {
                 var u = this.options.url[idx].replace(/\/$/, '');
                 u += this.options.contenthub.urlPostfix.replace(/\/$/, '');

                 var index = (opts.index)? opts.index : this.options.contenthub.index;

                 u += "/" + index.replace(/\/$/, '');
                 u += "/store";

                 return u;
            },
            args : {
                content: content,
                options : options
            },
            urlIndex : 0
           });
       },

       _uploadContent : function (url, args, success, error) {
           jQuery.ajax({
               success: success,
               error: error,
               url: url,
               type: "POST",
               data : args.content,
               contentType : "text/plain"
           });
       },

       _uploadContentNode: function(url, args, success, error) {
           var request = require('request');
           var r = request({
               method: "POST",
               uri: url,
               body : args.content,
               headers: {
                   Accept: "application/rdf+xml",
                   "Content-Type" : "text/plain"
               }
           }, function(err, response, body) {
               try {
                   success({results: JSON.parse(body)});
               } catch (e) {
                   error(e);
               }
           });
           r.end();
       },

//### createFactSchema(url, schema, success, error, options)
//TODO.
//**Parameters**:
//TODO
//*{function}* **success** The success callback.
//*{function}* **error** The error callback.
//*{object}* **options** Options, unused here.
//**Throws**:
//*nothing*
//**Returns**:
//*{VIE.StanbolConnector}* : The VIE.StanbolConnector instance itself.
      createFactSchema: function(url, schema, success, error, options) {
             options = (options)? options :  {};
             var connector = this;

             options.url = url;

             connector._iterate({
                method : connector._createFactSchema,
                methodNode : connector._createFactSchemaNode,
                success : success,
                error : error,
                url : function (idx, opts) {
                  var u = this.options.url[idx].replace(/\/$/, '');
                  u += this.options.factstore.urlPostfix.replace(/\/$/, '');

                  u += "/facts/" + encodeURIComponent(opts.url);

                  return u;
                },
                args : {
                    url : url,
                    schema : schema,
                    options : options
                },
                urlIndex : 0
            });
        },

        _createFactSchema : function (url, args, success, error) {
               jQuery.ajax({
                success: success,
                error: error,
                url: url,
                type: "PUT",
                data : args.schema,
                contentType : "application/json",
                dataType: "application/json"
            });
        },

        _createFactSchemaNode: function(url, args, success, error) {
            var request = require('request');
            var r = request({
                method: "PUT",
                uri: url,
                body : args.schema,
                headers: {
                    Accept: "application/json",
                    "Content-Type" : "application/json"
                }
            }, function(err, response, body) {
                try {
                    success({results: JSON.parse(body)});
                } catch (e) {
                    error(e);
                }
            });
            r.end();
        },

        createFact: function(fact, success, error, options) {
             options = (options)? options :  {};
             var connector = this;

             connector._iterate({
                method : connector._createFact,
                methodNode : connector._createFactNode,
                success : success,
                error : error,
                url : function (idx, opts) {
                     var u = this.options.url[idx].replace(/\/$/, '');
                     u += this.options.factstore.urlPostfix.replace(/\/$/, '');

                     u += "/facts";

                  return u;
                },
                args : {
                    fact : fact,
                    options : options
                },
                urlIndex : 0
               });
       },

       _createFact : function (url, args, success, error) {
           jQuery.ajax({
               success: success,
               error: error,
               url: url,
               type: "POST",
               data : args.fact,
               contentType : "application/json",
               dataType: "application/json"
           });
       },

       _createFactNode: function(url, args, success, error) {
           var request = require('request');
           var r = request({
               method: "POST",
               uri: url,
               body : args.fact,
               headers: {
                   Accept: "application/json",
                   "Content-Type" : "application/json"
               }
           }, function(err, response, body) {
               try {
                   success({results: JSON.parse(body)});
               } catch (e) {
                   error(e);
               }
           });
           r.end();
       },

        queryFact: function(query, success, error, options) {
             options = (options)? options :  {};
             var connector = this;

             connector._iterate({
                method : connector._queryFact,
                methodNode : connector._queryFactNode,
                success : success,
                error : error,
                url : function (idx, opts) {
                     var u = this.options.url[idx].replace(/\/$/, '');
                     u += this.options.factstore.urlPostfix.replace(/\/$/, '');

                     u += "/query";

                  return u;
                },
                args : {
                    query : query,
                    options : options
                },
                urlIndex : 0
               });
       },

       _queryFact : function (url, args, success, error) {
           jQuery.ajax({
               success: success,
               error: error,
               url: url,
               type: "POST",
               data : args.query,
               contentType : "application/json",
               dataType: "application/json"
           });
       },

       _queryFactNode: function(url, args, success, error) {
           var request = require('request');
           var r = request({
               method: "POST",
               uri: url,
               body : args.query,
               headers: {
                   Accept: "application/json",
                   "Content-Type" : "application/json"
               }
           }, function(err, response, body) {
               try {
                   success({results: JSON.parse(body)});
               } catch (e) {
                   error(e);
               }
           });
           r.end();
       }
};
})();

