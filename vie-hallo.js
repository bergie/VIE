
jQuery(document).ready(function() {

    VIE.EntityManager.initializeCollection();

    VIE.EntityManager.entities.bind('add', function(model) {
        model.url = vie_phpcr_path + model.id;
        model.toJSON = model.toJSONLD;
    });

    // Load all RDFa entities into VIE
    VIE.RDFaEntities.getInstances();

    // Make all RDFa entities editable
    jQuery('[typeof][about]').each(function() {
        jQuery(this).hallo({
            plugins: {
                halloformat: {},
                hallolinkimg: {},
                halloheadings: {},
                hallojustify: {},
                hallolists: {},
            }
        });
        jQuery(this).bind('halloactivated', function() {
            jQuery('#savebutton').show();
        });
        jQuery(this).bind('hallodeactivated', function() {
            jQuery('#savebutton').hide();
        });
    });

    jQuery('#savebutton').bind('click', function() {
        // Go through all Backbone model instances loaded for the page
        VIE.EntityManager.entities.each(function(objectInstance) {
            // TODO: check if was modified

            // Set the modified properties to the model instance
            objectInstance.save(null, {
                success: function(savedModel, response) {
                    alert(savedModel.id + " was saved, see JS console for details");
                    jQuery('#savebutton').hide();
                },
                error: function(response) {
                    console.log("Save failed");
                }
            });
        });
    });

});