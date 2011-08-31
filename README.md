Zart.js
=======

Zart is a new JavaScript library for managing information on a web page. It is based on existing VIE and VIE^2 libraries.

## Development

Zart development is coordinated in IKS's [GitHub account](https://github.com/IKS/zart.js). To contribute, just fork the repository and send pull requests. Contributions that include their own unit tests appreciated!

Zart source code is inside the `src` directory. Each separate unit of functionality should be handled in its own file, with the `src/Zart.js` being the entry point to the system.

Zart is licensed under the MIT license.

## Building Zart

The Zart library consists of many individual pieces that we merge together in the build process. You'll need [Apache Ant](http://ant.apache.org/). Then just run:

    $ ant

The built Zart library will appear in the `dist` folder.

## Running unit tests

Direct your browser to the `test/index.html` file to run Zart's [QUnit](http://docs.jquery.com/Qunit) tests.
