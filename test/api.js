var nock = require('nock');
var assert = require('chai').assert;
var _ = require('lodash');

describe('Babbage.ui API', function() {
  var api = new (require('../lib/api/').Api)();
  var aggregate1 = require('./data/api/aggregate1.json');
  var aggregate2 = require('./data/api/aggregate2.json');
  var expectedAggregate1 = require('./data/api/expected/aggregate1.json');
  var expectedAggregate2 = require('./data/api/expected/aggregate2.json');
  var expectedMultiAggregate2 = require('./data/api/expected/multyaggregate2.json');
  var testPackageModel = require('./data/api/package1Model.json');
  var test2PackageModel = require('./data/api/package2Model.json');
  var facts2 = require('./data/api/facts2.json');
  var expectedFacts2 = require('./data/api/expected/facts2.json');

  before(function(done) {
    nock('http://site.com/')
      .persist()
      .get('/some.page')
      .reply(200, 'test string', {'access-control-allow-origin': '*'});

    nock('http://site.com/')
      .persist()
      .get('/some.page2')
      .reply(200, 'test string2', {'access-control-allow-origin': '*'});

    nock('http://site.com/')
      .persist()
      .get('/some.json')
      .reply(200,
        {
          key: 'someKey',
          name: 'someName'
        },
        {'access-control-allow-origin': '*'}
      );

    nock('http://site.com/')
      .persist()
      .get('/cubes/test/aggregate?' +
        'drilldown=administrative_classification.admin1&' +
        'pagesize=30')
      .reply(200, aggregate1, {'access-control-allow-origin': '*'});

    nock('http://site.com/')
      .persist()
      .get('/cubes/test/aggregate?' +
        'drilldown=administrative_classification.admin1&' +
        'pagesize=30&order=amount.sum%3Adesc')
      .reply(200, aggregate1, {'access-control-allow-origin': '*'});

    nock('http://site.com/')
      .persist()
      .get('/cubes/test2/aggregate?' +
        'drilldown=administrative_classification_admin3_code.admin3_code%7C' +
        'administrative_classification_admin3_code.admin3_label&' +
        'pagesize=30')
      .reply(200, aggregate2, {'access-control-allow-origin': '*'});

    nock('http://site.com/')
      .persist()
      .get('/cubes/test2/aggregate?' +
        'drilldown=administrative_classification_admin2_code.admin2_code%7C' +
        'administrative_classification_admin2_code.admin2_label%7C' +
        'administrative_classification_admin3_code.admin3_code%7C' +
        'administrative_classification_admin3_code.admin3_label&' +
        'pagesize=30&order=executed.sum%3Adesc')
      .reply(200, aggregate2, {'access-control-allow-origin': '*'});

    nock('http://site.com/')
      .persist()
      .get('/cubes/test2/aggregate?' +
        'drilldown=administrative_classification_admin3_code.admin3_code%7C' +
        'administrative_classification_admin3_code.admin3_label&' +
        'pagesize=30&order=executed.sum%3Adesc')
      .reply(200, aggregate2, {'access-control-allow-origin': '*'});

    nock('http://site.com/')
      .persist()
      .get('/cubes/test/model')
      .reply(200, testPackageModel, {'access-control-allow-origin': '*'});

    nock('http://site.com/')
      .persist()
      .get('/cubes/test2/model')
      .reply(200, test2PackageModel, {'access-control-allow-origin': '*'});

    nock('http://site.com/')
      .persist()
      .get('/cubes/test2/facts?pagesize=20')
      .reply(200, facts2, {'access-control-allow-origin': '*'});


    done();
  });

  it('Should exists', function(done) {
    assert.isObject(api);
    assert.isFunction(api.get);
    assert.isFunction(api.getJson);
    assert.isFunction(api.flush);
    assert.isFunction(api.buildUrl);
    assert.isFunction(api.getDimensionMembers);
    assert.isFunction(api.aggregate);
    done();
  });

  it('Should download a page', function(done) {
    api.get('http://site.com/some.page').then(function(text) {
      assert.equal(text, 'test string');
      done();
    });
  });

  it('Should cache a page', function(done) {
    api.get('http://site.com/some.page').then(function(text) {
      assert.equal(text, 'test string');

      nock('http://site.com/')
        .persist()
        .get('/some.page')
        .reply(200, 'other test string', {'access-control-allow-origin': '*'});

      api.get('http://site.com/some.page').then(function(text) {
        assert.equal(text, 'test string');
        done();
      });
    });
  });

  it('Should download different pages', function(done) {
    api.get('http://site.com/some.page').then(function(text) {
      assert.equal(text, 'test string');

      api.get('http://site.com/some.page2').then(function(text) {
        assert.equal(text, 'test string2');
        done();
      });
    });
  });

  it('Should download a json file', function(done) {
    api.getJson('http://site.com/some.json').then(function(json) {
      assert.deepEqual(json, {
        key: 'someKey',
        name: 'someName'
      });
      done();
    });
  });

  it('Should build URL', function(done) {
    var url = api.buildUrl('http://api.com', 'test', 'aggregate');
    assert.equal(url, 'http://api.com/cubes/test/aggregate');

    var url = api.buildUrl('http://api.com/', 'test', 'aggregate');
    assert.equal(url, 'http://api.com/cubes/test/aggregate');
    done();
  });

  it('Should build URL with params', function(done) {
    var url = api.buildUrl('http://api.com', 'test', 'aggregate', {
      filter: 'filter',
      group: 'group'
    });
    assert.equal(
      url,
      'http://api.com/cubes/test/aggregate?drilldown=group&cut=filter'
    );

    done();
  });

  it('Should return Package Model', function(done) {
    api.getPackageModel('http://site.com/', 'test').then(function(model) {
      assert.deepEqual(model, testPackageModel.model);
      done();
    });
  });

  it('Should return `Display field`', function(done) {
    api.getPackageModel('http://site.com/', 'test').then(function(model) {
      var displayField = api.getDisplayField(model, 'to');
      assert.equal(displayField, 'to');
      done();
    });
  });

  it('Should return `Display field` for field with `label-for`', function(done) {
    api.getPackageModel('http://site.com/', 'test2').then(function(model) {
      var displayField = api.getDisplayField(model, 'administrative_classification_admin3_code.admin3_code');
      assert.equal(displayField, 'administrative_classification_admin3_code.admin3_label');
      done();
    });
  });

  it('Should return `Measures` by model', function(done) {
    api.getPackageModel('http://site.com/', 'test2').then(function(model) {
      var measures = api.getMeasuresFromModel(model);
      assert.deepEqual(measures, [
        {key: 'executed.sum', value: 'Executed'},
        {key: 'adjusted.sum', value: 'Adjusted'},
        {key: 'approved.sum', value: 'Approved'}
      ]);
      done();
    });
  });

  it('Should return `Measures` by endpoint and cube', function(done) {
    api.getMeasures('http://site.com/', 'test2').then(function(measures) {
      assert.deepEqual(measures, [
        {key: 'executed.sum', value: 'Executed'},
        {key: 'adjusted.sum', value: 'Adjusted'},
        {key: 'approved.sum', value: 'Approved'}
      ]);
      done();
    });
  });

  it('Should return dimension key by id', function(done) {
    api.getPackageModel('http://site.com/', 'test').then(function(model) {
      var dimensionKey = api.getDimensionKeyById(model, 'from');
      assert.equal(dimensionKey, 'from.name');

      var dimensionKey = api.getDimensionKeyById(model, 'time_day');
      assert.equal(dimensionKey, 'time_day.day');

      done();
    });
  });

  it('Should return undefined  for dimension when model doesn\'t ' +
    'have hierarchy for that dimension', function(done) {
    api.getPackageModel('http://site.com/', 'test').then(function(model) {
      var dimensionKey = api.getDrillDownDimensionKey(model, 'from');
      assert(_.isUndefined(dimensionKey));
      done();
    });
  });

  it('Should return DrillDown Dimension Key for dimension', function(done) {
    api.getPackageModel('http://site.com/', 'test2').then(function(model) {
      var dimensionKey = api.getDrillDownDimensionKey(
        model,
        'administrative_classification_admin1'
      );
      assert.equal(dimensionKey, 'administrative_classification_admin2_code.admin2_code');
      done();
    });
  });

  it('Should return dimensions from model', function(done) {
    api.getPackageModel('http://site.com/', 'test').then(function(model) {
      var dimensions = api.getDimensionsFromModel(model);
      assert.isArray(dimensions);
      assert.deepEqual(dimensions, [
        {
          id: 'from',
          key: 'from.name',
          code: 'From',
          hierarchy: 'from',
          name: 'from_name',
          label: 'from.name',
          drillDown: undefined
        },
        {
          id: 'time_day',
          key: 'time_day.day',
          code: 'Time-Day',
          hierarchy: 'time',
          name: 'time_day',
          label: 'time.day',
          drillDown: undefined
        },
        {
          id: 'time_month',
          key: 'time_month.month',
          code: 'Time-Month',
          hierarchy: 'time',
          name: 'time_month',
          label: 'time.month',
          drillDown: 'time_day.day'
        },
        {
          id: 'time_year',
          key: 'time_year.year',
          code: 'Time-Year',
          hierarchy: 'time',
          name: 'time_year',
          label: 'time.year',
          drillDown: 'time_month.month'
        },
        {
          id: 'to',
          key: 'to.name',
          code: 'To',
          hierarchy: 'to',
          name: 'to_name',
          label: 'to.name',
          drillDown: undefined
        }]
      );
      done();
    });
  });

  it('Should return correct dimensions from model', function(done) {
    api.getPackageModel('http://site.com/', 'test2').then(function(model) {
      var dimensions = api.getDimensionsFromModel(model);
      assert.isArray(dimensions);

      assert.deepEqual(dimensions, [
        { id: 'administrative_classification_admin1',
          key: 'administrative_classification_admin1.admin1',
          code: 'Administrative_classification-Admin1',
          hierarchy: 'administrative_classification',
          name: 'admin1',
          label: 'administrative_classification.admin1',
          drillDown: 'administrative_classification_admin2_code.admin2_code' },
        { id: 'administrative_classification_admin2_code',
          key: 'administrative_classification_admin2_code.admin2_code',
          code: 'Administrative_classification-Admin2_code',
          hierarchy: 'administrative_classification',
          name: 'admin2_code',
          label: 'administrative_classification.admin2_label',
          drillDown: 'administrative_classification_admin3_code.admin3_code' },
        { id: 'administrative_classification_admin3_code',
          key: 'administrative_classification_admin3_code.admin3_code',
          code: 'Administrative_classification-Admin3_code',
          hierarchy: 'administrative_classification',
          name: 'admin3_code',
          label: 'administrative_classification.admin3_label',
          drillDown: undefined },
        { id: 'location',
          key: 'location.title',
          code: 'Location',
          hierarchy: 'location',
          name: 'admin2_label',
          label: 'location.title',
          drillDown: undefined },
        { id: 'other_exp_type',
          key: 'other_exp_type.exp_type',
          code: 'Other-Exp_type',
          hierarchy: 'other',
          name: 'exp_type',
          label: 'other.exp_type',
          drillDown: 'other_transfer.transfer' },
        { id: 'other_fin_source',
          key: 'other_fin_source.fin_source',
          code: 'Other-Fin_source',
          hierarchy: 'other',
          name: 'fin_source',
          label: 'other.fin_source',
          drillDown: 'other_exp_type.exp_type' },
        { id: 'other_transfer',
          key: 'other_transfer.transfer',
          code: 'Other-Transfer',
          hierarchy: 'other',
          name: 'transfer',
          label: 'other.transfer',
          drillDown: undefined }
      ]);
      done();
    });
  });

  it('Should return dimenions by URL', function(done) {
    api.getDimensions('http://site.com/', 'test').then(function(dimensions) {
      var expected = [
        {
          id: 'from',
          key: 'from.name',
          code: 'From',
          hierarchy: 'from',
          name: 'from_name',
          label: 'from.name',
          drillDown: undefined
        },
        {
          id: 'time_day',
          key: 'time_day.day',
          code: 'Time-Day',
          hierarchy: 'time',
          name: 'time_day',
          label: 'time.day',
          drillDown: undefined
        },
        {
          id: 'time_month',
          key: 'time_month.month',
          code: 'Time-Month',
          hierarchy: 'time',
          name: 'time_month',
          label: 'time.month',
          drillDown: 'time_day.day'
        },
        {
          id: 'time_year',
          key: 'time_year.year',
          code: 'Time-Year',
          hierarchy: 'time',
          name: 'time_year',
          label: 'time.year',
          drillDown: 'time_month.month'
        },
        {
          id: 'to',
          key: 'to.name',
          code: 'To',
          hierarchy: 'to',
          name: 'to_name',
          label: 'to.name',
          drillDown: undefined
        }
      ];
      assert.deepEqual(dimensions, expected);
      done();
    });
  });

  it('Should return aggregate data', function(done) {
    api.aggregate('http://site.com/', 'test', {
      group: ['administrative_classification.admin1']
    }).then(function(data) {
      assert.deepEqual(data, expectedAggregate1);
      done();
    });
  });

  it('Should return aggregate data grouped by field with `label-for`', function(done) {
    api.aggregate('http://site.com/', 'test2', {
      group: ['administrative_classification_admin3_code.admin3_code']
    }).then(function(data) {
      assert.deepEqual(data, expectedAggregate2);
      done();
    });
  });

  it('Should return aggregate data grouped by many fields', function(done) {
    api.aggregate('http://site.com/', 'test2', {
      group: [
        'administrative_classification_admin2_code.admin2_code',
        'administrative_classification_admin3_code.admin3_code',
      ]
    }).then(function(data) {

      assert.deepEqual(data, expectedMultiAggregate2);
      done();
    });
  });

  it('Should return facts data', function(done) {
    api.facts(
      'http://site.com/',
      'test2',
      {}
    ).then(function(data) {
      assert.deepEqual(data, expectedFacts2);
      done();
    }).catch(function(e) {
      console.log(e);
    });
  });

});
