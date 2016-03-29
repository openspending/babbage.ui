var nock = require('nock');
var assert = require('chai').assert;
var _ = require('lodash');

describe('Babbage.ui pivot table component', function() {
  var pivotComponent = new (require('../lib/components/pivottable').PivotTableComponent)();
  var aggregate2 = require('./data/component-pivot/aggregate2.json');
  var expectedData = require('./data/component-pivot/expected/data.json');
  var test2PackageModel = require('./data/component-table/package2Model.json');

  before(function(done) {
    nock('http://site.com/')
      .persist()
      .get('/cubes/test2/aggregate?' +
        'drilldown=administrative_classification_admin1.admin1%7C' +
        'other_exp_type.exp_type&' +
        'pagesize=2000&order=adjusted.sum%3Adesc')
      .reply(200, aggregate2, {'access-control-allow-origin': '*'});

    nock('http://site.com/')
      .persist()
      .get('/cubes/test2/model')
      .reply(200, test2PackageModel, {'access-control-allow-origin': '*'});
    done();
  });

  it('Should exists', function(done) {
    assert(_.isObject(pivotComponent));
    done();
  });

  it('Should build pivot table data', function(done) {
    var params = {
      cols: ['administrative_classification_admin1.admin1'],
      rows: ['other_exp_type.exp_type'],
      aggregates: 'adjusted.sum'
    }
    pivotComponent.getPivotData('http://site.com/', 'test2', params).then(function(data){
      assert.deepEqual(expectedData, data);
      done();
    }).catch(function(e){console.log(e);});
  });
});

