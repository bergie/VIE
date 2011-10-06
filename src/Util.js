// File:   Util.js <br />
// Author: <a href="http://github.com/neogermi/">Sebastian Germesin</a>
//

// Utilities for the day-to-day VIE.js usage

// extension to jQuery to compare two arrays on equality
// found: <a href="http://stackoverflow.com/questions/1773069/using-jquery-to-compare-two-arrays">http://stackoverflow.com/questions/1773069/using-jquery-to-compare-two-arrays</a>
jQuery.fn.compare = function(t) {
    if (this.length != t.length) { return false; }
    var a = this.sort(),
        b = t.sort();
    for (var i = 0; t[i]; i++) {
        if (a[i] !== b[i]) { 
                return false;
        }
    }
    return true;
};

// Extension to the JS native Array implementation to remove values from an array.
// from: <a href="http://sebastian.germes.in/blog/2011/09/javascripts-missing-array-remove-function/">http://sebastian.germes.in/blog/2011/09/javascripts-missing-array-remove-function/</a>
if (!Array.prototype.remove) {
  Array.prototype.remove = function () {
    var args = this.remove.arguments;

    if (args[0] && args[0] instanceof Array) {
      var a = args[0];
      for (var i = 0; i < a.length; i++) {
        this.remove(a[i]);
      }
    } else {
      for (var i = 0; i < args.length; i++) {
        while(true) {
          var index = this.indexOf(args[i]);
          if (index !== -1)
            this.splice(index, 1);
          else
            break;
        }
      }
    }
  return this;
  };
}

//Extension to the JS native Array implementation to remove duplicates from an array.
//This actually leaves the original Array untouched and returns a copy with no duplicates.
if (!Array.prototype.unduplicate) {
	Array.prototype.unduplicate = function () {
	    var sorted_arr = this.sort();
	    var results = [];
	    for (var i = 0; i < sorted_arr.length; i++) {
	        if (i === sorted_arr.length-1 || sorted_arr[i] != sorted_arr[i+1]) {
	            results.push(sorted_arr[i]);
	        }
	    }
	    return results;
	};
} 


VIE.Util = {
		// converts a given URI into a CURIE (or save CURIE), based
		// on the given VIE.Namespaces object.
	toCurie : function (uri, safe, namespaces) {
        var delim = ":";
        for (var k in namespaces.toObj()) {
            if (uri.indexOf(namespaces.get(k)) === 1) {
                var pattern = new RegExp("^" + "<" + namespaces.get(k));
                if (k === '') delim = '';
                return ((safe)? "[" : "") + 
                        uri.replace(pattern, k + delim).replace(/>$/, '') +
                        ((safe)? "]" : "");
            }
        }
        throw new Error("No prefix found for URI '" + uri + "'!");
    },

	// checks, whether the given string is a CURIE.
    isCurie : function (something, namespaces) {
    	try {
    		 VIE.Util.toUri (something, namespaces);
    		 return true;
    	} catch (e) {
    		return false;
    	}
    },

	// converts a given CURIE (or save CURIE) into a URI, based
	// on the given VIE.Namespaces object.
    toUri : function (curie, namespaces) {
        var delim = ":";
        for (var k in namespaces.toObj()) {
            if (k !== "" && (curie.indexOf(k) === 0 || curie.indexOf(k) === 1)) {
                var pattern = new RegExp("^" + "\\[{0,1}" + k + delim);
                return "<" + curie.replace(pattern, namespaces.get(k)).replace(/\]{0,1}$/, '') + ">";
            }
        }
        //default:
        if (curie.indexOf(delim) === -1 && namespaces.base()) {
            return "<" + namespaces.base() + curie + ">";
        }
        throw new Error("No prefix found for CURIE '" + curie + "'!");
    },
    
    // checks, whether the given string is a URI.
    isUri : function (something) {
        return (typeof something === "string" && something.search(/^<.+:.+>$/) === 0);
    },
    
    _blankNodeSeed : new Date().getTime() % 1000,
    
    blankNodeID : function () {
      this._blankNodeSeed += 1;
      return '_:bnode' + this._blankNodeSeed.toString(16);
    }    
    
};
