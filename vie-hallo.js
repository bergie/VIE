(function($){
    $.fn.vieSemanticHallo = function(options) {

        // Default settings
        var opt = {};
        $.extend(opt, options);

        this.each(function() {
            var containerInstance = opt.vie.RDFaEntities.getInstance($(this));
            if (!containerInstance) {
                return;
            }

            if (typeof containerInstance.editables === 'undefined') {
                containerInstance.editables = {};
            }

            opt.vie.RDFa.findPredicateElements(containerInstance.id, this, false).each(function() {
                var containerProperty = $(this);

                var propertyName = containerProperty.attr('property');
                if (propertyName === undefined) {
                    return true;
                }

                if (containerInstance.get(propertyName) instanceof Array) {
                    // For now we don't deal with multivalued properties in Hallo
                    return true;
                }

                // Handle plugin: each type can have different plugins.
                // Because we want different options by content type, pass a copy
                // of the options to hallo
                var finalOptions = jQuery.extend(true, {}, opt);
                if (opt.plugins) {
                    if (opt.plugins[propertyName]) {
                        finalOptions.plugins = opt.plugins[propertyName];
                    } else if (opt.plugins['default']) {
                        finalOptions.plugins = opt.plugins['default'];
                    } else {
                        finalOptions.plugins = {};
                    }
                }
                containerInstance.editables[propertyName] = $(this).hallo(finalOptions);
                containerInstance.editables[propertyName].vieContainerInstance = containerInstance;
            });
        });
    };
})(jQuery);

if (typeof VIE === 'undefined') {
    VIE = {};
}

VIE.HalloEditable = {
    refreshFromEditables: function(objectInstance) {
        var modifiedProperties = {};

        if (!objectInstance.editables) {
            return false;
        }

        // Go through editables of the model instance
        jQuery.each(objectInstance.editables, function(propertyName, editableInstance) {
            if (!editableInstance.hallo('isModified')) {
                // This editable hasn't been modified, skip
                return true;
            }

            // Copy editable contents to the modifiedProperties object
            modifiedProperties[propertyName] = editableInstance.hallo('getContents');
        });

        if (jQuery.isEmptyObject(modifiedProperties)) {
            // No modified editables for this object, skip
            return false;
        }
        // Set the modified properties to the model instance
        objectInstance.set(modifiedProperties);

        return true;
    }
};
