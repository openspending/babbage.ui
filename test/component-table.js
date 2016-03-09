var nock = require('nock');
var assert = require('chai').assert;
var _ = require('lodash');

describe('Babbage.ui table component', function() {
  var tableComponent = new (require('../lib/components/table').TableComponent)();
  var aggregate2 = require('./data/component-table/aggregate2.json');
  var test2PackageModel = require('./data/component-table/package2Model.json');

  before(function(done) {
    nock('http://site.com/')
      .persist()
      .get('/cubes/test2/aggregate?' +
        'drilldown=administrative_classification_admin3_code.admin3_code%7' +
        'Cadministrative_classification_admin3_code.admin3_label&' +
        'aggregates=approved.sum&' +
        'pagesize=30&' +
        'order=approved.sum%3Adesc')
      .reply(200, aggregate2, {'access-control-allow-origin': '*'});

    nock('http://site.com/')
      .persist()
      .get('/cubes/test2/model')
      .reply(200, test2PackageModel, {'access-control-allow-origin': '*'});

    done();
  });

  it('Should exists', function(done) {
    assert(_.isObject(tableComponent));
    done();
  });

  it('Should build headers of table', function(done) {
    var measures = [
      {key: 'executed.sum', value: 'executed'},
      {key: 'adjusted.sum', value: 'adjusted'},
      {key: 'approved.sum', value: 'approved'}
    ];

    var headers = tableComponent.getHeaders(measures, {aggregates: 'approved.sum'});
    assert.deepEqual(headers, [['', 'approved']]);
    done();
  });

  it('Should return false `showKeys`', function(done) {
    var result = tableComponent.showKeys([
      {
        key: 1,
        name: 1,
        value: 100
      },
      {
        key: 2,
        name: 2,
        value: 200
      },
      {
        key: 3,
        name: 3,
        value: 300
      },
    ]);
    assert.equal(result, false);
    done();
  });

  it('Should return true `showKeys`', function(done) {
    var result = tableComponent.showKeys([
      {
        key: 1,
        name: 'someName1',
        value: 100
      },
      {
        key: 2,
        name: 'someName2',
        value: 200
      },
      {
        key: 3,
        name: 'someName3',
        value: 300
      },
    ]);
    assert.equal(result, true);
    done();
  });


  it('Should build table data', function(done) {
    tableComponent.getTableData('http://site.com/', 'test2',
      {
        aggregates: 'approved.sum',
        group: ['administrative_classification_admin3_code.admin3_code']
      }
    ).then(
      function (tableData) {
        var expected = {
          headers: [ ['', 'approved'] ],
          columns: [
            ['289:National Social Insurance Company', 100],
            ['322:National Health Insurance Company', 200],
            ['200:General actions', 50]
          ]
        };
        assert.deepEqual(tableData, expected);
        done();
      }
    ).catch(function(e){console.log(e)});
  });
});

