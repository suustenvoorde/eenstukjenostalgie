const status = {
  pageNotFound: {
    title: "pagina niet gevonden.",
    msg: "De opgevraagde pagina bestaat niet of kan niet gevonden worden. Probeer het met een andere url of ga naar de homepage.",
    button: {
      src: "/",
      value: "Naar homepage"
    }
  },
  incorrectTimestamp: {
    title: "verkeerd beginjaar.",
    msg: "Het ingevoerde beginjaar is groter dan het eindjaar. Voer een eindjaar in dat na het beginjaar komt.",
    button: {
      src: "/",
      value: "Probeer het opnieuw"
    }
  },
  noPhotosFound: {
    title: "geen foto's gevonden.",
    msg: "Van de ingevoerde locatie en tijd hebben we helaas geen foto's. Probeer een andere locatie of neem een ander begin -of eindjaar.",
    button: {
      src: "/",
      value: "Probeer het opnieuw"
    }
  },
  noPhotosToDB: {
    title: "foto's niet opgeslagen.",
    msg: "De opgevraagde foto's kunnen niet in de database worden opgeslagen. Mogelijk is er een probleem met de server. Probeer het later nog eens.",
    button: {
      src: "/",
      value: "Naar homepage"
    }
  },
  noPhotosFromDB: {
    title: "geen foto's gevonden.",
    msg: "De opgevraagde foto's kunnen niet uit de database worden gehaald. Mogelijk is er een probleem met de server. Probeer het later nog eens.",
    button: {
      src: "/",
      value: "Naar homepage"
    }
  },
  noPhotoFromDB: {
    title: "foto niet gevonden.",
    msg: "De foto die gedeeld is kan niet worden gevonden. Mogelijk is de link niet correct ingevoerd. Controleer de gekregen link nogmaals goed en probeer het dan opnieuw.",
  },
  noApiConnection: {
    title: "geen foto's gevonden.",
    msg: "Er kunnen geen foto's worden opgehaald vanuit de databron die voor ons de foto's verzorgen. Mogelijk is er een probleem met hun server. Probeer het later nog eens.",
    button: {
      src: "/",
      value: "Naar homepage"
    }
  }
};

module.exports = status;
