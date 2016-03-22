'use strict';

var Promise = require('bluebird');
require('isomorphic-fetch');

var cosmopolitanApiUrl = 'http://cosmopolitan.openspending.org/';

function loadGeoJson(countryCode) {
  // Uncomment when cosmopolitan API implemented
  //var url = cosmopolitanApiUrl + '/geojson/country/' +
  //  encodeURIComponent(countryCode) + '?format=json';

  var url = 'https://rawgit.com/openspending/fiscal-data-package-demos/' +
    'master/boost-moldova/data/boost-moldova.geojson';

  return fetch(url)
    .then(function(response) {
      if (response.status != 200) {
        throw 'Failed loading data from ' + response.url;
      }
      return response.text().then(JSON.parse);
    });
}

module.exports.loadGeoJson = loadGeoJson;
