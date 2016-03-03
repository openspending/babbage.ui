import 'isomorphic-fetch'
import _ from 'lodash'
import Promise from 'bluebird'
import querystring from 'querystring'
import url from 'url'

export class Api {
  constructor() {
    this.cache = {};
  }

  get(url) {
    var that = this;
    if (this.cache[url]) {
      return Promise.resolve(this.cache[url]);
    } else {
      return fetch(url).then(function(response) {
        return response.text()
      }).then(function(text) {
        return that.cache[url] = text
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
    api = `${api}/cubes/${cube}/${path}`;
    var urlObj = url.parse(api);

    if (urlObj.query) {
      params = _.assign(querystring.parse(urlObj.jquery), params);
    }
    _.each(params, (value, key) => {
      if (_.isArray(value)) {
        params[key] = value.join('|');
      }
    });

    urlObj.search = querystring.stringify(params);

    return url.format(urlObj);
  }

  getDimensionMembers(endpoint, cube, dimension) {
    return this.getJson(
      this.buildUrl(endpoint, cube, 'members/' + dimension)
    );
  }

  getPackageModel(endpoint, cube) {
    return this.getJson(
      this.buildUrl(endpoint, cube, 'model')
    ).then((result) => {
      return result.model;
    });
  }

  getDisplayField(model, field) {
    var result = field;
    var dimension = _.find(model.dimensions, {label: field});

    if (dimension) {
      result = `${dimension.hierarchy}.${dimension.label_attribute}`;
    }

    return result;
  }

  aggregate(endpoint, cube, params) {
    var that = this;
    params = params || {};
    params.page = params.page || 0;
    params.pagesize = params.pagesize || 30;
    if (params.aggregates) {
      params.sort = params.sort || `${params.aggregates}:desc`;
    }

    return this.getPackageModel(endpoint, cube).then((model) => {
      if (params.group) {
        var displayField = that.getDisplayField(model, _.first(params.group));

        var keyField = _.first(params.group);
        if (params.group.indexOf(displayField) == -1) {
          params.group.push(displayField);
        }
      }

      var aggregateUrl = that.buildUrl(endpoint, cube, 'aggregate', params);

      return that.getJson(aggregateUrl).then((data) => {

        var result = {};
        var valueField = _.first(data.aggregates);
        var nameField = displayField;

        if (!params.group) {
          keyField = valueField;
          nameField = valueField;
        }
        result.summary = data.summary[valueField];
        result.count = data.total_cell_count;
        result.cells = [];

        _.each(data.cells, (cell => {
          result.cells.push({
              key: cell[keyField],
              name: cell[nameField],
              value: cell[valueField]
            }
          );
        }));
        return result;
      });
    });

  }
}

export default Api
