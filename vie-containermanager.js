if (typeof VIE === 'undefined') {
    throw 'VIE Container Manager requires VIE to be available';
}

VIE.ContainerManager = {
    instances: VIE.EntityManager.allEntities,

    findContainerProperties: function(element, allowPropertiesInProperties) {
        return VIE.RDFa.findPredicateElements(element, allowPropertiesInProperties);
    },

    getContainerIdentifier: function(element) {
        return VIE.RDFa._getElementValue(element, 'about');
    },

    cloneContainer: function(element) {
        element = jQuery(element).clone(false);

        if (typeof element.attr('about') !== 'undefined')
        {
            // Direct match with container
            element.attr('about', '');
        }
        element.find('[about]').attr('about', '');
        VIE.RDFa.findPredicateElements('', element, false).html('');

        return element;
    },

    getViewForContainer: function(element) {
        return VIE.RDFaView;
    },

    getModelForContainer: function(element) {
        return VIE.RDFEntity;
    },

    /**
     * Override this to seek additional information from the element to include to the view
     */
    findAdditionalViewProperties: function(element, properties) {
    },

    /**
     * Override this to seek additional properties from the element to include to the model
     */
    findAdditionalModelProperties: function(element, properties) {
    },

    /**
     * Override this to seek additional properties from the element to include to the instance
     */
    findAdditionalInstanceProperties: function(element, modelInstance) {
    },

    registerInstance: function(modelInstance, element) {
    },

    getInstanceForContainer: function(element) {
        return VIE.RDFaEntities.getInstance(element);
    },

    cleanup: function() {
        VIE.cleanup();
    }
};
