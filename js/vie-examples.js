jQuery(document).ready(function() {
    jQuery('#features').accordion({
        collapsible: true,
        active: false
    });
    jQuery('#moreinfo').tabs();

    jQuery('#features > div').each(function() {
        var feature = jQuery(this).attr('id');
        if (!feature) {
            return true;
        }

        jQuery('#' + feature + ' .exampleholder button').button().click(function() {
            jQuery('#' + feature + ' .resultsholder').empty();
            eval(jQuery('#' + feature + ' textarea').val()); 
        });
    });
});
