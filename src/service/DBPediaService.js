//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     (c) 2011 Sebastian Germesin, IKS Consortium
//     (c) 2011 Szaby Grünwald, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://viejs.org/
(function(){

// ## VIE - DBPedia service
//
// TODO: fill with more documentation
VIE.prototype.DBPediaService = function(options) {
    var defaults = {
        name : 'dbpedia',
        namespaces : {
            owl    : "http://www.w3.org/2002/07/owl#",
            yago   : "http://dbpedia.org/class/yago/",
            foaf: 'http://xmlns.com/foaf/0.1/',
            georss: "http://www.georss.org/georss/",
            geo: 'http://www.w3.org/2003/01/geo/wgs84_pos#',
            rdfs: "http://www.w3.org/2000/01/rdf-schema#",
            rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            dbpedia: "http://dbpedia.org/ontology/",
            dbprop : "http://dbpedia.org/property/",
            dcelements : "http://purl.org/dc/elements/1.1/"
        }
    };
    this.options = jQuery.extend(true, defaults, options ? options : {});

    this.vie = null; /* will be set via VIE.use(); */
    this.name = this.options.name;
    
    this.rules = (this.options.rules)? this.options.rules : VIE.Util.transformationRules;

    jQuery.ajaxSetup({
        converters: {"text application/rdf+json": function(s){return JSON.parse(s);}},
        timeout: 60000 /* 60 seconds timeout */
    });

};

VIE.prototype.DBPediaService.prototype = {
    init: function() {
        this.connector = new this.vie.DBPediaConnector(this.options);

        for (var key in this.options.namespaces) {
            var val = this.options.namespaces[key];
            this.vie.namespaces.add(key, val);
         }
    },

    // VIE API load implementation
    load: function(loadable){
        var service = this;
        
        var correct = loadable instanceof this.vie.Loadable;
        if (!correct) {throw new Error("Invalid Loadable passed");}

        var entity = loadable.options.entity;
        if (!entity) {
            loadable.reject([]);
        }
        else {
            entity = (typeof entity === "string")? entity : entity.id;
            
            var success = function (results) {
                results = (typeof results === "string")? JSON.parse(results) : results;
                var entities = VIE.Util.rdf2Entities(service, results);
                loadable.resolve(entities);
            };
            var error = function (e) {
                loadable.reject(e);
            };
            this.connector.load(entity, success, error);
        }
    }
};

VIE.prototype.DBPediaConnector = function(options){
    this.options = options;
};

VIE.prototype.DBPediaConnector.prototype = {

    load: function (uri, success, error, options) {
        if (!options) { options = {}; }
        
        uri = (/^<.+>$/.test(uri))? uri : '<' + uri + '>';
        
        var url = "http://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&timeout=0" + 
        "&format=" + encodeURIComponent("application/rdf+json") + 
        "&query=" +
        encodeURIComponent("CONSTRUCT { " + uri + " ?prop ?val } WHERE { " + uri + " ?prop ?val }");
        
        var format = options.format || "application/rdf+json";

        if (typeof exports !== "undefined" && typeof process !== "undefined") {
            // We're on Node.js, don't use jQuery.ajax
            return this.loadNode(url, success, error, options, format);
        }

        jQuery.ajax({
            success: function(response){
                success(response);
            },
            error: error,
            type: "GET",
            url: url,
            accepts: {"application/rdf+json": "application/rdf+json"}
        });
    },

    loadNode: function (uri, success, error, options, format) {
        var request = require('request');
        var r = request({
            method: "GET",
            uri: uri,
            headers: {
                Accept: format
            }
        }, function(error, response, body) {
            success(JSON.parse(body));
        });
        r.end();
    }
};
})();

