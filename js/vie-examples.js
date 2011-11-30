jQuery(document).ready(function() {
    jQuery('#features textarea').each(function() {
        jQuery(this).css('height', jQuery(this).get(0).scrollHeight);
    });

    jQuery('#features').accordion();

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
