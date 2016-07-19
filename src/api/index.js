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
        if (response.status >= 400) {
          return Promise.reject(new Error(`
            code: ${response.status},
            message: ${response.statusText}
          `));
        } else {
          return response.text()
        }
      }).then(function(text) {
        return that.cache[url] = text
      }).catch(Promise.reject);
    }
  }

  getJson(url) {
    return this.get(url).then(JSON.parse).catch(function(err) { console.error("getJson:", err)});
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

  buildUrl(endpoint, cube, path, originParams) {
    var params = _.cloneDeep(originParams) || {};
    var api = endpoint;
    api = endpoint[api.length - 1] == '/' ? api.slice(0, api.length - 1) : api;
    api = `${api}/cubes/${cube}/${path}`;
    var urlObj = url.parse(api);

    if (urlObj.query) {
      params = _.assign(querystring.parse(urlObj.jquery), params);
    }
    _.each(params, (value, key) => {
      if (_.isArray(value)) {
        if (key == 'order') {
          params[key] = _.map(value, (item) => {
            return item.key+':'+item.direction
          }).join(',');
        } else {
          params[key] = value.join('|');
        }
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

  getDimensions(endpoint, cube) {
    var that = this;
    return this.getPackageModel(endpoint, cube)
      .then((model) => {
        return that.getDimensionsFromModel(model);
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

  getSimpleLabel(key) {
    var parts = key.split('.');
    return (parts.length == 2) ? parts[1] : key;
  }

  facts(endpoint, cube, originParams) {
    var that = this;
    var params = _.cloneDeep(originParams) || {};
    var measureFields = [];
    params.page = params.page || 0;
    params.pagesize = params.pagesize || 20;
    var model;

    return this.getPackageModel(endpoint, cube).then((_model) => {
      model = _model;
      var dimensions = that.getDimensionsFromModel(model);
      var measures = that.getMeasuresFromModel(model);
      if (!originParams.fields){
        originParams.fields = [];
        _.each(dimensions, (dimension) => {
          originParams.fields.push(dimension.key);
        });
        _.each(measures, (measure) => {
          originParams.fields.push(measure.value);
        });
      }
      _.each(model.measures, (measure, key) => {
        measureFields.push(key);
      });

      var factsUrl = that.buildUrl(endpoint, cube, 'facts', params);
      return that.getJson(factsUrl);
    }).then((facts) => {
      var result = {};
      result.headers = [];
      result.columns = [];
      result.info = {};
      result.info.total = facts.total_fact_count;
      result.info.pageSize = facts.page_size;
      result.info.page = facts.page;
      _.each(facts.fields, (field) => {
        var fieldParts = field.split('.');
        var conceptKey = fieldParts[0];
        var attribute = fieldParts[1];
        var concept = model.dimensions[conceptKey] || model.measures[conceptKey];
        if ( attribute && concept.attributes ) {
          concept = concept.attributes[attribute];
        }

        result.headers.push({
          key: field,
          label: concept.label,
          numeric: (measureFields.indexOf(field) > -1)
        });
      });

      _.each(facts.data, (raw) => {
        var column = [];
        _.each(result.headers, (header) => {
          column.push(raw[header.key]);
        });
        result.columns.push(column);
      });
      return result;
    })
  }

  aggregate(endpoint, cube, originParams) {
    var that = this;
    var params = _.cloneDeep(originParams) || {};

    params.page = params.page || 0;
    params.pagesize = params.pagesize || 30;
    var dimensions = [];
    var measures = [];
    var measureModelList;

    return this.getPackageModel(endpoint, cube).then((model) => {
        measures = that.getMeasuresFromModel(model);
        measureModelList = _.values(model.measures);

        if (!params.aggregates) {
          params.aggregates = _.first(measures).key;
        }
        params.order = params.order || [{key: params.aggregates, direction: 'desc'}];
        params.aggregates = undefined; //remove it

        var newExtendedGroup = [];
        _.each(params.group, (dimensionKey) => {
          newExtendedGroup.push(dimensionKey);
          var dimensionDisplay = that.getDisplayField(model, dimensionKey);

          dimensions.push({
            key: dimensionKey,
            name: dimensionDisplay
          });

          if (newExtendedGroup.indexOf(dimensionDisplay) == -1) {
            newExtendedGroup.push(dimensionDisplay);
          }
        });
        params.group = newExtendedGroup;

        var aggregateUrl = that.buildUrl(endpoint, cube, 'aggregate', params);

        return that.getJson(aggregateUrl);
      })
      .then((data) => {

        var result = {
          currency: {},
          summary: {},
          count: data.total_cell_count,
          cells: []
        };

        _.each(measures, (measure) => {
          let measureModel = _.find(measureModelList, {'label': measure.value});
          result.summary[measure.key] = data.summary[measure.key];
          result.currency[measure.key] = measureModel["currency"];
        });

        _.each(data.cells, (cell) => {
          var dimensionsResult = [];
          var measuresResult = [];

          _.each(dimensions, (dimension) => {
            dimensionsResult.push({
              keyField: dimension.key,
              nameField: dimension.name,
              keyValue: cell[dimension.key],
              nameValue: cell[dimension.name]
            });
          });

          _.each(measures, (measure) => {
            measuresResult.push({
              key: measure.key,
              name: measure.value,
              value: cell[measure.key]
            });
          });

          result.cells.push({
            dimensions: dimensionsResult,
            measures: measuresResult
          });
        });
        return result;
      });
  }

  loadGeoJson(cosmopolitanApiUrl, countryCode) {
    var url = cosmopolitanApiUrl + 'polygons/country:' +
      encodeURIComponent(countryCode) + '?format=json';

    return this.getJson(url).then((jsonData) => {
      return jsonData.polygon;
    });
  }
}

export default Api
