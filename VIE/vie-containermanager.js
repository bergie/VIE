if (typeof VIE === 'undefined') {
    VIE = {};
}

VIE.ContainerManager = {
    models: {},
    views: {},
    instances: [],

    /**
     * @private
     */
    _getContainerProperties: function(element, emptyValues) {
        var containerProperties = {};

        jQuery('[property]', element).each(function(index, objectProperty) {
        	var propertyName;
            objectProperty = jQuery(objectProperty);
            propertyName = objectProperty.attr('property');

            if (emptyValues) {
                containerProperties[propertyName] = '';
                return;
            }

            containerProperties[propertyName] = objectProperty.html();
        });

        return containerProperties;
    },

    /**
     * @private
     */
    _getContainerValue: function(element, propertyName) {
        element = jQuery(element);

        if (typeof element.attr(propertyName) !== 'undefined')
        {
            // Direct match with container
            return element.attr(propertyName);
        }
        return element.find('[' + propertyName + ']').attr(propertyName);
    },

    getContainerIdentifier: function(element) {
        return VIE.ContainerManager._getContainerValue(element, 'about');
    },

    cloneContainer: function(element) {
        element = jQuery(element).clone(false);

        if (typeof element.attr('about') !== 'undefined')
        {
            // Direct match with container
            element.attr('about', '');
        }
        element.find('[about]').attr('about', '');
        element.find('[property]').html('');

        return element;
    },

    getViewForContainer: function(element) {
        element = jQuery(element);
        var type = VIE.ContainerManager._getContainerValue(element, 'typeof');

        if (typeof VIE.ContainerManager.views[type] !== 'undefined') {
            // We already have a view for this type
            return VIE.ContainerManager.views[type];
        }

        var viewProperties = {};
        viewProperties.initialize = function() {
            _.bindAll(this, 'render');
            this.model.bind('change', this.render);
            this.model.view = this;
        };
        viewProperties.tagName = element.get(0).nodeName;
        viewProperties.make = function(tagName, attributes, content) { 
            return VIE.ContainerManager.cloneContainer(element);
        };
        viewProperties.render = function() {
            var model = this.model;
            jQuery('[property]', this.el).each(function(index, propertyElement) {
                propertyElement = jQuery(propertyElement);
                var property = propertyElement.attr('property');
                propertyElement.html(model.get(property));
            });
            return this;
        };

        VIE.ContainerManager.views[type] = Backbone.View.extend(viewProperties);

        return VIE.ContainerManager.views[type];
    },

    getModelForContainer: function(element) {
        var type = VIE.ContainerManager._getContainerValue(element, 'typeof');

        if (typeof VIE.ContainerManager.models[type] !== 'undefined') {
            // We already have a model for this type
            return VIE.ContainerManager.models[type];
        }

        // Parse the relevant properties from DOM
        var modelPropertiesFromRdf = VIE.ContainerManager._getContainerProperties(element, true);
        var modelProperties = jQuery.extend({}, modelPropertiesFromRdf);

        modelProperties.getType = function() {
            return type;
        }

        VIE.ContainerManager.findAdditionalModelProperties(element, modelProperties);

        VIE.ContainerManager.models[type] = Backbone.Model.extend(modelProperties);

        return VIE.ContainerManager.models[type];
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

    getInstanceForContainer: function(element) {
        var model = VIE.ContainerManager.getModelForContainer(element);
        var properties = VIE.ContainerManager._getContainerProperties(element, false);
        var view = VIE.ContainerManager.getViewForContainer(element);

        properties.id = VIE.ContainerManager._getContainerValue(element, 'about');

        var modelInstance = new model(properties);
        modelInstance.view = new view({model: modelInstance, el: element});

        VIE.ContainerManager.findAdditionalInstanceProperties(element, modelInstance);
        VIE.ContainerManager.instances.push(modelInstance);

        return modelInstance;
    },

    cleanup: function() {
        VIE.ContainerManager.instances = [];
    }
};
