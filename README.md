# google-maps-clojure-demo

This is a demo project demonstrating use of the Google Maps API being served through a Clojure(Compojure/Ring) backend.

## Prerequisites

You will need [Leiningen][] 2.0.0 or above installed.

[leiningen]: https://github.com/technomancy/leiningen

You will also need to update the API_KEY in index.html with your Google API key. This open source demo is not suggested for general use, as it will become expensive due to the number of Google Places API hits.

## Running

To start a web server for the application, run:

    lein ring server

inside of src/clojure-backend/

## License

GNU General Public License version 3
