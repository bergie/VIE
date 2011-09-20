VIE.js
=======

VIE is a new JavaScript library for managing information on a web page. It is based on existing VIE and VIE^2 libraries.

## Parsing RDFa

One of the key functionalities is making RDFa-annotated content on web pages editable. The way this works is that you use the RDFa service in VIE to parse annotations on a page and turn them into Backbone.js models. These models may the be manipulated to change contents on the page, or sent back to the server via [Backbone.sync](http://documentcloud.github.com/backbone/#Sync).

RDFa parsing is easy:

    v = new VIE();
    v.use(new v.RdfaService());
    v.load({element: jQuery('div')}).from('rdfa').execute().success(function(entities) {
        console.log("We got " + entities.length + " editable objects from the page");
    });

## I/O operations

All Input/Output operations of VIE are based on the [jQuery Deferred](http://api.jquery.com/category/deferred-object/) object, which means that you can attach callbacks to them either before they run, or also after they've been run.

The operations may either succeed, in which case the `then` callbacks will fire, or be rejected, in which case the `fail` callbacks will fire. Any `then` callbacks will fire in either case.

## Dependencies

VIE uses the following JavaScript libraries:

* [jQuery](http://jquery.com/) for DOM manipulation and [Deferreds](http://api.jquery.com/category/deferred-object/)
* [Backbone.js](http://documentcloud.github.com/backbone/) for entities (models) and collections
* [Underscore.js](http://documentcloud.github.com/underscore/) for various JavaScript utilities

Some functionality in VIE additionally uses:

* [RdfQuery](http://code.google.com/p/rdfquery/) as a triplestore and for reasoning over rules

## Development

VIE development is coordinated in IKS's [GitHub account](https://github.com/IKS/vie.js). To contribute, just fork the repository and send pull requests. Contributions that include their own unit tests appreciated!

VIE source code is inside the `src` directory. Each separate unit of functionality should be handled in its own file, with the `src/VIE.js` being the entry point to the system.

VIE is licensed under the MIT license.

## Building VIE

The VIE library consists of many individual pieces that we merge together in the build process. You'll need [Apache Ant](http://ant.apache.org/). Then just run:

    $ ant

The built VIE library will appear in the `dist` folder.

## Running unit tests

Direct your browser to the `test/index.html` file to run VIE's [QUnit](http://docs.jquery.com/Qunit) tests.
