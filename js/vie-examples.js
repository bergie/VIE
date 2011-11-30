jQuery(document).ready(function() {
    jQuery('#features textarea').each(function() {
        jQuery(this).css('height', jQuery(this).get(0).scrollHeight);
    });

    jQuery('#features').accordion();

    jQuery('#analyze button').button().click(function() {
        jQuery('#analyze .resultsholder').empty();
        eval(jQuery('#analyze textarea').val()); 
    });
});
