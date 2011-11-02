// File:   DBPediaService.js <br />
// Author: <a href="http://github.com/neogermi/">Sebastian Germesin</a>
//

(function(){
    
VIE.prototype.DBPediaService = function(options) {
    var defaults = {
        name : 'dbpedia',
        namespaces : {
            owl    : "http://www.w3.org/2002/07/owl#",
            yago   : "http://dbpedia.org/class/yago/",
            dbonto : 'http://dbpedia.org/ontology/'
        }
    };
    this.options = jQuery.extend(defaults, options ? options : {});

    this.vie = null; // will be set via VIE.use();
    this.name = this.options.name;
    this.connector = new DBPediaConnector(this.options);

    jQuery.ajaxSetup({
        converters: {"text application/rdf+json": function(s){return JSON.parse(s);}}
    });

};

VIE.prototype.DBPediaService.prototype = {
    init: function() {

       for (var key in this.options.namespaces) {
            try {
                var val = this.options.namespaces[key];
                this.vie.namespaces.add(key, val);
            } catch (e) {
                //this means that the namespace is already in the VIE.namespace
                //ignore for now!
            }
        }
        this.namespaces = new this.vie.Namespaces(this.options.namespaces);

        this.rules = [
             //rule to transform a DBPedia person into a VIE person
             {
                'left' : [
                    '?subject a <http://dbpedia.org/ontology/Person>'
                 ],
                 'right': function(ns){
                     return function(){
                         return jQuery.rdf.triple(this.subject.toString() +
                         ' a <http://schema.org/Person>', {
                             namespaces: ns
                         });
                     };
                 }(this.namespaces.toObj())
             }
        ];
    },

    // VIE API load implementation
    load: function(loadable){
        var correct = loadable instanceof this.vie.Loadable;
        if (!correct) {throw "Invalid Loadable passed";}

        var service = this;
        var entity = loadable.options.entity;
        if (!entity) {
            //console.warn("DBPediaConnector: No entity to look for!");
            loadable.resolve([]);
        }
        var success = function (results) {
            var id = entity.replace(/^</, '').replace(/>$/, '');

            if (results[id]) {
                var e = service.vie.entities.get(entity);
                if (!e) {
                    var attrs = {
                        '@subject': entity,
                        '@type': results[id]["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"]
                    };
                    delete results[id]["http://www.w3.org/1999/02/22-rdf-syntax-ns#type"];
                    jQuery.extend(attrs, results[id]);
                    service.vie.entities.add(attrs);
                    e = service.vie.entities.get(entity);
                }
                loadable.resolve([e]);
            } else {
                loadable.reject(undefined);
            }
        };
        var error = function (e) {
            loadable.reject(e);
        };
        this.connector.load(entity, success, error);
    }
};
var DBPediaConnector = function(options){
    this.options = options;
};

DBPediaConnector.prototype = {

    load: function (uri, success, error, options) {
        if (!options) { options = {}; }
        var url = uri
        .replace(/^</, '').replace(/>$/, '')
        .replace('resource', 'data') + ".jrdf";

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
            dataType: "jsonp"
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
            success({results: JSON.parse(body)});
        });
        r.end();
    }
};
})();

