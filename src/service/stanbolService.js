// File:   StanbolService.js
// Author: <a href="mailto:sebastian.germesin@dfki.de">Sebastian Germesin</a>
// Author: <a href="">Szaby Gruenwald</a>
//

Zart.prototype.StanbolService = function(options) {
    if (!options) {
        options = {
            url: 'http://dev.iks-project.eu:8080'
        };
    }
    this.zart = null;
    this.name = 'stanbol';
    this.namespaces = {
        semdesk : "http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#",
        owl : "http://www.w3.org/2002/07/owl#",
        gml : "http://www.opengis.net/gml/_",
        geonames : "http://www.geonames.org/ontology#",
        fise : "http://fise.iks-project.eu/ontology/",
        rick: "http://www.iks-project.eu/ontology/rick/model/"
    }
    this.enhancerUrl = (options.url)? options.url : "/engines/";
};

Zart.prototype.StanbolService.prototype.annotate = function(annotatable) {
    var service = this;
    var correct = annotatable instanceof this.zart.Annotatable;
    if (!correct) {
        throw "Invalid Annotatable passed";
    }

    var element = annotatable.options.element ? annotatable.options.element : jQuery('body');

    var text = service.extractText(element);
    
    if (text.length > 0) {
        //query enhancer with extracted text
        var callback = function (service, a) {
            return function (data) {
                var entities = service.enhancer2Entities(data);
                
                a.resolve(entities);
            };
        }(service, annotatable);
        
        jQuery.ajax({
            complete: callback,
            type: "POST",
            url: (this.zart.defaultProxyUrl) ? this.zart.defaultProxyUrl : service.enhancerUrl,
            data: (this.zart.defaultProxyUrl) ? {
                    proxy_url: service.enhancerUrl, 
                    content: text,
                    verb: "POST",
                    format: "application/rdf+json"
                } : text
        });
    } else {
        throw "No text found in element.";
    }

};

Zart.prototype.StanbolService.prototype.extractText = function (element) {
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
};

Zart.prototype.StanbolService.prototype.enhancer2Entities = function(data) {
    var entities = [];
    //TODO: transform data from Stanbol into Zart.Entities
    return entities;    
};

Zart.prototype.StanbolService.prototype.getSites = function (loadable) {

}
