// Based on https://github.com/jaubourg/ajaxHooks/blob/master/src/ajax/xdr.js written by Julian Aubourg
// Author: Szaby Grünwald @ Salzburg Research, 2011
(function( jQuery ) {

if ( window.XDomainRequest ) {
	jQuery.ajaxTransport(function( s ) {
		if ( s.crossDomain && s.async ) {
			if ( s.timeout ) {
				s.xdrTimeout = s.timeout;
				delete s.timeout;
			}
			var xdr;
			return {
				send: function( _, complete ) {
					function callback( status, statusText, responses, responseHeaders ) {
						xdr.onload = xdr.onerror = xdr.ontimeout = jQuery.noop;
						xdr = undefined;
						complete( status, statusText, responses, responseHeaders );
					}
					xdr = new XDomainRequest();
					// For backends supporting header_* in the URI instead of real header parameters,
					// use the dataType for setting the Accept request header. e.g. Stanbol supports this.
					if(s.dataType){
					    var headerThroughUriParameters = "header_Accept=" + encodeURIComponent(s.dataType);
					    s.url = s.url + (s.url.indexOf("?") === -1 ? "?" : "&" ) + headerThroughUriParameters;
					}
					xdr.open( s.type, s.url );
					xdr.onload = function(e1, e2) {
						callback( 200, "OK", { text: xdr.responseText }, "Content-Type: " + xdr.contentType );
					};
					xdr.onerror = function(e) {
					    console.error(JSON.stringify(e));
						callback( 404, "Not Found" );
					};
					if ( s.xdrTimeout ) {
						xdr.ontimeout = function() {
							callback( 0, "timeout" );
						};
						xdr.timeout = s.xdrTimeout;
					}
					xdr.send( ( s.hasContent && s.data ) || null );
				},
				abort: function() {
					if ( xdr ) {
						xdr.onerror = jQuery.noop();
						xdr.abort();
					}
				}
			};
		}
	});
}
})( jQuery );
