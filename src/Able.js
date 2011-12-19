//     VIE - Vienna IKS Editables
//     (c) 2011 Henri Bergius, IKS Consortium
//     (c) 2011 Sebastian Germesin, IKS Consortium
//     (c) 2011 Szaby Grünwald, IKS Consortium
//     VIE may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://viejs.org/

// ## VIE.Able
// VIE implements ...
// This is implemented via the <a href="http://api.jquery.com/category/deferred-object/">jQuery.Deferred object</a>. 

// ### VIE.Type(id, attrs)
// This is the constructor of a VIE.Able. This should not be called
// globally but using the inherited classes below.  
// **Parameters**:  
// *nothing*  
// **Throws**:  
// *nothing*  
// **Returns**:  
// *{VIE.Able}* : A **new** VIE.Able object.  
// **Example usage**:  
//
//     var able = new Able();
VIE.prototype.Able = function(){

// ### init(options, methodName)
// This method is called during initialization.  
// **Parameters**:  
// *{object}* **options** ...  
// *{string}* **methodName** ...  
// **Throws**:  
// *nothing*  
// **Returns**:  
// *{VIE.Able}* : The current instance.  
// **Example usage**:  
//
//     var able = new vie.Able().init();
//     able.using("stanbol");
    this.init = function(options, methodName) {
        this.options = options;
        this.services = options.from || options.using || options.to || [];
        this.vie = options.vie;
        
        this.methodName = methodName;
    
        this.deferred = jQuery.Deferred();
    
// In order to get more information and documentation about the passed-through
// deferred methods and their synonyms, please see the documentation of 
// the <a href="http://api.jquery.com/category/deferred-object/">jQuery.Deferred object</a>.
        /* Public deferred-methods */
        this.resolve = this.deferred.resolve;
        this.resolveWith = this.deferred.resolveWith;
        this.reject = this.deferred.reject;
        this.rejectWith = this.deferred.rejectWith;
        this.success = this.done = this.deferred.done;
        this.fail = this.deferred.fail;
        this.then = this.deferred.then;
        this.always = this.deferred.always;
        this.from = this.using;
        this.to = this.using;
        
        return this;
    };
    
    
// ### using(services)
// This method registers services with the current able instance.  
// **Parameters**:  
// *{string|array}* **services** An id of a service or an array of strings.  
// **Throws**:  
// *nothing*  
// **Returns**:  
// *{VIE.Able}* : The current instance.  
// **Example usage**:  
//
//     var able = new vie.Able();
//     able.using("stanbol");
    this.using = function(services) {
        var self = this;
        services = (_.isArray(services))? services : [ services ];
        _.each (services, function (s) {
            var obj = (typeof s === "string")? self.vie.service(s) : s;
            self.services.push(obj);
        });
        return this;
    };
    
// ### execute()
// This method runs the actual method on all registered services.  
// **Parameters**:  
// *nothing*  
// **Throws**:  
// *nothing* ...   
// **Returns**:  
// *{VIE.Able}* : The current instance.  
// **Example usage**:  
//
//     var able = new vie.Able().init();
//     able.using("stanbol")
//     .done(function () {alert("finished");})
//     .execute();
    this.execute = function() {
        /* call service[methodName] */
        var able = this;
        _(this.services).each(function(service){
            service[able.methodName](able);
        });
        return this;
    };
};

// ## VIE.Loadable
// A ```VIE.Loadable``` is a wrapper around the deferred object
// to **load** semantic data from a semantic web service.
VIE.prototype.Loadable = function (options) {
    this.init(options,"load");
};
VIE.prototype.Loadable.prototype = new VIE.prototype.Able();

// ## VIE.Savable
// A ```VIE.Savable``` is a wrapper around the deferred object
// to **save** semantic data to a semantic web service.
VIE.prototype.Savable = function(options){
    this.init(options, "save");
};
VIE.prototype.Savable.prototype = new VIE.prototype.Able();

// ## VIE.Removable
// A ```VIE.Removable``` is a wrapper around the deferred object
// to **remove** semantic data from a semantic web service.
VIE.prototype.Removable = function(options){
    this.init(options, "remove");
};
VIE.prototype.Removable.prototype = new VIE.prototype.Able();

// ## VIE.Analyzable
// A ```VIE.Analyzable``` is a wrapper around the deferred object
// to **analyze** data and extract semantic information with the
// help of a semantic web service.
VIE.prototype.Analyzable = function (options) {
    this.init(options, "analyze");
};
VIE.prototype.Analyzable.prototype = new VIE.prototype.Able();

// ## VIE.Findable
// A ```VIE.Findable``` is a wrapper around the deferred object
// to **find** semantic data on a semantic web service.
VIE.prototype.Findable = function (options) {
    this.init(options, "find");
};
VIE.prototype.Findable.prototype = new VIE.prototype.Able();

