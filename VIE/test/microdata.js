var jQuery = require('jquery');
var VIE = require('../vie.js');

exports['read simple microdata'] = function(test) {
    var html = jQuery('<div itemscope itemtype="http://schema.org/Movie"><h1 itemprop="name">Avatar</h1><span>Director: <span itemprop="director">James Cameron</span> (born August 16, 1954)</span><span itemprop="genre">Science fiction</span><a href="../movies/avatar-theatrical-trailer.html" itemprop="trailer">Trailer</a></div>');

    var objectInstance = VIE.RDFaEntities.getInstance(html);

    test.ok(objectInstance, "Check that we got an entity from Microdata");
    if (!objectInstance) {
        VIE.cleanup();
        test.done();
        return;
    }

    test.equal(objectInstance.get('name'), 'Avatar');
    test.equal(objectInstance.get('trailer'), '../movies/avatar-theatrical-trailer.html');

    VIE.cleanup();
    test.done();
};

exports['circular references'] = function(test) {
    var html = jQuery('<div itemscope itemid="#henri" itemtype="http://schema.org/Person"><a itemprop="http://xmlns.com/0.1/foaf/knows" href="#manu">Manu</a> knows</div><div itemscope itemid="#manu" itemtype="http://schema.org/Person"> <a itemprop="http://xmlns.com/0.1/foaf/knows" href="#henri">Henri</a></div>');

    var objectInstances = VIE.RDFaEntities.getInstances(html);

    test.equal(objectInstances.length, 2);
    VIE.cleanup();
    test.done();
}
