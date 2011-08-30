
zart = new Zart
    defaultService: zart.RdfaService

zart.use new zart.Ontology
    json: 'ontologies/schemaorg.json'
    ns: 'schema'

# entityhub with geonames and dbpedia cached or stored
zart.use new zart.StanbolService 'stanbol',
    url: 'http://dev.iks-project.eu:8080'
    proxy: '../utils/proxy.php'
    ns:
        dbonto: 'http://dbpedia.org/ontology/'
        dbres: 'http://dbpedia.org/resource/'
        geo: 'http://geonames.org/'

# The way VIE can be used
zart.use new zart.RdfaService "rdfa"

@.error ->
    console.log "Something bad happened"

# getSites gives back a list of strings
zart.service('stanbol').getSites (sites) ->
    _(sites).forEach ->
       console.log @

# VIE.EnityManager.getBySubject
entity = zart.entities.get "<http://dbpedia.org/resource/Obama>"
entity = zart.entities.get "dbpedia:Obama"

zart.service('rdfa').getPredicateElements entity, $('div')
zart.service('rdfa').getElementsForPropertiesOf entity

zart.type('schema:Person').extend 'schema:Musician'
zart.types.get('schema:Person')

zart.types.add('example:Musician', 'schema:Person', [new zart.Attribute('example:plays', 'example:Instrument')])

zart.types.get('schema:Person').extend('example:Musician', 
    'example:plays': 'example:Instrument'
    'example:composerOf': ['example:Opera', 'example: Symphony']

# List all possible Properties
zart.types.get('schema:Person').attributes




# create new Entity
# see http://schema.org/Event
eventEntity = zart.entities.add
    "@type":   'schema:MusicEvent' # default: Thing
    "@subject":'http://example.net/newEvent' # optional
    startDate: 'someDateString'
    duration:  'someDateString'
    location:  someSchemaPlace # or http://...

assertTrue eventEntity.is 'schema:Event'
json = eventEntity.as 'jsonld'

# schema:name -> rdfs:label
# rdfs:label: "{{foaf:FirstName}} {{foaf:LastName}}"

# foaf:Person is schema:Person
zart.mappings.alias "foaf:Person", "schema:Person"

zart.get
eventEntity.addPerformers

# Annotate 
$('#content').annotate


# Query
myQuery = zart.load
  subject: "http://dbpedia/Obama"
  predicates: ["name", "dateOfBirth"]
  use: "stanbol"
  success: (entities) ->
    console.log entities
  error: (err) ->
    console.log "Something is wrong!"

do myQuery.execute unless foo is bar

zart.load({element: "div"}).from("rdfa")
zart.load({element: "div"}).from(new zart.RdfaService());

zart.load(queryParams)
    .from("stanbol")
    .execute
        success: (entities) ->
            console.log entities

# Store
zart.save(entity)
    .using("stanbol")
    .set(
        name: "Barack"
    )
    .execute()

# Annotate
zart.annotate($("div"))
    .with("stanbol")
    .execute()

# Delete
zart.delete(entity)
    .using("stanbol")
    .execute()



