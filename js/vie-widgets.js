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

Backbone.sync = function(method, model, options) {
  if (console && console.log) {
    console.log('Model contents', model.toJSONLD());
  }
  options.success(model);
};
