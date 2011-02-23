(function($){
	$.fn.vieSemanticAloha = function() {
		this.each(function() {
			var containerInstance = VIE.ContainerManager.getInstanceForContainer(jQuery(this));
			containerInstance.editables = {};
			jQuery(containerInstance.view.el).find('[property]').each(function() {
				var containerProperty = jQuery(this);
				var propertyName = containerProperty.attr('property');
				containerInstance.editables[propertyName] = new GENTICS.Aloha.Editable(containerProperty);
				containerInstance.editables[propertyName].vieContainerInstance = containerInstance;
			});
		})
	}
})(jQuery);
