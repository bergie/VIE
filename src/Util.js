// Utilities for the day-to-day Zart.js usage

// extension to jQuery to compare two arrays on equality
// found: http://stackoverflow.com/questions/1773069/using-jquery-to-compare-two-arrays
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

Zart.Util = {
    toCurie : function (uri, safe, namespaces) {
        var delim = ":";
        for (var k in namespaces.toObj()) {
            if (uri.indexOf(namespaces.get(k)) === 1) {
                var pattern = new RegExp("^" + "<" + namespaces.get(k));
                return ((safe)? "[" : "") + 
                        uri.replace(pattern, k + delim).replace(/>$/, '') +
                        ((safe)? "]" : "");
            }
        }
        throw "No prefix found for uri '" + uri + "'!";
    },
    
    isCurie : function (something) {
        return !Zart.Util.isUri(something) && something.indexOf(":") !== -1;
    },
    
    toUri : function (curie, namespaces) {
        var delim = ":";
        for (var k in namespaces.toObj()) {
            if (curie.indexOf(k) === 0 || curie.indexOf(k) === 1) {
                var pattern = new RegExp("^" + "\\[{0,1}" + k + delim);
                return "<" + curie.replace(pattern, namespaces.get(k)).replace(/\]{0,1}$/, '') + ">";
            }
        }
        //default:
        if (curie.indexOf(delim) === -1 && namespaces.get("default")) {
            return "<" + namespaces.get("default") + curie + ">";
        }
        throw "No prefix found for uri '" + curie + "'!";
    },
    
    isUri : function (something) {
        return (typeof something === "string" && something.search(/^<.+:.+>$/) === 0);
    },
    
    unduplicate : function (arr) {
        var sorted_arr = arr.sort();
        var results = [];
        for (var i = 0; i < sorted_arr.length; i++) {
            var a = i === sorted_arr.length-1;
            var b = sorted_arr[i];
            var c = sorted_arr[i+1];
            var d = b !== c;
            var e = b != c;
            if (i === sorted_arr.length-1 || sorted_arr[i] != sorted_arr[i+1]) {
                results.push(sorted_arr[i]);
            }
        }
        return results;
    },

};

