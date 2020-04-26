[![title](screenshots/title.svg)](http://www.eenstukjenostalgie.amsterdam)

<div align="center">
  <img src="screenshots/crosses.svg">
  <h1>Meesterproef Adamnet</h1>
  <p>
    For the organisation <a href="http://www.adamnet.nl">Adamnet</a> we created the website <a href="http://www.eenstukjenostalgie.amsterdam">eenstukjenostalgie.amsterdam</a>, where people can create there own <strong>Memories Book</strong>, filled with images from a chosen time period and location.
  </p>
  <img src="screenshots/new-story-page.png">
</div>
<br>

## Table of Contents

* [How to install](#how-to-install)
* [Frameworks](#frameworks)
* [Features](#features)
* [Project Information](#project-information)
* [User Scenarios](#user-scenarios)
* [Linked open data](#linked-open-data)
* [Usage](#usage)
* [Coming soon...](#coming-soon)
* [Wishlist](#wishlist)
* [Collaborators](#collaborators)

## How to install

First of all, download or clone the project, navigate to the root folder and install dependencies by `npm install`.
Create a `vars.env` file with the port number you want to start the server on, for example `PORT=3000`.
Run `npm run build` to build the bundle.js file and last of all, `npm start` to start the server and to work on our application!

## Frameworks

We have used the following frameworks and packages:

**Server:**
- [x] [Express JS](https://expressjs.com/)
- [x] [Express session](https://www.npmjs.com/package/express-session)
- [x] [Body parser](https://www.npmjs.com/package/body-parser)
- [x] [Node fetch](https://www.npmjs.com/package/node-fetch)

**Templating:**
- [x] [EJS](http://ejs.co/)

**Bundling:**
- [x] [Browserify](http://browserify.org/)

**Packages used for the map:**
- [x] [Turf](http://turfjs.org/)
- [x] [Circle to polygon](https://www.npmjs.com/package/circle-to-polygon)
- [x] [Wellknown](https://www.npmjs.com/package/wellknown)

**Generating IDs:**
- [x] [Uuid](https://www.npmjs.com/package/uuid)
- [x] [Shortid](https://www.npmjs.com/package/shortid)

## Project Information

[Adamlink](http://www.adamlink.nl), a project of [Adamnet](http://www.adamnet.nl), have made the Linked Open Data available for us. In this data you can find collections from Amsterdam. The collections are from ‘Beeldbank Stadsarchief’, ‘Amsterdams Museum’ , ‘IISG’ and ‘OBA’.

Adamlink asked us to create an interface where everybody is able to search for images (not only the people with SPARQL knowledge). This project is made for people with a background in Amsterdam. They may have lived their, or maybe their grandmother has lived in the city. But it could also be used by a teacher who wants to learn his students more about a specific part of Amsterdam.

### Concept
---

With [eenstukjenostalgie.amsterdam](http://www.eenstukjenostalgie.amsterdam) we are helping people to collect images they will give them memories back. By choosing a location and a time period, you will receive images of your neighborhood. If you like an image, you can save it to your memories book.

The good thing about our application is that you are not only looking for the most common results. The user will get surprised about the images they will find.

The memories book will not only be about your neighborhood. You have the option to add new chapters, like: political posters, music posters or about your primary school and more.


## Linked open data

The data we use is coming from [Adamlink](http://www.adamlink.nl) and is known as Linked Open Data. This means that all of the data in the Adamlink database are linked to each other or other databases. With Linked Open Data you can easily link data from one source to another. Links are made using **URIs**, like this one:

```
<http://www.opengis.net/ont/geosparql#>
```

### SPARQL
---

Fetching data from this database is done with SPARQL. SPARQL is an RDF query language, that is, a semantic query language for databases, able to retrieve and manipulate data stored in Resource Description Framework (RDF) format. *(Source: [Wikipedia](https://en.wikipedia.org/wiki/SPARQL))*

**An example of a SPARQL query we use:**

```
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX hg: <http://rdf.histograph.io/>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>
SELECT ?street ?name ?wkt WHERE {
  ?street a hg:Street .
  ?street rdfs:label ?name .
  ?street geo:hasGeometry/geo:asWKT ?wkt .
  FILTER (REGEX (?street, "Achter"))
}
```

This query fetches all the streets in Amsterdam that relate to the search term "Achter".

With SPARQL you use `PREFIX` to link to another data source. You select items from the database using `SELECT`, define the items you want to select with variables (`?name`). Selecting items from a database using SPARQL works using something called **triples**. You select an item using three variables. The first one is always the subject, the second and third one define the item and the relationship between the two.

### Our data flow
---

We fetch the pictures depending on the given begin and end timestamps we've gotten and the radius we get from the POST request from the page where we select the location and time period. This is the query we send to the API endpoint:

```
PREFIX dct: <http://purl.org/dc/terms/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX void: <http://rdfs.org/ns/void#>
PREFIX hg: <http://rdf.histograph.io/>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX sem: <http://semanticweb.cs.vu.nl/2009/11/sem/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX dc: <http://purl.org/dc/elements/1.1/>
SELECT ?title ?img ?start ?end ?street ?streetLabel WHERE {
  # basic data
  ?cho dc:title ?title .
  ?cho foaf:depiction ?img .

  # temporal filter
  ?cho sem:hasBeginTimeStamp ?orgStart .
  ?cho sem:hasEndTimeStamp ?orgEnd .
  BIND (xsd:date(str(?orgStart)) AS ?start)
  BIND (xsd:date(str(?orgEnd)) AS ?end)
  FILTER BOUND (?start)
  FILTER BOUND (?end)
  FILTER (?start >= xsd:date("${beginTimestamp}") && ?end <= xsd:date("${endTimestamp}") )

  # spatial filter
  ?cho dct:spatial ?street .
  ?street a hg:Street ;
  geo:hasGeometry/geo:asWKT ?streetWkt ;
  rdfs:label ?streetLabel .
  BIND (bif:st_geomfromtext("${wkt}") as ?x)
  BIND (bif:st_geomfromtext(?streetWkt) AS ?y)
  FILTER(bif:GeometryType(?y)!='POLYGON' && bif:st_intersects(?x, ?y))
}
ORDER BY ?start
```

From there the user is creating it's own Memories book, which means we have to continue with an unique id. We add the selected data to an object for this current book and add this to the user's session storage. In the following pages, until we reach the final book, the data is transferred between each state.

This is what our data object looks like:

```
book: {
  "id": Bk7K2MZG7,
  "key": "null",
  "title": "Mijn verhaal van Amsterdam",
  "meta": {},
  "data": {
    "1940": {
      "de buurt": [img, img],
      "de overige straten": [img, img]
    },
    "1941": {
      "Sint Agnietenstraat": [img],
      "de buurt": [img, img],
      "de overige straten": [img, img]
    }
  },
  "selection": {
    "1940": {
      "de buurt": [img]
    }
  }
}
```

The `selection` object are all the images the user selects. They are filtered from the original `data` object.


## Coming soon...

* [ ] Delete fake years (for example 4712)
* [ ] When you are on the memories page, you are able to go back and add some more images (or delete)
* [ ] Loader icons will give the user more feedback what is going on
* [ ] You can change the radius on Android Chrome as well
* [ ] Lazy load will be added for loading the images
* [ ] The street you have searched for will be your new centerpoint
* [ ] You can save a story and this will added in the (MonogoDB)

## Wishlist

* **Photosuggestion:** on your memoriesbook page you will find photo’s that are similar to yours. The user will be finding new image because of this new feature.
* Enhancement design frontpage
* **New chapters (queries):**
  * school/uni/work
  * posters politic
  * posters music
  * public transport
  * moving out
* Adding a web worker
* Changing the leaflet map to a better version

## Collaborators
[Max de Vries](https://github.com/vriesm060) and [Suus ten Voorde](https://github.com/s44s) are the collaborators of this project.

If you want to know more about our process and testresults, check [this link](https://docs.google.com/document/d/13ffiy7-qafjm6pxHgUFO63iCZuLWXJ1KEM_uCn8LiBM/edit).
