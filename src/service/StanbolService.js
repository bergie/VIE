// File:   StanbolService.js
// Author: <a href="mailto:sebastian.germesin@dfki.de">Sebastian Germesin</a>
// Author: <a href="">Szaby Gruenwald</a>
//

Zart.prototype.StanbolService = function(options) {
    if (!options) {
        options = {
            url: 'http://dev.iks-project.eu:8080/'
        };
    }
    this.zart = null;
    this.name = 'stanbol';
    this.namespaces = {
        semdesko : "http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#",
        semdeski : "http://www.semanticdesktop.org/ontologies/2007/01/19/nie#",
        owl : "http://www.w3.org/2002/07/owl#",
        gml : "http://www.opengis.net/gml/_",
        geonames : "http://www.geonames.org/ontology#",
        fise : "http://fise.iks-project.eu/ontology/",
        rick: "http://www.iks-project.eu/ontology/rick/model/",
        purl: "http://purl.org/dc/terms/",
        rdfs: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
        dc  : 'http://purl.org/dc/terms/',
        foaf: 'http://xmlns.com/foaf/0.1/',
        schema: 'http://schema.org/'
    };
    this.rules = [
            //rule to add backwards-relations to the triples
            //this makes querying for entities a lot easier!
            {'left' : [
                '?subject a <http://fise.iks-project.eu/ontology/EntityAnnotation>',
                '?subject fise:entity-type ?type',
                '?subject fise:confidence ?confidence',
                '?subject fise:entity-reference ?entity',
                '?subject dc:relation ?relation',
                '?relation a <http://fise.iks-project.eu/ontology/TextAnnotation>',
                '?relation fise:selected-text ?selected-text',
                '?relation fise:selection-context ?selection-context',
                '?relation fise:start ?start',
                '?relation fise:end ?end'
            ],
             'right' : [
                 '?entity a ?type',
                 '?entity fise:hasTextAnnotation ?relation',
                 '?entity fise:hasEntityAnnotation ?subject'
             ]
             },
             //rule to transform a Stanbol person into a VIE^2 person
             {'left' : [
                '?subject a <http://dbpedia.org/ontology/Person>',
             ],
             'right': function(ns){
                 return function(){
                     return jQuery.rdf.triple(this.subject.toString() +
                     ' a <http://schema.org/Person>', {
                         namespaces: ns
                     });
                 };
             }(this.namespaces)
             }
        ];
    
    this.baseUrl = options.url.replace(/\/$/, '');
    this.enhancerUrlPrefix = "/engines/";
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
        var callback = function (service, element, a) {
            return function (data) {
                var entities = service.enhancer2Entities(service, element, data);
                
                a.resolve(entities);
            };
        }(service, element, annotatable);
        
        var enhancerUrl = service.baseUrl + service.enhancerUrlPrefix;
        
        jQuery.ajax({
            complete: callback,
            type: "POST",
            url: (this.zart.defaultProxyUrl) ? this.zart.defaultProxyUrl : enhancerUrl,
            data: (this.zart.defaultProxyUrl) ? {
                    proxy_url: enhancerUrl, 
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

Zart.prototype.StanbolService.prototype.enhancer2Entities = function (service, element, data) {
    //transform data from Stanbol into Zart.Entities
    
    if (data && data.status === 200) {
    
        if (typeof jQuery.rdf !== 'function') {
            throw "RdfQuery is not loaded";
        }
        var obj = jQuery.parseJSON(data.responseText);
        var rdf = jQuery.rdf().load(obj, {});
        
        //execute rules here!
        if (service.rules) {
            var rules = jQuery.rdf.ruleset();
            for (var prefix in service.namespaces) {
                rules.prefix(prefix, service.namespaces[prefix]);
            }
            for (var i = 0; i < service.rules.length; i++) {
                rules.add(service.rules[i]['left'], service.rules[i]['right']);
            }
            rdf = rdf.reason(rules, 10); // execute the rules only 10 times to avoid looping
        }
        var entities = {}
        rdf.where('?subject ?property ?object').each(function() {
            var subject = this.subject.toString();
            if (!entities[subject]) {
                entities[subject] = {
                    '@subject': subject,
                    '@context': service.namespaces
                };
            }
            var propertyUri = this.property.toString();
    
            var propertyCurie = jQuery.createCurie(propertyUri.substring(1, propertyUri.length - 1), {namespaces: service.namespaces});
    
            if (typeof this.object.value === "string") {
                entities[subject][propertyCurie] = this.object.value;
            } else {
                entities[subject][propertyCurie] = this.object.toString();
            }
        });
    
        var zartEntities = [];
        jQuery.each(entities, function() {
            var entityInstance = new service.zart.Entity(this);
            entityInstance = service.zart.entities.addOrUpdate(entityInstance);
            zartEntities.push(entityInstance);
        });
        
        return zartEntities; 
    }   
};

Zart.prototype.StanbolService.prototype.getSites = function (loadable) {

}
