jQuery(document).ready(function() {
    jQuery('#features').accordion();
    jQuery('#moreinfo').tabs();

    jQuery('#features > div').each(function() {
        var feature = jQuery(this).attr('id');
        if (!feature) {
            return true;
        }

        jQuery('#' + feature + ' button').button().click(function() {
            jQuery('#' + feature + ' .resultsholder').empty();
            eval(jQuery('#' + feature + ' textarea').val()); 
        });
    });
});
