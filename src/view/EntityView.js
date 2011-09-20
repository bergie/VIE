if (!Zart.prototype.view) {
    Zart.prototype.view = {};
}

Zart.prototype.view.Entity = Backbone.View.extend({
    initialize: function(options) {
        this.service = options.service ? options.service : 'rdfa';
        this.zart = options.zart;

        // Ensure view gets updated when properties of the Entity change.
        _.bindAll(this, 'render');
        this.model.bind('change', this.render);
    },

    // Rendering a view means writing the properties of the Entity back to
    // the element containing our RDFa annotations.
    render: function() {
        this.zart.save({
                element: this.el, 
                entity: this.model
            }).
            to(this.service).
            execute();
        return this;
    }
}); 
