Zart.prototype.RdfaService = function(options) {
    if (!options) {
        options = {};
    }
    this.zart = null;
    this.name = 'rdfa';
    this.subjectSelector = options.subjectSelector ? options.subjectSelector : "[about],[typeof],[src],html";
    this.predicateSelector = options.predicateSelector ? options.predicateSelector : "[property],[rel]";
};

Zart.prototype.RdfaService.prototype.load = function(loadable) {
    var service = this;
    var correct = loadable instanceof this.zart.Loadable;
    if (!correct) {
        throw "Invalid Loadable passed";
    }

    var element = loadable.options.element ? loadable.options.element : jQuery(document);

    var entities = [];
    jQuery(this.subjectSelector, element).add(jQuery(element).filter(this.subjectSelector)).each(function() {
        var entity = service.readEntity(this);
        if (entity) {
            entities.push(entity);
        }
    });

    loadable.resolve(entities);
};

Zart.prototype.RdfaService.prototype.readEntity = function(element) {
    var entity = {};
    var subject = this.getSubject(element);

    entity['@subject'] = subject;

    return new this.zart.Entity(entity);
};

Zart.prototype.RdfaService.prototype.getSubject = function(element) {
    if (typeof document !== 'undefined') {
        if (element === document) {
            return document.baseURI;
        }
    }
    var subject;
    jQuery(element).closest(this.subjectSelector).each(function() {
        if (jQuery(this).attr('about')) {
            subject = jQuery(this).attr('about');
            return true;
        }
        if (jQuery(this).attr('src')) {
            subject = jQuery(this).attr('src');
            return true;
        }
        if (jQuery(this).attr('typeof')) {
            subject = this;
            return true;
        }

        // We also handle baseURL outside browser context by manually
        // looking for the `<base>` element inside HTML head.
        if (jQuery(this).get(0).nodeName === 'HTML') {
            jQuery(this).find('base').each(function() {
                subject = jQuery(this).attr('href');
            });
        }
    });
            
    if (!subject) {
        return undefined;
    }
            
    if (typeof subject === 'object') {
        return subject;
    }

    return "<" + subject + ">"
};
