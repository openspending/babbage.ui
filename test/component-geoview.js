'use strict';

var assert = require('chai').assert;
var testUtils = require('./utils');

describe('UI Components', function() {

  describe('GeoView', function() {

    var utils = require('../lib/components/geoview/utils');
    var moldova = require('./data/component-geoview/moldova.json');

    it('Should create ordinal color scale as singletone', function(done) {
      var scale1 = utils.getOrdinalColorScale();
      var scale2 = utils.getOrdinalColorScale();

      assert.isFunction(scale1);
      assert.isFunction(scale2);
      assert.equal(scale1, scale2);

      done();
    });

    it('Should create linear color scales', function(done) {
      var scale1 = utils.getLinearColorScale('#f00');
      var scale2 = utils.getLinearColorScale('#f00');
      var scale3 = utils.getLinearColorScale('#0ff');

      assert.isFunction(scale1);
      assert.isFunction(scale2);
      assert.isFunction(scale3);

      assert.notEqual(scale1, scale2);
      assert.notEqual(scale1, scale3);
      assert.notEqual(scale2, scale3);

      done();
    });

    it('Should create path', function(done) {
      var geoObject = testUtils.deepClone(moldova);
      var path = utils.createPath({
        geoObject: geoObject
      });

      assert.isFunction(path);
      done();
    });

    it('Should calculate object dimensions, scale and values', function(done) {
      // Dimensions
      var geoObject = testUtils.deepClone(moldova);
      var path = utils.createPath({
        geoObject: geoObject
      });

      utils.updateDimensions(geoObject, {
        path: path
      });

      assert.property(geoObject, 'dimensions');
      assert.property(geoObject, 'center');
      assert.property(geoObject, 'unscaledBounds');

      // Scales
      utils.updateScales(geoObject, {
        width: 100,
        height: 100
      });

      assert.property(geoObject, 'scale');

      // Values & colors
      var colorScale = utils.getLinearColorScale('#f00');

      utils.updateValues(geoObject, {
        color: colorScale,
        data: {}
      });

      assert.isArray(geoObject.features);
      assert.property(geoObject.features[0], 'value');
      assert.property(geoObject.features[0], 'color');

      done();
    });

    it('Should calculate prepare object for rendering', function(done) {
      var geoObject = testUtils.deepClone(moldova);
      var path = utils.createPath({
        geoObject: geoObject
      });
      var colorScale = utils.getLinearColorScale('#f00');

      utils.prepareGeoJson(geoObject, {
        path: path,
        width: 100,
        height: 100,
        color: colorScale,
        data: {}
      });

      assert.property(geoObject, 'dimensions');
      assert.property(geoObject, 'center');
      assert.property(geoObject, 'unscaledBounds');
      assert.property(geoObject, 'scale');
      assert.isArray(geoObject.features);
      assert.property(geoObject.features[0], 'value');
      assert.property(geoObject.features[0], 'color');

      done();
    });

  });

});
