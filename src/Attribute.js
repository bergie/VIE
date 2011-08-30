// File:   type.js
// Author: <a href="mailto:sebastian.germesin@dfki.de">Sebastian Germesin</a>
//

Zart.prototype.Attribute = function (params) {
	
};

Zart.prototype._attributes = [];

Zart.prototype.attributes = {
	
	add: function (obj) {
		if (!(obj instanceof Zart.Attribute)) {
			obj = new Zart.Attribute(obj);
		}
		Zart._attributes.push(obj);
	},
	
	get: function (id) {
		//TODO
	}
};