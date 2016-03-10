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
    return this.get(url).then(JSON.parse);
  }

  flush() {
    this.cache = {}
  }

  transformParams(params) {
    var result = {};
    result.drilldown = params.group;
    result.aggregates = params.aggregates;
    result.pagesize = params.pagesize;
    result.cut = params.filter;
    result.page = params.page;
    result.order = params.order;

    return _.pickBy(result);
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

    urlObj.search = querystring.stringify(this.transformParams(params));

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
    var dimension = _.find(model.dimensions, {key_ref: field});

    if (dimension) {
//      result = `${dimension.hierarchy}.${dimension.label_attribute}`;
      result = dimension.label_ref;
    }

    return result;
  }

  getMeasuresFromModel(model) {
    var result = [];
    _.each(model.aggregates, function(value, key) {
      if (value.measure) {
        result.push({
          key: key,
          value: value.label
        });
      }
    });
    return result;
  }

  getMeasures(endpoint, cube) {
    var that = this;
    return this.getPackageModel(endpoint, cube)
      .then((model) => {
        return that.getMeasuresFromModel(model);
      });
  }

  getDimensionKeyById(model, id) {
    return model.dimensions[id].key_ref;
  }

  getDrillDownDimensionKey(model, dimensionId) {
    var result = undefined;
    var dimension = model.dimensions[dimensionId];
    var hierarchy = model.hierarchies[dimension.hierarchy];
    if (hierarchy) {
      var dimensionLevel = hierarchy.levels.indexOf(dimensionId);
      if (dimensionLevel > -1) {
        var drillDownDimensionId = hierarchy.levels[dimensionLevel + 1];
        if (drillDownDimensionId) {
          result = this.getDimensionKeyById(model, drillDownDimensionId);
        }
      }
    }
    return result;
  }

  getDimensionsFromModel(model) {
    var that = this;
    var result = [];
    _.each(model.dimensions, function(value, id) {

      // jscs:disable
      var keyAttribute = value.key_attribute;
      var labelAttribute = value.label_attribute;
      // jscs:enable

      result.push({
        id: id,
        key: that.getDimensionKeyById(model, id),
        code: value.label,
        hierarchy: value.hierarchy,
        name: value.attributes[keyAttribute].column,
        label: value.hierarchy + '.' + labelAttribute,
        drillDown: that.getDrillDownDimensionKey(model, id)
      });
    });

    return _.sortBy(result, function(value) {
      return value.key;
    });
  }

  aggregate(endpoint, cube, params) {
    var that = this;
    params = params || {};
    params.page = params.page || 0;
    params.pagesize = params.pagesize || 30;
    if (params.aggregates) {
      params.order = params.order || `${params.aggregates}:desc`;
    }
    var keyField = '';
    var displayField = '';

    return this.getPackageModel(endpoint, cube)
      .then((model) => {
        if (params.group) {
          displayField = that.getDisplayField(model, _.first(params.group));

          keyField = _.first(params.group);
          if (params.group.indexOf(displayField) == -1) {
            params.group.push(displayField);
          }
        }

        var aggregateUrl = that.buildUrl(endpoint, cube, 'aggregate', params);
        return that.getJson(aggregateUrl);
      })
      .then((data) => {
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

  }
}

export default Api
