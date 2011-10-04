(function($){
    $.fn.vieSemanticHallo = function(options) {

        // Default settings
        var opt = {};
        $.extend(opt, options);

        this.each(function() {
            var containerInstance = VIE.RDFaEntities.getInstance($(this));
            if (!containerInstance) {
                return;
            }
            if (typeof containerInstance.editables === 'undefined') {
                containerInstance.editables = {};
            }

            VIE.RDFa.findPredicateElements(containerInstance.id, this, false).each(function() {
                var containerProperty = $(this);

                var propertyName = containerProperty.attr('property');
                if (propertyName === undefined) {
                    return true;
                }

                if (containerInstance.get(propertyName) instanceof Array) {
                    // For now we don't deal with multivalued properties in Aloha
                    return true;
                }

                containerInstance.editables[propertyName] = $(this).hallo(opt);
                //console.log(containerInstance.editables[propertyName]);
                containerInstance.editables[propertyName].vieContainerInstance = containerInstance;
            });
        });
    };
})(jQuery);