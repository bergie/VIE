![VIE](https://github.com/bergie/VIE/raw/master/vie_logo_100.png) Vienna IKS Editables
====================

VIE is a utility library for implementing [decoupled Content Management systems](http://bergie.iki.fi/blog/decoupling_content_management/). VIE is developed [as part of](http://wiki.iks-project.eu/index.php/VIE) the EU-funded [IKS project](http://www.iks-project.eu/).

![Decoupled CMS communications](https://github.com/bergie/VIE/raw/master/cms-decoupled-communications.png)

* In French, _vie_ means life, showcasing how VIE makes your website come alive
* In English, _vie_ means striving for victory or superiority

## VIE integration in nutshell

Adding VIE to your system is as easy as:

1. Mark up your pages with RDFa annotations
2. Include `vie.js` into the pages
3. Implement [Backbone.sync](http://documentcloud.github.com/backbone/#Sync)

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

    var objectInstance = VIE.RDFaEntities.getInstance(jQuery('#myarticle'));
    objectInstance.set({'dcterms:title': 'Hello, world'});
    objectInstance.save(null, {
        success: function(savedModel, response) {
            alert("Your article '" + savedModel.get('dcterms:title') + "' was saved to server");
        }
    });

This JS would work across all the different CMS implementations. Backbone.js provides a quite nice RESTful implementation of communicating with the server with JSON, but it can be easily overridden with CMS-specific implementation by just implementing a new [Backbone.sync method](http://documentcloud.github.com/backbone/#Sync).

## Example

There is a full static HTML example of VIE at work. Saving outputs the edited contents as JSON into the JavaScript console:

* [Example with Aloha Editor](https://github.com/bergie/VIE/raw/master/example.html)
* [Example with WYMeditor](https://github.com/bergie/VIE/blob/wymeditor/example-wymeditor.html)

Be sure to read the [annotated VIE source code](http://bergie.github.com/VIE/) for API documentation.

## Implementations

* [Midgard Create](https://github.com/bergie/midgardmvc_ui_create)
* [WordPress](https://github.com/Jotschi/Aloha-Editor-Wordpress-Plugin)
* [TYPO3](http://git.typo3.org/TYPO3v5/Distributions/Base.git)
* [KaraCos](http://gitorious.org/karacos2-wsgi-web-applications-engine/karacos2-wsgi-web-applications-engine)
* Gentics Enterprise CMS
* Drupal
* Jekyll
* Plone ([GSoC 2011 proposal](http://www.google-melange.com/gsoc/proposal/review/google/gsoc2011/dalsh/1))
* [Symfony2](https://github.com/liip/LiipVieBundle)

## Using VIE on Node.js

VIE is a CommonJS library that works on both browser and the server. On [Node.js](http://nodejs.org/) you can install it with:

    npm install vie

Here is a simple Node.js script that uses VIE for parsing RDFa:

    var jQuery = require('jquery');
    var VIE = require('vie');

    var html = jQuery('<p xmlns:dc="http://purl.org/dc/elements/1.1/" about="http://www.example.com/books/wikinomics">In his latest book <cite property="dc:title">Wikinomics</cite>, <span property="dc:creator">Don Tapscott</span> explains deep changes in technology, demographics and business.</p>');

    VIE.RDFaEntities.getInstances(html);
    var objectInstance = VIE.EntityManager.getBySubject('http://www.example.com/books/wikinomics');

    console.log(objectInstance.get('dc:title'));

## Development

VIE development is coordinated using Git. [VIE@IKS](https://github.com/IKS/VIE) is the canonical "blessed repository", with actual development happening at [VIE@bergie](https://github.com/bergie/VIE).

Feel free to [report issues](https://github.com/bergie/VIE/issues) or send [pull requests](http://help.github.com/pull-requests/) if you have ideas for pushing VIE forward!

Development discussions happen on the `#iks` channel on Freenode. See also [VIE on Ohloh](http://www.ohloh.net/p/vie).

### Running Unit Tests

You need Node.js and [nodeunit](https://github.com/caolan/nodeunit) installed on your system. Then just run:

    $ nodeunit test/*.js
