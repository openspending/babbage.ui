'use strict';

var Promise = require('bluebird');
require('isomorphic-fetch');

function loadGeoJson(cosmopolitanApiUrl, countryCode) {
  var url = cosmopolitanApiUrl + 'polygons/country:' +
    encodeURIComponent(countryCode) + '?format=json';

  return fetch(url)
    .then(function(response) {
      if (response.status != 200) {
        throw 'Failed loading data from ' + response.url;
      }
      return response.text().then(JSON.parse).then((jsonData) => {
        return jsonData.polygon;
      });
    });
}

module.exports.loadGeoJson = loadGeoJson;
