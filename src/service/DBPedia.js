// File:   DBPediaService.js
// Author: <a href="mailto:sebastian.germesin@dfki.de">Sebastian Germesin</a>
//

(function(){
    
VIE.prototype.DBPediaService = function(options) {
    var defaults = {
        name : 'dbpedia',
        defaultProxyUrl : "../utils/proxy/proxy.php",
        namespaces : {
            owl    : "http://www.w3.org/2002/07/owl#",
            yago   : "http://dbpedia.org/class/yago/",
            dbonto : 'http://dbpedia.org/ontology/'
        }
    };
    this.options = jQuery.extend(defaults, options ? options : {});

    this.vie = null; // will be set via VIE.use();
    this.name = this.options.name
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
                    '?subject a <http://dbpedia.org/ontology/Person>',
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
        if(!entity){
            console.warn("DBPediaConnector: No entity to look for!");
            loadable.resolve([]);
        };
        var success = function (results) {
            loadable.resolve(results.results);
        };
        var error = function (e) {
            loadable.reject(e);
        };
        this.connector.load(entity, success, error)
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
        
        var proxyUrl = this._proxyUrl();
        var format = options.format || "application/rdf+json";
        
        jQuery.ajax({
            success: function(response){
                success(response)
            },
            error: error,
            type: (proxyUrl) ? "POST" : "GET",
            url: proxyUrl || url,
            data: (proxyUrl) ? {
                    proxy_url: url, 
                    content: "",
                    verb: "GET",
                    format: format
                } : text,
            dataType: format,
            contentType: proxyUrl ? undefined : "text/plain",
            accepts: {"application/rdf+json": "application/rdf+json"}
        });
    },
    
    _proxyUrl: function () {
        return this.options.proxyUrl || this.options.defaultProxyUrl;
    }
}
})();

