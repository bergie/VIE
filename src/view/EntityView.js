/*global VIE:false Backbone:false _:false */
if (!VIE.prototype.view) {
    VIE.prototype.view = {};
}

VIE.prototype.view.Entity = Backbone.View.extend({
    initialize: function(options) {
        this.service = options.service ? options.service : 'rdfa';
        this.vie = options.vie;

        // Ensure view gets updated when properties of the Entity change.
        this.listenTo(this.model, 'change', this.render);
        this.listenTo(this.model, 'change:@subject', this.renderAbout);
    },

    // Rendering a view means writing the properties of the Entity back to
    // the element containing our RDFa annotations.
    render: function() {
        this.vie.save({
                element: this.el,
                entity: this.model
            }).
            to(this.service).
            execute();
        return this;
    },

    renderAbout: function () {
        this.vie.service(this.service).setElementSubject(this.model.getSubjectUri(), this.el);
    }
});
