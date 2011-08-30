// File:   type.js
// Author: <a href="mailto:sebastian.germesin@dfki.de">Sebastian Germesin</a>
//

Zart.prototype.Type = function (params) {
	
	this.subsumes = function () {
		//TODO
	};
	
	this.extend = function () {
		//TODO
	};
	
	this.attributes = function () {
		//TODO
	};
};

Zart.prototype._types = [];

Zart.prototype.types = {
	
	add: function (obj) {
		if (!(obj instanceof Zart.Type)) {
			obj = new Zart.Type(obj);
		}
		Zart._types.push(obj);
	},
	
	get: function (id) {
		//TODO
	}
};