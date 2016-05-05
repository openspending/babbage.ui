var nock = require('nock');
var assert = require('chai').assert;
var _ = require('lodash');

describe('Babbage.ui table component', function() {
  var tableComponent = new (require('../lib/components/table').TableComponent)();
  var aggregate2 = require('./data/component-table/aggregate2.json');
  var test2PackageModel = require('./data/component-table/package2Model.json');
  var expectedAggregate2 = require('./data/component-table/expected/aggregate2.json');
  var expectedTable = require('./data/component-table/expected/table.json');

  before(function(done) {
    nock('http://site.com/')
      .persist()
      .get('/cubes/test2/aggregate?' +
        'drilldown=administrative_classification_admin3_code.admin3_code%7' +
        'Cadministrative_classification_admin3_code.admin3_label&' +
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
      {key: 'executed.sum', value: 'executed' },
      {key: 'adjusted.sum', value: 'adjusted'},
      {key: 'approved.sum', value: 'approved'}
    ];

    var dimensions = [
      {
        key: "administrative_classification_admin3_code.admin3_code",
        name: "admin3_code"
      }
    ];
    var headers = tableComponent.getHeaders(dimensions, measures, expectedAggregate2.cells);

    assert.deepEqual(headers, [ [ 'admin3_code', 'executed', 'adjusted', 'approved' ] ]);
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
        assert.deepEqual(tableData, expectedTable);
        done();
      }
    ).catch(function(e){console.log(e)});
  });
});

