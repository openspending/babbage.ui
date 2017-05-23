var assert = require('chai').assert;
var _ = require('lodash');

describe('Babbage.ui component utils', function() {
  var Utils = require('../src/components/utils.js');
  var data = require('./data/component-utils/data1');

  it('Should exists', function(done) {
    assert(_.isObject(Utils));
    done();
  });

  it('Should build `names`', function(done) {
    var result = Utils.buildC3Names(data);
    assert.deepEqual(result, {
      10: 'Some name1',
      20: 'Some name2',
      30: 'Some name3',
    });
    done();
  });

  it('Should build `columns`', function(done) {
    var result = Utils.buildC3Columns(data, 'id', undefined, 'measure1');
    assert.deepEqual(result, [ [ 'id', 'Some name1', 'Some name2', 'Some name3' ], [ 'measure1', 100, 300, 5 ] ]);
    done();
  });

  describe('defaultColorScale', () => {
    it('Should return a color scale', () => {
      assert.isFunction(Utils.defaultColorScale());
      assert.isString(Utils.defaultColorScale()(0));
    });
  });
});

