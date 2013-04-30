![VIE](https://raw.github.com/bergie/VIE/master/design/vie_logo_100.png) Vienna IKS Editables
====================

VIE is a utility library for implementing [decoupled Content Management systems](http://bergie.iki.fi/blog/decoupling_content_management/). VIE is developed [as part of](http://www.iks-project.eu/projects/vienna-iks-editables) the EU-funded [IKS project](http://www.iks-project.eu/).

![Decoupled CMS communications](https://raw.github.com/bergie/VIE/master/design/cms-decoupled-communications.png)

* In French, _vie_ means life, showcasing how VIE makes your website come alive
* In English, _vie_ means striving for victory or superiority

VIE development is now targeting a 2.0 release. [Read this blog post](http://bergie.iki.fi/blog/vie_2-0_is_starting_to_emerge/) to find out the changes from VIE 1.0. There is also a [good introductory post on VIE](http://blog.iks-project.eu/semantic-ui-development-with-vie/) on the IKS blog.

## VIE integration in nutshell

Adding VIE to your system is as easy as:

1. Mark up your pages with RDFa annotations
2. Include `vie.js` into the pages
3. Implement [Backbone.sync](http://documentcloud.github.com/backbone/#Sync)

## Changes

Please refer to the [CHANGES.md document](https://github.com/bergie/VIE/blob/master/CHANGES.md).

## Common representation of content on HTML level

A web editing tool has to understand the contents of the page. It has to understand what parts of the page should be editable, and how they connect together. If there is a list of news for instance, the tool needs to understand it enough to enable users to add new news items. The easy way of accomplishing this is to add some semantic annotations to the HTML pages. These annotations could be handled via Microformats, HTML5 microdata, but the most power lies with RDFa.

RDFa is a way to describe the meaning of particular HTML elements using simple attributes. For example:

    <div id="myarticle" typeof="http://rdfs.org/sioc/ns#Post" about="http://example.net/blog/news_item">
        <h1 property="dcterms:title">News item title</h1>
        <div property="sioc:content">News item contents</div>
    </div>

Here we get all the necessary information for making a blog entry editable:

* typeof tells us the type of the editable object. On typical CMSs this would map to a content model or a database table
* about gives us the identifier of a particular object. On typical CMSs this would be the object identifier or database row primary key
* property ties a particular HTML element to a property of the content object. On a CMS this could be a database column

As a side effect, this also makes pages more understandable to search engines and other semantic tools. So the annotations are not just needed for UI, but also for SEO.

## Common representation of content on JavaScript level

Having contents of a page described via RDFa makes it very easy to extract the content model into JavaScript. We can have a common utility library for doing this, but we also should have a common way of keeping track of these content objects. Enter [Backbone.js](http://documentcloud.github.com/backbone/):

> Backbone supplies structure to JavaScript-heavy applications by providing models with key-value binding and custom events, collections with a rich API of enumerable functions, views with declarative event handling, and connects it all to your existing application over a RESTful JSON interface.

With Backbone, the content extracted from the RDFa-annotated HTML page is easily manageable via JavaScript. Consider for example:

    v = new VIE();
    v.use(new v.RdfaService());
    v.load({element: jQuery('#myarticle')}).from('rdfa').execute().success(function(entities) {
        _.forEach(entities, function(entity) {
            entity.set({'dcterms:title': 'Hello, world'});
            entity.save(null, {
                success: function(savedModel, response) {
                    alert("Your article '" + savedModel.get('dcterms:title') + "' was saved to server");
                }
            });
        })
        console.log("We got " + entities.length + " editable objects from the page");
    });

The classic VIE API will also work:

    var v = new VIE({classic: true});
    var objectInstance = v.RDFaEntities.getInstance(jQuery('#myarticle'));
    objectInstance.set({'dcterms:title': 'Hello, world'});
    objectInstance.save(null, {
        success: function(savedModel, response) {
            alert("Your article '" + savedModel.get('dcterms:title') + "' was saved to server");
        }
    });

This JS would work across all the different CMS implementations. Backbone.js provides a quite nice RESTful implementation of communicating with the server with JSON, but it can be easily overridden with CMS-specific implementation by just implementing a new [Backbone.sync method](http://documentcloud.github.com/backbone/#Sync).

## Example

There is a full static HTML example of VIE at work. Saving outputs the edited contents as JSON into the JavaScript console:

* [Example with Hallo](http://createjs.org)

Be sure to read the [annotated VIE source code](http://viejs.org/docs/2.0.0/src/VIE.js.html) for API documentation.

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

## Integrations

* [Create](https://github.com/bergie/create)
* [Google Web Toolkit](https://github.com/alkacon/vie-gwt)
* [Symfony2](https://github.com/liip/LiipVieBundle)
* [Palsu](https://github.com/bergie/ViePalsu)

## Using VIE on Node.js

VIE is a CommonJS library that works on both browser and the server. On [Node.js](http://nodejs.org/) you can install it with:

    npm install vie

Here is a simple Node.js script that uses VIE for parsing RDFa:

    var jQuery = require('jquery');
    var vie = require('vie');

    // Instantiate VIE
    var VIE = new vie.VIE();

    // Enable the RDFa service
    VIE.use(new VIE.RdfaService());

    var html = jQuery('<p xmlns:dc="http://purl.org/dc/elements/1.1/" about="http://www.example.com/books/wikinomics">In his latest book <cite property="dc:title">Wikinomics</cite>, <span property="dc:creator">Don Tapscott</span> explains deep changes in technology, demographics and business.</p>');

    // 
    VIE.load({element: html}).from('rdfa').execute().done(function() {
    
      var objectInstance = VIE.entities.get('http://www.example.com/books/wikinomics');

      console.log(objectInstance.get('dc:title'));

    });

## Development

VIE development is coordinated using Git at [bergie/VIE](https://github.com/bergie/VIE).

Feel free to [report issues](https://github.com/bergie/VIE/issues) or send [pull requests](http://help.github.com/pull-requests/) if you have ideas for pushing VIE forward. Contributions that include their own unit tests appreciated! 

Development discussions happen on the [VIE mailing list](http://groups.google.com/group/viejs) and the `#iks` channel on Freenode. See also [VIE on Ohloh](http://www.ohloh.net/p/vie).

### Code organization

VIE source code is inside the `src` directory. Each separate unit of functionality should be handled in its own file, with the `src/VIE.js` being the entry point to the system.

![VIE architecture](https://raw.github.com/bergie/VIE/master/design/architecture.png)

### Building VIE

The VIE library consists of many individual pieces that we merge together in the build process. You'll need [Grunt](http://gruntjs.com). Then just run:

    $ grunt build

The built VIE library will appear in the `dist` folder.

#### Core-only distribution

In addition to the regular full build, there is also a slimmer build of VIE available that only includes the core parts of the library and no external service. To build that instead, run:

    $ grunt build:core

### Running Unit Tests

Direct your browser to the `test/index.html` file to run VIE's [QUnit](http://docs.jquery.com/Qunit) tests.

#### Unit tests on Node.js

The Grunt testing setup includes multiple parts. With it, you can test the library on both Node.js and a headless browser. Run:

    $ grunt test

or:

    $ npm test

#### Automatic unit tests

You can also run the Grunt setup in *watch mode*, where any change in VIE sources or tests will trigger a rebuild and test run:

    $ grunt watch

#### Continuous integration

VIE uses [Travis](http://travis-ci.org/) for continuous integration. Simply add your fork there and every time you push you'll get the tests run.

[![Build Status](https://secure.travis-ci.org/bergie/VIE.png)](http://travis-ci.org/bergie/VIE)
