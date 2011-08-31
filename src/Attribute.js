// File:   Attribute.js
// Author: <a href="mailto:sebastian.germesin@dfki.de">Sebastian Germesin</a>
//

Zart.prototype.Attribute = function (params) {
	
};

Zart.prototype.Attributes = function (params) {
	// a list of attributes
	this.add = function (obj) {
		if (!(obj instanceof Zart.Attribute)) {
			obj = new Zart.Attribute(obj);
		}
		Zart._attributes.push(obj);
	},
	
	this.get = function (id) {
		//TODO
	}
};

Zart.prototype.attributes = {
	
	
};