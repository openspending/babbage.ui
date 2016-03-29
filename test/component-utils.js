var assert = require('chai').assert;
var _ = require('lodash');

describe('Babbage.ui component utils', function() {
  var Utils = require('../lib/components/utils.js');
  var data = {
    summary: 405,
    count: 3,
    cells: [
      {
        "dimensions": [
          {
            keyField: 'id',
            nameField: 'name',
            keyValue: 10,
            nameValue: 'Some name1'
          }
        ],
        "measures":[
          {
            key: 'measure1',
            value: 100
          }
        ]
      },

      {
        "dimensions": [
          {
            keyField: 'id',
            nameField: 'name',
            keyValue: 20,
            nameValue: 'Some name2'
          }
        ],
        "measures":[
          {
            key: 'measure1',
            value: 300
          }
        ]
      },

      {
        "dimensions": [
          {
            keyField: 'id',
            nameField: 'name',
            keyValue: 30,
            nameValue: 'Some name3'
          }
        ],
        "measures":[
          {
            key: 'measure1',
            value: 5
          }
        ]
      }
    ]
  };

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
    var result = Utils.buildC3Columns(data, 'measure1');
    assert.deepEqual(result, [
      [10, 100],
      [20, 300],
      [30, 5]
    ]);
    done();
  });

  it('Should build `colors`', function(done) {
    var result = Utils.buildC3Colors(data);
    assert.deepEqual(result, [
      [10, '#CF3D1E'],
      [20, '#F15623'],
      [30, '#F68B1F']
    ]);
    done();
  });


});

