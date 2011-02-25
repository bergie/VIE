(function($){
    $.fn.vieSemanticAloha = function() {
        this.each(function() {
            var containerInstance = VIE.ContainerManager.getInstanceForContainer(jQuery(this));
            containerInstance.editables = {};
            VIE.ContainerManager.findContainerProperties(this, false).each(function() {
                var containerProperty = jQuery(this);
                var propertyName = containerProperty.attr('property');

                if (containerInstance.get(propertyName) instanceof Array) {
                    // For now we don't deal with multivalued properties in Aloha
                    return true;
                }

                containerInstance.editables[propertyName] = new GENTICS.Aloha.Editable(containerProperty);
                containerInstance.editables[propertyName].vieContainerInstance = containerInstance;
            });
        })
    }
})(jQuery);
