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
    console.log(entities);
    loadable.resolve(entities);
};

Zart.prototype.RdfaService.prototype.readEntity = function(element) {
    var subject = this.getElementSubject(element);

    var entity = this.readEntityPredicates(subject, element, false);
    if (jQuery.isEmptyObject(entity)) {
        return null;
    }

    entity['@subject'] = subject;

    return new this.zart.Entity(entity);
};

Zart.prototype.RdfaService.prototype.getElementSubject = function(element) {
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

Zart.prototype.RdfaService.prototype.getElementPredicate = function(element) {
    var predicate;
    predicate = element.attr('property');
    if (!predicate) {
        predicate = element.attr('rel');
    }
    return predicate;
};

Zart.prototype.RdfaService.prototype.readEntityPredicates = function(subject, element, emptyValues) {
    var service = this;
    var entityPredicates = {};

    this.findPredicateElements(subject, element, true).each(function() {
        var predicateElement = jQuery(this);
        var predicate = service.getElementPredicate(predicateElement);
        var value = service.readElementValue(predicate, predicateElement);

        if (value === null && !emptyValues) {
            return;
        }

        entityPredicates[predicate] = value;
    });

    if (jQuery(element).get(0).tagName !== 'HTML') {
        jQuery(element).parent('[rev]').each(function() {
            entityPredicates[jQuery(this).attr('rev')] = service.getElementSubject(this); 
        });
    }

    return entityPredicates;
};

Zart.prototype.RdfaService.prototype.findPredicateElements = function(subject, element, allowNestedPredicates) {
    var service = this;
    return jQuery(element).find(this.predicateSelector).add(jQuery(element).filter(this.predicateSelector)).filter(function() {
        if (service.getElementSubject(this) !== subject) {
            return false;
        }
        if (!allowNestedPredicates) {
            if (!jQuery(this).parents('[property]').length) {
                return true;
            }
            return false;
        }

        return true;
    });
};

Zart.prototype.RdfaService.prototype.readElementValue = function(predicate, element) {
    // The `content` attribute can be used for providing machine-readable
    // values for elements where the HTML presentation differs from the
    // actual value.
    var content = element.attr('content');
    if (content) {
        return content;
    }
            
    // The `resource` attribute can be used to link a predicate to another
    // RDF resource.
    var resource = element.attr('resource');
    if (resource) {
        return "<" + resource + ">";
    }
            
    // `href` attribute also links to another RDF resource.
    var href = element.attr('href');
    if (href && element.attr('rel') === predicate) {
        return "<" + href + ">";
    }

    // If the predicate is a relation, we look for identified child objects
    // and provide their identifiers as the values. To protect from scope
    // creep, we only support direct descentants of the element where the
    // `rel` attribute was set.
    if (element.attr('rel')) {
        var value = [];
        var service = this;
        jQuery(element).children(this.subjectSelector).each(function() {
            value.push(service.getElementSubject(this));
        });
        return value;
    }

    // If none of the checks above matched we return the HTML contents of
    // the element as the literal value.
    return element.html();
};
