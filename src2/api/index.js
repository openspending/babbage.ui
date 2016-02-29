import 'isomorphic-fetch'
import _ from 'underscore'
import Promise from 'bluebird'
import querystring from 'querystring'
import url from 'url'

class Api {
  var cache = {};

  get(url) {
    if (this.cache[url]) {
      return Promise.resolve(this.cache[url]);
    } else {
      return fetch(url).then(function(response) {
        return response.text()
      }).then(function(text) {
        return this.cache[url] = text
      });
    }
  }

  getJson(url) {
    return this.get(url).then(JSON.parse)
  }

  flush() {
    this.cache = {}
  }

  buildUrl(endpoint, cube, path, params) {
    params = params || {};
    var api = endpoint;
    api = endpoint[api.length - 1] == '/' ? api.slice(0, api.length - 1) : api;
    api = api + '/cubes/' + cube + '/' + path;
    var urlObj = url.parse(api);

    if (urlObj.query) {
      params = _.extend(querystring.parse(urlObj.jquery), params);
      urlObj.query = querystring.stringify(params);
    }

    return url.format(urlObj);
  }

  getDimensionMembers(endpoint, cube, dimension) {
    return this.getJson(
      this.buildUrl(endpoint, cube, 'members/' + dimension)
    );
  }


  aggregate(endpoint, cube, params) {
    var promise = this.getJson(
      this.buildUrl(endpoint, cube, 'aggregate', params)
    );

    return promise.then(
      (response) => {
        var result = [];
        var valueField = _.first(response.aggregates);
        var keyField = _.first(response.attributes);
        var nameField = keyField;

        _.each(response.cells, (cell => {
          result.push({
              key: cell[keyField],
              name: cell[nameField],
              value: cell[valueField]
            }
          );
        }));
        return result;
      }
    );
  }
}

export default Api
