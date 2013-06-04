//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     (c) 2011 Sebastian Germesin, IKS Consortium
//     (c) 2011 Szaby Grünwald, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://viejs.org/

// ## VIE - ZemantaService service
// The ZemantaService ...
(function(){

// ## VIE.ZemantaService(options)
// This is the constructor to instantiate a new service to collect
// properties of an entity from Zemanta.
// **Parameters**:
// *{object}* **options** Optional set of fields, ```namespaces```, ```rules```, ```url```, or ```name```.
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.ZemantaService}* : A **new** VIE.ZemantaService instance.
// **Example usage**:
//
//     var service = new vie.ZemantaService({<some-configuration>});
VIE.prototype.ZemantaService = function(options) {
    var defaults = {
        /* the default name of this service */
        name : 'zemanta',
        /* you can pass an array of URLs which are then tried sequentially */
        url: ["http://api.zemanta.com/services/rest/0.0/"],
        timeout : 20000, /* 20 seconds timeout */
        namespaces : {
            zemanta: "http://s.zemanta.com/ns#"
        },
        /* default rules that are shipped with this service */
        rules : [
                 {
                'left' : [
                    '?subject a zemanta:Recognition',
                    '?subject zemanta:object ?object',
                    '?object owl:sameAs ?entity'
                ],
                'right' : [
                    '?entity zemanta:hasEntityAnnotation ?subject'
                ]
            }
         ],
         "api_key" : undefined
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

VIE.prototype.ZemantaService.prototype = {

// ### init()
// This method initializes certain properties of the service and is called
// via ```VIE.use()```.
// **Parameters**:
// *nothing*
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.ZemantaService}* : The VIE.ZemantaService instance itself.
// **Example usage**:
//
//     var service = new vie.ZemantaService({<some-configuration>});
//     service.init();
    init: function(){

        for (var key in this.options.namespaces) {
            var val = this.options.namespaces[key];
            this.vie.namespaces.add(key, val);
        }

        this.rules = jQuery.extend([], VIE.Util.transformationRules(this));
        this.rules = jQuery.merge(this.rules, (this.options.rules) ? this.options.rules : []);

        this.connector = new this.vie.ZemantaConnector(this.options);

        /* adding these entity types to VIE helps later the querying */
        this.vie.types.addOrOverwrite('zemanta:Recognition', [
            /*TODO: add attributes */
        ]).inherit("owl:Thing");
    },

// ### analyze(analyzable)
// This method extracts text from the jQuery element and sends it to Zemanta for analysis.
// **Parameters**:
// *{VIE.Analyzable}* **analyzable** The analyzable.
// **Throws**:
// *{Error}* if an invalid VIE.Findable is passed.
// **Returns**:
// *{VIE.StanbolService}* : The VIE.ZemantaService instance itself.
// **Example usage**:
//
//     var service = new vie.ZemantaService({<some-configuration>});
//     service.analyzable(
//         new vie.Analyzable({element : jQuery("#foo")})
//     );
    analyze: function(analyzable) {
        var service = this;

        var correct = analyzable instanceof this.vie.Analyzable;
        if (!correct) {throw "Invalid Analyzable passed";}

        var element = analyzable.options.element ? analyzable.options.element : jQuery('body');

        var text = service._extractText(element);

        if (text.length > 0) {
            var success = function (results) {
                _.defer(function(){
                    var entities = VIE.Util.rdf2Entities(service, results);
                    analyzable.resolve(entities);
                });
            };
            var error = function (e) {
                analyzable.reject(e);
            };

            var options = {};

            this.connector.analyze(text, success, error, options);

        } else {
            analyzable.resolve([]);
        }

    },

    /* this private method extracts the outerHTML from a jQuery element */
    _extractText: function (element) {
        return jQuery(element).wrap("<div>").parent().html();
    }
};

// ## VIE.ZemantaConnector(options)
// The ZemantaConnector is the connection between the VIE Zemanta service
// and the actual ajax calls.
// **Parameters**:
// *{object}* **options** The options.
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.ZemantaConnector}* : The **new** VIE.ZemantaConnector instance.
// **Example usage**:
//
//     var conn = new vie.ZemantaConnector({<some-configuration>});
VIE.prototype.ZemantaConnector = function (options) {

    var defaults =  {
        /* you can pass an array of URLs which are then tried sequentially */
        url: ["http://api.zemanta.com/services/rest/0.0/"],
        timeout : 20000, /* 20 seconds timeout */
        "api_key" : undefined
    };

    /* the options are merged with the default options */
    this.options = jQuery.extend(true, defaults, options ? options : {});
    this.options.url = (_.isArray(this.options.url))? this.options.url : [ this.options.url ];

    this._init();

    this.baseUrl = (_.isArray(options.url))? options.url : [ options.url ];
};

VIE.prototype.ZemantaConnector.prototype = {

// ### _init()
// Basic setup of the Zemanta connector.  This is called internally by the constructor!
// **Parameters**:
// *nothing*
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.ZemantaConnector}* : The VIE.ZemantaConnector instance itself.
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
            params.error.call(this, "Could not connect to the given Zemanta endpoints! Please check for their setup!");
            return;
        }

        var retryErrorCb = function (c, p) {
            /* in case a Zemanta backend is not responding and
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
// This method sends the given text to Zemanta returns the result by the success callback.
// **Parameters**:
// *{string}* **text** The text to be analyzed.
// *{function}* **success** The success callback.
// *{function}* **error** The error callback.
// *{object}* **options** Options, like the ```format```, or the ```chain``` to be used.
// **Throws**:
// *nothing*
// **Returns**:
// *{VIE.ZemantaConnector}* : The VIE.ZemantaConnector instance itself.
// **Example usage**:
//
//     var conn = new vie.ZemantaConnector(opts);
//     conn.analyze("<p>This is some HTML text.</p>",
//                 function (res) { ... },
//                 function (err) { ... });
    analyze: function(text, success, error, options) {
        options = (options)? options :  {};
        var connector = this;

        connector._iterate({
            method : connector._analyze,
            methodNode : connector._analyzeNode,
            success : success,
            error : error,
            url : function (idx, opts) {
                var u = this.options.url[idx].replace(/\/$/, '');
                return u;
            },
            args : {
                text : text,
                format : options.format || "rdfxml",
                options : options
            },
            urlIndex : 0
        });
    },

    _analyze : function (url, args, success, error) {
        jQuery.ajax({
            success: function(a, b, c){
                var responseData = c.responseText.replace(/<z:signature>.*?<\/z:signature>/, '');
                success(responseData);
            },
            error: error,
            url: url,
            type: "POST",
            dataType: "xml",
            data: {
                method : "zemanta.suggest",
                text : args.text,
                format : args.format,
                api_key : this.options.api_key,
                return_rdf_links : args.options.return_rdf_links
            },
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
    }
};
})();

