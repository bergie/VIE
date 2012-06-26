jQuery(document).ready(function() {
  jQuery('.example').each(function() {
    var example = jQuery(this);
    var results = jQuery('.results', this);
    jQuery('button', example).click(function() {
      results.empty();
      eval(jQuery('textarea', example).val()); 
    });
  });
});
