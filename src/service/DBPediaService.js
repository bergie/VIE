//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     (c) 2011 Sebastian Germesin, IKS Consortium
//     (c) 2011 Szaby Grünwald, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://viejs.org/

// ## VIE - DBPedia service
// The DBPedia service allows a VIE developer to directly query
// the DBPedia database for entities and their properties. Obviously,
// the service does not allow for saving, removing or analyzing methods.
(function(){

// ## VIE.DBPediaService(options)
// This is the constructor to instantiate a new service to collect
// properties of an entity from <a href="http://dbpedia.org">DBPedia</a>.
// **Parameters**:
// *{object}* **options** Optional set of fields, ```namespaces```, ```rules```, or ```name```.
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.DBPediaService}* : A **new** VIE.DBPediaService instance.
// **Example usage**:
//
//     var dbpService = new vie.DBPediaService({<some-configuration>});
VIE.prototype.DBPediaService = function (options) {
    var defaults = {
        /* the default name of this service */
        name : 'dbpedia',
        /* default namespaces that are shipped with this service */
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
        },
        /* default rules that are shipped with this service */
        rules : []
    };
    /* the options are merged with the default options */
    this.options = jQuery.extend(true, defaults, options ? options : {});

    this.vie = null; /* this.vie will be set via VIE.use(); */
    /* overwrite options.name if you want to set another name */
    this.name = this.options.name;

    /* basic setup for the ajax connection */
    jQuery.ajaxSetup({
        converters: {"text application/rdf+json": function(s){return JSON.parse(s);}},
        timeout: 60000 /* 60 seconds timeout */
    });
};

VIE.prototype.DBPediaService.prototype = {

// ### init()
// This method initializes certain properties of the service and is called
// via ```VIE.use()```.
// **Parameters**:
// *nothing*
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.DBPediaService}* : The VIE.DBPediaService instance itself.
// **Example usage**:
//
//     var dbpService = new vie.DBPediaService({<some-configuration>});
//     dbpService.init();
    init: function() {

        for (var key in this.options.namespaces) {
            var val = this.options.namespaces[key];
            this.vie.namespaces.add(key, val);
        }

        this.rules = jQuery.extend([], VIE.Util.transformationRules(this));
        this.rules = jQuery.merge(this.rules, (this.options.rules) ? this.options.rules : []);

        this.connector = new this.vie.DBPediaConnector(this.options);

        return this;
    },

// ### load(loadable)
// This method loads the entity that is stored within the loadable into VIE.
// You can also query for multiple queries by setting ```entities``` with
// an array of entities.
// **Parameters**:
// *{VIE.Loadable}* **lodable** The loadable.
// **Throws**:
// *{Error}* if an invalid VIE.Loadable is passed.
// **Returns**:
// *{VIE.DBPediaService}* : The VIE.DBPediaService instance itself.
// **Example usage**:
//
//  var dbpService = new vie.DBPediaService({<some-configuration>});
//  dbpService.load(new vie.Loadable({entity : "<http://...>"}));
//    OR
//  var dbpService = new vie.DBPediaService({<some-configuration>});
//  dbpService.load(new vie.Loadable({entities : ["<http://...>", "<http://...>"]}));
    load: function(loadable){
        var service = this;

        var correct = loadable instanceof this.vie.Loadable;
        if (!correct) {
            throw new Error("Invalid Loadable passed");
        }

        var success = function (results) {
            results = (typeof results === "string")? JSON.parse(results) : results;
            _.defer(function() {
                try {
                    var entities = VIE.Util.rdf2Entities(service, results);
                    entities = (_.isArray(entities))? entities : [ entities ];
                    _.each(entities, function (entity) {
                        entity.set("DBPediaServiceLoad", VIE.Util.xsdDateTime(new Date()));
                    });
                    entities = (entities.length === 1)? entities[0] : entities;
                    loadable.resolve(entities);
                } catch (e) {
                    loadable.reject(e);
                }
            });
        };

        var error = function (e) {
            loadable.reject(e);
        };

        var entities = (loadable.options.entity)? loadable.options.entity : loadable.options.entities;

        if (!entities) {
            loadable.reject([]);
        } else {
            entities = (_.isArray(entities))? entities : [ entities ];
            var tmpEntities = [];
            for (var e = 0; e < entities.length; e++) {
                var tmpEnt = (typeof entities[e] === "string")? entities[e] : entities[e].id;
                tmpEntities.push(tmpEnt);
            }

            this.connector.load(tmpEntities, success, error);
        }
        return this;
    }
};

// ## VIE.DBPediaConnector(options)
// The DBPediaConnector is the connection between the DBPedia service
// and the backend service.
// **Parameters**:
// *{object}* **options** The options.
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.DBPediaConnector}* : The **new** VIE.DBPediaConnector instance.
// **Example usage**:
//
//     var dbpConn = new vie.DBPediaConnector({<some-configuration>});
VIE.prototype.DBPediaConnector = function (options) {
    this.options = options;
    this.baseUrl = "http://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&timeout=0";
};

VIE.prototype.DBPediaConnector.prototype = {

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
// *{VIE.DBPediaConnector}* : The VIE.DBPediaConnector instance itself.
// **Example usage**:
//
//     var dbpConn = new vie.DBPediaConnector(opts);
//     dbpConn.load("<http://dbpedia.org/resource/Barack_Obama>",
//                 function (res) { ... },
//                 function (err) { ... });
    load: function (uri, success, error, options) {
        if (!options) { options = {}; }

        var url = this.baseUrl +
        "&format=" + encodeURIComponent("application/rdf+json") +
        "&query=";

        if (_.isArray(uri)) {
            var construct = "";
            var where = "";
            for (var u = 0; u < uri.length; u++) {
                var subject = (/^<.+>$/.test(uri[u]))? uri[u] : '<' + uri[u] + '>';
                if (u > 0) {
                    construct += " .";
                    where += " UNION ";
                }
                construct += " " + subject + " ?prop" + u + " ?val" + u;
                where     += " { " + subject + " ?prop" + u + " ?val" + u + " }";
            }
            url += encodeURIComponent("CONSTRUCT {" + construct + " } WHERE {" + where + " }");
        } else {
            uri = (/^<.+>$/.test(uri))? uri : '<' + uri + '>';
            url += encodeURIComponent("CONSTRUCT { " + uri + " ?prop ?val } WHERE { " + uri + " ?prop ?val }");
        }
        var format = options.format || "application/rdf+json";

        if (typeof exports !== "undefined" && typeof process !== "undefined") {
            /* We're on Node.js, don't use jQuery.ajax */
            return this._loadNode(url, success, error, options, format);
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

        return this;
    },

    _loadNode: function (uri, success, error, options, format) {
        var request = require('request');
        var r = request({
            method: "GET",
            uri: uri,
            headers: {
                Accept: format
            }
        }, function(err, response, body) {
            if (response.statusCode !== 200) {
              return error(body);
            }
            success(JSON.parse(body));
        });
        r.end();

        return this;
    }
};
})();

