jQuery(document).ready(function() {
  jQuery('.example').each(function() {
    var source = jQuery('textarea', this);
    eval(source.val());
    var button = jQuery('<button class="btn btn-large">Source code</button>');
    jQuery(this).append(button);
    source.hide();
    button.click(function() {
      source.toggle(100);
    });
  });
});
