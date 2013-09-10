module("vie.js - Apache Stanbol Service");

/* All known endpoints of Stanbol */

/* The ones marked with a "!!!" are implemented by the StanbolConnector */
/* The ones marked with a "???" are implemented but still broken */

// !!!  /enhancer/chain/default
// !!!  /enhancer/chain/<chainId>

// !!!  /entityhub/sites/referenced
// !!!  /entityhub/sites/entity
// !!!  /entityhub/sites/find
//   /entityhub/sites/query
// !!!  /entityhub/sites/ldpath
// !!!  /entityhub/site/<siteId>/entity 
// !!!  /entityhub/site/<siteId>/find
//   /entityhub/site/<siteId>/query
// !!!  /entityhub/site/<siteId>/ldpath
//   /entityhub/entity (GET, PUT, POST, DELETE)
//   /entityhub/mapping
// !!!  /entityhub/find
//   /entityhub/query
// !!!  /entityhub/lookup
// !!!  /entityhub/ldpath
// ???  /sparql
//   /contenthub/contenthub/ldpath
// !!!  /contenthub/contenthub/store
//   /contenthub/contenthub/store/raw/<contentId>
//   /contenthub/contenthub/store/metadata/<contentId>
// !!!  /contenthub/<coreId>/store
//   /contenthub/<coreId>/store/raw/<contentId>
//   /contenthub/<coreId>/store/metadata/<contentId>
// ???  /contenthub/content/<contentId>
// !!!  /factstore/facts
// !!!  /factstore/query
//   /ontonet/ontology
//   /ontonet/ontology/<scopeName>
//   /ontonet/ontology/<scopeName>/<ontologyId>
//   /ontonet/ontology/User
//   /ontonet/session/
//   /ontonet/session/<sessionId>
//   /rules/rule/
//   /rules/rule/<ruleId>
//   /rules/recipe/
//   /rules/recipe/<recipeId>
//   /rules/refactor/
//   /rules/refactor/apply
//   /cmsadapter/map
//   /cmsadapter/session
//   /cmsadapter/contenthubfeed


var stanbolRootUrl = ["http://demo.iks-project.eu/stanbolfull", "http://dev.iks-project.eu/stanbolfull"];
test("VIE.js StanbolService - Registration", function() {
    var z = new VIE();
    ok(z.StanbolService, "Checking if the Stanbol Service exists.'");
    z.use(new z.StanbolService);
    ok(z.service('stanbol'));
});

test("VIE.js StanbolService - API", function() {
    var z = new VIE();
    z.use(new z.StanbolService);

    ok(z.service('stanbol').init);
    equal(typeof z.service('stanbol').init, "function");
    ok(z.service('stanbol').analyze);
    equal(typeof z.service('stanbol').analyze, "function");
    ok(z.service('stanbol').find);
    equal(typeof z.service('stanbol').find, "function");
    ok(z.service('stanbol').load);
    equal(typeof z.service('stanbol').load, "function");
    ok(z.service('stanbol').connector);
    ok(z.service('stanbol').connector instanceof z.StanbolConnector);
    ok(z.service('stanbol').rules);
    equal(typeof z.service('stanbol').rules, "object");
});

test("VIE.js StanbolConnector - API", function() {
  var z = new VIE();
    var stanbol = new z.StanbolService({url : stanbolRootUrl});
    z.use(stanbol);
    
    //API
    ok(stanbol.connector.analyze);
    equal(typeof stanbol.connector.analyze, "function");
    ok(stanbol.connector.load);
    equal(typeof stanbol.connector.load, "function");
    ok(stanbol.connector.find);
    equal(typeof stanbol.connector.find, "function");
    ok(stanbol.connector.lookup);
    equal(typeof stanbol.connector.lookup, "function");
    ok(stanbol.connector.referenced);
    equal(typeof stanbol.connector.referenced, "function");
    ok(stanbol.connector.sparql);
    equal(typeof stanbol.connector.sparql, "function");
    ok(stanbol.connector.ldpath);
    equal(typeof stanbol.connector.ldpath, "function");
    ok(stanbol.connector.uploadContent);
    equal(typeof stanbol.connector.uploadContent, "function");
    ok(stanbol.connector.createFactSchema);
    equal(typeof stanbol.connector.createFactSchema, "function");
    ok(stanbol.connector.createFact);
    equal(typeof stanbol.connector.createFact, "function");
    ok(stanbol.connector.queryFact);
    equal(typeof stanbol.connector.queryFact, "function");
});

test("VIE.js StanbolService - Analyze - Default", function () {
    if (navigator.userAgent === 'Zombie') {
       return;
    }
    expect(8);
    // Sending a an example with double quotation marks.
    var elem = $('<p>This is a small test, where Steve Jobs sings the song \"We want to live forever!\" song.</p>');
    var z = new VIE();
    ok (z.StanbolService);
    equal(typeof z.StanbolService, "function", "The StanbolService exists.");
    z.use(new z.StanbolService({url : stanbolRootUrl}));
    stop();
    z.analyze({element: elem}).using('stanbol').execute().done(function(entities) {

        ok(entities, "The returned results is not null.");
        ok(entities instanceof Array, "The entities are an array.");
        ok(entities.length > 0, "At least one entity returned");
        if(entities.length > 0){
          var allEntities = true;
          for(var i=0; i<entities.length; i++){
              var entity = entities[i];
              if (! (entity instanceof Backbone.Model)){
                  allEntities = false;
                  ok(false, "VIE.js StanbolService - Analyze: Entity is not a Backbone model!");
                  console.error("VIE.js StanbolService - Analyze: ", entity, "is not a Backbone model!");
              }
          }
          ok(allEntities, "All result elements are VIE entities.");
          var firstTextAnnotation = _(entities).filter(function(e){
              return e.isof("enhancer:TextAnnotation") && e.get("enhancer:selected-text");
          })[0];
          ok(firstTextAnnotation);
          if (firstTextAnnotation) {
            var s = firstTextAnnotation.get("enhancer:selected-text").toString();
            ok(s.substring(s.length-4, s.length-2) != "\"@", "Selected text should be converted into a normal string.");
          }
        }
        start();
    })
    .fail(function(f){
        ok(false, f.statusText);
        start();
    });
});

test("VIE.js StanbolService - Analyze with wrong URL of Stanbol", function () {
    if (navigator.userAgent === 'Zombie') {
       return;
    }
    expect(6);
    // Sending a an example with double quotation marks.
    var elem = $('<p>This is a small test, where Steve Jobs sings the song \"We want to live forever!\" song.</p>');
    var z = new VIE();
    ok (z.StanbolService);
    equal(typeof z.StanbolService, "function");
    var wrongUrls = ["http://www.this-is-wrong.url/", "http://dev.iks-project.eu/stanbolfull", "http://demo.iks-project.eu/stanbolfull"];
    z.use(new z.StanbolService({url : wrongUrls}));
    stop();
    z.analyze({element: elem}).using('stanbol').execute().done(function(entities) {

        ok(entities);
        ok(entities.length > 0, "At least one entity returned");
        ok(entities instanceof Array);
        var allEntities = true;
        for(var i=0; i<entities.length; i++){
            var entity = entities[i];
            if (! (entity instanceof Backbone.Model)){
                allEntities = false;
                ok(false, "VIE.js StanbolService - Analyze: Entity is not a Backbone model!");
                console.error("VIE.js StanbolService - Analyze: ", entity, "is not a Backbone model!");
            }
        }
        ok(allEntities);
        start();
    })
    .fail(function(f){
        ok(false, f.statusText);
        start();
    });
});

test("VIE.js StanbolService - Analyze with Enhancement Chain", function () {
    if (navigator.userAgent === 'Zombie') {
       return;
    }
    expect(4);
    // Sending a an example with double quotation marks.
    var elem = $('<p>This is a small test, where Steve Jobs sings the song \"We want to live forever!\" song.</p>');
    var v = new VIE();
    v.use(new v.StanbolService({url : stanbolRootUrl, enhancerUrlPostfix: "/enhancer/chain/dbpedia-keyword"}));
    stop();
    v.analyze({element: elem}).using('stanbol').execute().done(function(entities) {
        ok(entities, "Entities is not null");
        ok(entities instanceof Array, "Result is an array");
        ok(entities.length > 0, "At least one entity returned");
        if(entities.length > 0) {
            var allEntities = true;
            for(var i=0; i<entities.length; i++){
                var entity = entities[i];
                if (! (entity instanceof Backbone.Model)){
                    allEntities = false;
                    console.error("VIE.js StanbolService - Analyze: ", entity, "is not a Backbone model!");
                }
            }
            ok(allEntities, "All results are VIE Entities");
        }
        start();
    })
    .fail(function(f){
        ok(false, f.statusText);
        start();
    });
});

test("VIE.js StanbolConnector - Get all referenced sites", function () {
    if (navigator.userAgent === 'Zombie') {
       return;
    } 
    // Sending a an example with double quotation marks.
    var z = new VIE();
    ok (z.StanbolService);
    equal(typeof z.StanbolService, "function");
    var stanbol = new z.StanbolService({url : stanbolRootUrl});
    z.use(stanbol);
    stop();
    stanbol.connector.referenced(function (sites) {
      ok(_.isArray(sites));
      ok(sites.length > 0);
      start();
    }, function (err) {
      ok(false, "No referenced site has been returned!");
      start();
    });
});

test("VIE.js StanbolConnector - Perform SPARQL Query", function () {
    if (navigator.userAgent === 'Zombie') {
       return;
    } 
    
    var query = "PREFIX fise: <http://fise.iks-project.eu/ontology/> " + 
      "PREFIX dc:   <http://purl.org/dc/terms/> " + 
        "SELECT distinct ?enhancement ?content ?engine ?extraction_time " + 
        "WHERE { " + 
          "?enhancement a fise:Enhancement . " + 
          "?enhancement fise:extracted-from ?content . " + 
          "?enhancement dc:creator ?engine . " + 
          "?enhancement dc:created ?extraction_time . " + 
        "} " +
        "ORDER BY DESC(?extraction_time) LIMIT 5";
    
    // Sending a an example with double quotation marks.
    var z = new VIE();
    ok (z.StanbolService);
    equal(typeof z.StanbolService, "function");
    var stanbol = new z.StanbolService({url : stanbolRootUrl});
    z.use(stanbol);
    stop();
    stanbol.connector.sparql(query, function (response) {
      ok(response instanceof Document);
      var xmlString = (new XMLSerializer()).serializeToString(response);
      var myJsonObject = xml2json.parser(xmlString);

      ok(myJsonObject.sparql);
      ok(myJsonObject.sparql.results);
      ok(myJsonObject.sparql.results.result);
      ok(myJsonObject.sparql.results.result.length);
      ok(myJsonObject.sparql.results.result.length > 0);
      
      start();
    }, function (err) {
      ok(false, "SPARQL endpoint returned no response!");
      start();
    });
});


test("VIE.js StanbolService - Find - Default", function () {
    if (navigator.userAgent === 'Zombie') {
       return;
    } 
    var term = "München";
    var limit = 10;
    var offset = 0;
    var z = new VIE();
    ok (z.StanbolService);
    equal(typeof z.StanbolService, "function");
    z.use(new z.StanbolService({url : stanbolRootUrl}));
    stop();
    
    z.find({term: term, limit: limit, offset: offset})
    .using('stanbol').execute().done(function(entities) {

        ok(entities);
        ok(entities.length > 0);
        ok(entities instanceof Array);
        var allEntities = true;
        for(var i=0; i<entities.length; i++){
            var entity = entities[i];
            if (! (entity instanceof Backbone.Model)){
                allEntities = false;
                ok(false, "VIE.js StanbolService - Find: Entity is not a Backbone model!");
                console.error("VIE.js StanbolService - Find: ", entity, "is not a Backbone model!");
            }
        }
        ok(allEntities);
        start();
    })
    .fail(function(f){
        ok(false, f.statusText);
        start();
    });

});

/*
test("VIE.js StanbolService - Find - Search only in local entities", function () {
    if (navigator.userAgent === 'Zombie') {
        return;
    }
    var term = "European Union";
    var limit = 10;
    var offset = 0;
    var z = new VIE();
    z.use(new z.StanbolService({url : stanbolRootUrl}));
    stop();
    // search only in local entities
    z.find({term: "P*", limit: limit, offset: offset, local : true})
    .using('stanbol').execute().done(function(entities) {
        ok(entities);
        ok(entities.length > 0);
        ok(entities instanceof Array);
        var allEntities = true;
        for(var i=0; i<entities.length; i++){
            var entity = entities[i];
            if (! (entity instanceof Backbone.Model)){
                allEntities = false;
                ok(false, "VIE.js StanbolService - Find: Entity is not a Backbone model!");
                console.error("VIE.js StanbolService - Find: ", entity, "is not a Backbone model!");
            }
        }
        ok(allEntities);
        start();
    })
    .fail(function(f){
        ok(false, f.statusText);
        start();
    });

});
*/

test("VIE.js StanbolService - Find - Only term given, no limit, no offset", function () {
    if (navigator.userAgent === 'Zombie') {
        return;
    }
    var term = "European Union";
    var limit = 10;
    var offset = 0;
    var z = new VIE();
    z.use(new z.StanbolService({url : stanbolRootUrl}));
    stop();
    z.find({term: term}) // only term given, no limit, no offset
    .using('stanbol').execute().done(function(entities) {

        ok(entities);
        ok(entities.length > 0);
        ok(entities instanceof Array);
        var allEntities = true;
        for(var i=0; i<entities.length; i++){
            var entity = entities[i];
            if (! (entity instanceof Backbone.Model)){
                allEntities = false;
                ok(false, "VIE.js StanbolService - Find: Entity is not a Backbone model!");
                console.error("VIE.js StanbolService - Find: ", entity, "is not a Backbone model!");
            }
        }
        ok(allEntities);
        start();
    })
    .fail(function(f){
        ok(false, f.statusText);
        start();
    });

});


test("VIE.js StanbolService - Find - Empty term", function () {
    if (navigator.userAgent === 'Zombie') {
        return;
    }
    var term = "European Union";
    var limit = 10;
    var offset = 0;
    var z = new VIE();
    z.use(new z.StanbolService({url : stanbolRootUrl}));
    stop();
    z.find({term: "", limit: limit, offset: offset})
    .using('stanbol').execute()
    .done(function(entities) {

        ok(false, "this should fail, as there is an empty term given!");
        start();
    })
    .fail(function(f){
        ok(true, f.statusText);
        start();
    });

});


test("VIE.js StanbolService - Find - No term", function () {
    if (navigator.userAgent === 'Zombie') {
        return;
    }
    var term = "European Union";
    var limit = 10;
    var offset = 0;
    var z = new VIE();
    z.use(new z.StanbolService({url : stanbolRootUrl}));
    stop();
    z.find({limit: limit, offset: offset})
    .using('stanbol').execute()
    .done(function(entities) {

        ok(false, "this should fail, as there is no term given!");
        start();
    })
    .fail(function(f){
        ok(true, f.statusText);
        start();
    });
});


test("VIE.js StanbolService - Load", function () {
    if (navigator.userAgent === 'Zombie') {
       return;
    }
    var entity = "<http://dbpedia.org/resource/Barack_Obama>";
    var z = new VIE();
    z.use(new z.StanbolService({url : stanbolRootUrl}));
    stop();
    z.load({entity: entity})
    .using('stanbol').execute().done(function(entities) {
        ok(entities);
        ok(entities.length > 0);
        ok(entities instanceof Array);
        var allEntities = true;
        for(var i=0; i<entities.length; i++){
            var entity = entities[i];
            if (! (entity instanceof Backbone.Model)){
                allEntities = false;
                ok(false, "VIE.js StanbolService - Load: Entity is not a Backbone model!");
                console.error("VIE.js StanbolService - Analyze: ", entity, "is not a Backbone model!");
            }
        }
        ok(allEntities);
        start();
    })
    .fail(function(f){
        ok(false, f.statusText);
        start();
    });
});

test("VIE.js StanbolService - ContentHub: Upload of content / Retrieval of enhancements", function () {
    if (navigator.userAgent === 'Zombie') {
       return;
    }
    var content = 'This is a small test, where Steve Jobs sings the song "We want to live forever!" song.';

    var z = new VIE();
    ok (z.StanbolService);
    equal(typeof z.StanbolService, "function");
    var stanbol = new z.StanbolService({url : stanbolRootUrl});
    z.use(stanbol);
    
    stop();
    stanbol.connector.uploadContent(content, function(xml,status,xhr){
        var location = xhr.getResponseHeader('Location');
        //TODO: This does not work in jQuery :(
        start();
    }, function (err) {
      ok(false, err);
      start();
    });
});

/*
test("VIE.js StanbolService - ContentHub: Lookup", function () {
    if (navigator.userAgent === 'Zombie') {
       return;
    }
    
    var entity = 'http://dbpedia.org/resource/Paris';

    var z = new VIE();
    z.namespaces.add("cc", "http://creativecommons.org/ns#");
    ok (z.StanbolService);
    equal(typeof z.StanbolService, "function");
    var stanbol = new z.StanbolService({url : stanbolRootUrl});
    z.use(stanbol);
    
    stop();
    stanbol.connector.lookup(entity, function (response) {
      var entities = VIE.Util.rdf2Entities(stanbol, response);
      ok(entities.length > 0, "With 'create'");
      start();
    }, function (err) {
      ok(false, err);
      start();
    }, {
      create : true
    });
    
    stop();
    stanbol.connector.lookup(entity, function (response) {
      var entities = VIE.Util.rdf2Entities(stanbol, response);
      ok(entities.length > 0, "Without 'create'");
      start();
    }, function (err) {
      ok(false, err);
      start();
    });
});
*/
test("VIE.js StanbolConnector - LDPath - on all sites", function () {
    if (navigator.userAgent === 'Zombie') {
       return;
    }
    
    var context = 'http://dbpedia.org/resource/Paris';
    var ldpath = "@prefix dct : <http://purl.org/dc/terms/> ;\n" + 
                 "@prefix geo : <http://www.w3.org/2003/01/geo/wgs84_pos#> ;\n" + 
                 "name = rdfs:label[@en] :: xsd:string;\n" + 
                 "labels = rdfs:label :: xsd:string;\n" + 
                 "comment = rdfs:comment[@en] :: xsd:string;\n" + 
                 "categories = dc:subject :: xsd:anyURI;\n" + 
                 "homepage = foaf:homepage :: xsd:anyURI;\n" + 
                 "location = fn:concat(\"[\",geo:lat,\",\",geo:long,\"]\") :: xsd:string;\n";
    
    var z = new VIE();
    z.namespaces.add("cc", "http://creativecommons.org/ns#");
    ok (z.StanbolService);
    equal(typeof z.StanbolService, "function");
    var stanbol = new z.StanbolService({url : stanbolRootUrl});
    z.use(stanbol);
    
    stop();
    // on all sites
    stanbol.connector.ldpath(ldpath, context, function (response) {
      var entities = VIE.Util.rdf2Entities(stanbol, response);
      ok(entities.length > 0);
      start();
    }, function (err) {
      ok(false, err);
      start();
    });
});
test("VIE.js StanbolService - LDPath - on one specific site", function () {
    if (navigator.userAgent === 'Zombie') {
        return;
    }

    var context = 'http://dbpedia.org/resource/Paris';
    var ldpath = "@prefix dct : <http://purl.org/dc/terms/> ;\n" +
        "@prefix geo : <http://www.w3.org/2003/01/geo/wgs84_pos#> ;\n" +
        "name = rdfs:label[@en] :: xsd:string;\n" +
        "labels = rdfs:label :: xsd:string;\n" +
        "comment = rdfs:comment[@en] :: xsd:string;\n" +
        "categories = dc:subject :: xsd:anyURI;\n" +
        "homepage = foaf:homepage :: xsd:anyURI;\n" +
        "location = fn:concat(\"[\",geo:lat,\",\",geo:long,\"]\") :: xsd:string;\n";

    var z = new VIE();
    z.namespaces.add("cc", "http://creativecommons.org/ns#");
    var stanbol = new z.StanbolService({url : stanbolRootUrl});
    z.use(stanbol);
    stop();

    // on one specific site
    stanbol.connector.ldpath(ldpath, context, function (response) {
      var entities = VIE.Util.rdf2Entities(stanbol, response);
      ok(entities.length > 0);
      start();
    }, function (err) {
      ok(false, err);
      start();
    }, {
      site: "dbpedia"
    });

});
test("VIE.js StanbolService - LDPath - on local entities", function () {
    if (navigator.userAgent === 'Zombie') {
        return;
    }

    var context = 'http://dbpedia.org/resource/Paris';
    var ldpath = "@prefix dct : <http://purl.org/dc/terms/> ;\n" +
        "@prefix geo : <http://www.w3.org/2003/01/geo/wgs84_pos#> ;\n" +
        "name = rdfs:label[@en] :: xsd:string;\n" +
        "labels = rdfs:label :: xsd:string;\n" +
        "comment = rdfs:comment[@en] :: xsd:string;\n" +
        "categories = dc:subject :: xsd:anyURI;\n" +
        "homepage = foaf:homepage :: xsd:anyURI;\n" +
        "location = fn:concat(\"[\",geo:lat,\",\",geo:long,\"]\") :: xsd:string;\n";

    var z = new VIE();
    z.namespaces.add("cc", "http://creativecommons.org/ns#");
    var stanbol = new z.StanbolService({url : stanbolRootUrl});
    z.use(stanbol);

    stop();
    // on local entities
    stanbol.connector.ldpath(ldpath, context, function (response) {
      var entities = VIE.Util.rdf2Entities(stanbol, response);
      ok(entities.length > 0);
      start();
    }, function (err) {
      ok(false, err);
      start();
    }, {
      local : true
    });
});

/* TODO: these tests need to be backed by implementations
test("VIE.js StanbolService - Create a New Fact Schema", function () {
    if (navigator.userAgent === 'Zombie') {
       return;
    }
    
    var employeeOfFact = {
       "@context" : {
       "iks"     : "http://iks-project.eu/ont/",
        "@types"  : {
          "person"       : "iks:person",
          "organization" : "iks:organization"
        }
      }
    };
    
    var employeeOfFactURL = "http://iks-project.eu/ont/employeeOf" + (new Date().getTime());
       
    var z = new VIE();
    z.namespaces.add("cc", "http://creativecommons.org/ns#");
    ok (z.StanbolService);
    equal(typeof z.StanbolService, "function");
    var stanbol = new z.StanbolService({url : stanbolRootUrl});
    z.use(stanbol);
    
    stop();
    // on all sites
    stanbol.connector.createFactSchema(employeeOfFactURL, employeeOfFact, function (response) {
      debugger;
      start();
    }, function (err) {
      ok(false, err);
      start();
    });
});

test("VIE.js StanbolService - Create a New Fact", function () {
    if (navigator.userAgent === 'Zombie') {
       return;
    }
    
    var fact = {
         "@context" : {
             "iks" : "http://iks-project.eu/ont/",
             "upb" : "http://upb.de/persons/"
           },
           "@profile"     : "iks:employeeOf",
           "person"       : { "@iri" : "upb:bnagel" },
           "organization" : { "@iri" : "http://uni-paderborn.de"}
          };
    
    var z = new VIE();
    ok (z.StanbolService);
    equal(typeof z.StanbolService, "function");
    var stanbol = new z.StanbolService({url : stanbolRootUrl});
    z.use(stanbol);
    
    stop();
    stanbol.connector.createFact(fact, function (response) {
      debugger;
      start();
    }, function (err) {
      ok(false, err);
      start();
    });
    
    var moreFactsOfSameType = {
         "@context" : {
             "iks" : "http://iks-project.eu/ont/",
             "upb" : "http://upb.de/persons/"
           },
           "@profile"     : "iks:employeeOf",
           "@subject" : [
             { "person"       : { "@iri" : "upb:bnagel" },
               "organization" : { "@iri" : "http://uni-paderborn.de" }
             },
             { "person"       : { "@iri" : "upb:fchrist" },
               "organization" : { "@iri" : "http://uni-paderborn.de" }
             }
           ]
          };
    
    stop();
    stanbol.connector.createFact(moreFactsOfSameType, function (response) {
      debugger;
      start();
    }, function (err) {
      ok(false, err);
      start();
    });
    
    var moreFactsOfDifferentType = {
         "@context" : {
             "iks" : "http://iks-project.eu/ont/",
             "upb" : "http://upb.de/persons/"
           },
           "@subject" : [
             { "@profile"     : "iks:employeeOf",
               "person"       : { "@iri" : "upb:bnagel" },
               "organization" : { "@iri" : "http://uni-paderborn.de" }
             },
             { "@profile"     : "iks:friendOf",
               "person"       : { "@iri" : "upb:bnagel" },
               "friend"       : { "@iri" : "upb:fchrist" }
             }
           ]
          };
   
   stop();
   stanbol.connector.createFact(moreFactsOfDifferentType, function (response) {
    debugger;
    start();
   }, function (err) {
    ok(false, err);
    start();
   });
});

test("VIE.js StanbolService - Query for Facts of a Certain Type", function () {
    if (navigator.userAgent === 'Zombie') {
       return;
    }
    
    var query = {
         "@context" : {
             "iks" : "http://iks-project.eu/ont/"
           },
           "select" : [ "person" ],
           "from"   : "iks:employeeOf",
           "where"  : [
             {
               "="  : {
                 "organization" : { "@iri" : "http://uni-paderborn.de" }
               }
             }
           ]
          };
    
    var z = new VIE();
    ok (z.StanbolService);
    equal(typeof z.StanbolService, "function");
    var stanbol = new z.StanbolService({url : stanbolRootUrl});
    z.use(stanbol);
    
    stop();
    stanbol.connector.queryFact(query, function (response) {
      debugger;
      start();
    }, function (err) {
      ok(false, err);
      start();
    });
});

test("VIE.js StanbolService - CRUD on local entities", function () {
    if (navigator.userAgent === 'Zombie') {
       return;
    }
    var z = new VIE();
    ok (z.StanbolService);
    equal(typeof z.StanbolService, "function");
    z.use(new z.StanbolService({url : stanbolRootUrl}));
    //TODO
});
*/
