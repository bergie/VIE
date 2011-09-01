// Stanbol Service makes stanbol features reachable in a 
Zart.prototype.StanbolService = function(options) {
    this.zart = null;
    this.name = 'stanbol';
    if (!options) {
        options = {
            url: 'http://dev.iks-project.eu:8080'
        };
    }
    this.namespaces = {
        semdesk : "http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#",
        owl : "http://www.w3.org/2002/07/owl#",
        gml : "http://www.opengis.net/gml/_",
        geonames : "http://www.geonames.org/ontology#",
        fise : "http://fise.iks-project.eu/ontology/",
        rick: "http://www.iks-project.eu/ontology/rick/model/"
    }
    this.connector = new StanbolConnector
};

Zart.prototype.StanbolService.prototype = {
    annotate: function(annotatable) {

    },

    getSites: function(loadable) {

    }
}

// A stanbol connector supposed to reach all stanbol features in a low-level way.
var StanbolConnector = function (options) {
    this.oprions = jQuery.extend(this.options, options);
}
StanbolConnector.prototype = {
    options: {
        
    }

}
