//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     (c) 2011 Sebastian Germesin, IKS Consortium
//     (c) 2011 Szaby Grünwald, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://viejs.org/

// ## VIE - StanbolService service
// The StanbolService service allows a VIE developer to directly query
// the <a href="http://incubator.apache.org/stanbol/">Apache Stanbol</a> entityhub for entities and their properties. 
// Furthermore, it gives access to the enhance facilities of
// Stanbol to analyze content and semantically enrich it.
(function(){

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
        url: ["http://dev.iks-project.eu/stanbolfull"],
        timeout : 60000, /* 60 seconds timeout */
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
        ]
    };
    /* the options are merged with the default options */
    this.options = jQuery.extend(true, defaults, options ? options : {});

    this.vie = null; /* will be set via VIE.use(); */
    /* overwrite options.name if you want to set another name */
    this.name = this.options.name;
    
    /* basic setup for the ajax connection */
    jQuery.ajaxSetup({
        converters: {"text application/rdf+json": function(s){return JSON.parse(s);}},
        timeout: this.options.timeout
    });
};

VIE.prototype.StanbolService.prototype = {
    
// ### init()
// This method initializes certain properties of the service and is called
// via ```VIE.use()```.  
// **Parameters**:  
// *nothing*  
// **Throws**:  
// *nothing*  
// **Returns**:  
// *{VIE.StanbolService}* : The VIE.StanbolService instance itself.  
// **Example usage**:  
//
//     var stnblService = new vie.StanbolService({<some-configuration>});
//     stnblService.init();
    init: function(){

        for (var key in this.options.namespaces) {
            var val = this.options.namespaces[key];
            this.vie.namespaces.add(key, val);
        }
        
        this.rules = jQuery.merge([], VIE.Util.transformationRules(this));
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
// *{Error}* if an invalid VIE.Findable is passed.  
// **Returns**:  
// *{VIE.StanbolService}* : The VIE.StanbolService instance itself.  
// **Example usage**:  
//
//     var stnblService = new vie.StanbolService({<some-configuration>});
//     stnblService.analyzable(
//         new vie.Analyzable({element : jQuery("#foo")})
//     );
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
//     var stnblService = new vie.StanbolService({<some-configuration>});
//     stnblService.load(new vie.Findable({
//         term : "Bischofsh", 
//         limit : 10, 
//         offset: 0
//     }));
    find: function (findable) {
        var correct = findable instanceof this.vie.Findable;
        if (!correct) {throw "Invalid Findable passed";}
        var service = this;
        /* The term to find, * as wildcard allowed */
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

// ### load(loadable)
// This method loads the entity that is stored within the loadable into VIE.  
// **Parameters**:  
// *{VIE.Loadable}* **lodable** The loadable.  
// **Throws**:  
// *{Error}* if an invalid VIE.Loadable is passed.  
// **Returns**:  
// *{VIE.StanbolService}* : The VIE.StanbolService instance itself.  
// **Example usage**:  
//
//     var stnblService = new vie.StanbolService({<some-configuration>});
//     stnblService.load(new vie.Loadable({
//         entity : "<http://...>"
//     }));
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

    // this private method extracts text from a jQuery element
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
    this.options = options;
    this.baseUrl = (_.isArray(options.url))? options.url : [ options.url ];
    this.enhancerUrlPrefix = "/engines";
    this.entityhubUrlPrefix = "/entityhub";
    /*TODO: this.ontonetUrlPrefix = "/ontonet"; */
    /*TODO: this.rulesUrlPrefix = "/rules"; */
    /*TODO: this.factstoreUrlPrefix = "/factstore"; */
};

VIE.prototype.StanbolConnector.prototype = {

// ### analyze(text, success, error, options)
// This method sends the given text to Apache Stanbol returns the result by the success callback.  
// **Parameters**:  
// *{string}* **text** The text to be analyzed.  
// *{function}* **success** The success callback.  
// *{function}* **error** The error callback.  
// *{object}* **options** Options, like the ```format```.  
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
        if (!options) { options = { urlIndex : 0}; }
        if (options.urlIndex >= this.baseUrl.length) {
            error("Could not connect to the given Stanbol endpoints! Please check for their setup!");
            return;
        }
        
        var enhancerUrl = this.baseUrl[options.urlIndex].replace(/\/$/, '');
        enhancerUrl += this.enhancerUrlPrefix;
        
        var format = options.format || "application/rdf+json";
        
        var retryErrorCb = function (c, t, s, e, o) {
            /* in case an backend of Stanbol is not responding and
             * multiple URLs have been registered
             */
            return  function () {
                c.analyze(t, s, e, _.extend(o, {urlIndex : o.urlIndex+1}));
            };
        }(this, text, success, error, options);

        if (typeof exports !== "undefined" && typeof process !== "undefined") {
            /* We're on Node.js, don't use jQuery.ajax */
            return this._analyzeNode(enhancerUrl, text, success, retryErrorCb, options, format);
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

    _analyzeNode: function(url, text, success, errorCB, options, format) {
        var request = require('request');
        var r = request({
            method: "POST",
            uri: url,
            body: text,
            headers: {
                Accept: format
            }
        }, function(error, response, body) {
            try {
                success({results: JSON.parse(body)});
            } catch (e) {
                errorCB(e);
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
// *{object}* **options** Options, like the ```format```.  
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
            /* in case an backend of Stanbol is not responding and
             * multiple URLs have been registered
             */
            return  function () {
                c.load(u, s, e, _.extend(o, {urlIndex : o.urlIndex+1}));
            };
        }(this, uri, success, error, options);
        
        if (typeof exports !== "undefined" && typeof process !== "undefined") {
            /* We're on Node.js, don't use jQuery.ajax */
            return this._loadNode(url, success, retryErrorCb, options, format);
        }
        
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

    _loadNode: function (uri, success, errorCB, options, format) {
        var request = require('request');
        var r = request({
            method: "GET",
            uri: uri,
            headers: {
                Accept: format
            }
        }, function(error, response, body) {
            try {
                success(JSON.parse(body));
            } catch (e) {
                errorCB(e);
            }
        });
        r.end();
        
        return this;
    },

// ### find(term, limit, offset, success, error, options)
// This method finds entities given the term from the entity hub and returns the result by the success callback.  
// **Parameters**:  
// *{string}* **term** The term to be searched for. 
// *{int}* **limit** The limit of results to be returned. 
// *{int}* **offset** The offset to be search for.  
// *{function}* **success** The success callback.  
// *{function}* **error** The error callback.  
// *{object}* **options** Options, like the ```format```.  
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
    find: function (term, limit, offset, success, error, options) {
        /* curl -X POST -d "name=Bishofsh&limit=10&offset=0" http://localhost:8080/entityhub/sites/find */
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
            /* in case an backend of Stanbol is not responding and
             * multiple URLs have been registered
             */
            return  function () {
                c.find(t, l, of, s, e, _.extend(o, {urlIndex : o.urlIndex+1}));
            };
        }(this, term, limit, offset, success, error, options);
        
        if (typeof exports !== "undefined" && typeof process !== "undefined") {
            /* We're on Node.js, don't use jQuery.ajax */
            return this._findNode(url, term, limit, offset, success, retryErrorCb, options, format);
        }
        
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
    },

    _findNode: function (uri, term, limit, offset, success, errorCB, options, format) {
        var request = require('request');
        var r = request({
            method: "POST",
            uri: uri,
            headers: {
                Accept: format
            },
            body : "name=" + term + "&limit=" + limit + "&offset=" + offset
        }, function(error, response, body) {
            try {
                success(JSON.parse(body));
            } catch (e) {
                errorCB(e);
            }
        });
        r.end();
        
        return this;
    }
};
})();

