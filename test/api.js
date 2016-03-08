var nock = require('nock');
var assert = require('chai').assert;
var _ = require('lodash');

describe('Babbage.ui API', function() {
  var api = new (require('../lib/api/').Api)();
  var aggregate1 = require('./data/api/aggregate1.json');
  var aggregate2 = require('./data/api/aggregate2.json');
  var testPackageModel = require('./data/api/package1Model.json');
  var test2PackageModel = require('./data/api/package2Model.json');

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
        'group=administrative_classification.admin1&' +
        'page=0&pagesize=30')
      .reply(200, aggregate1, {'access-control-allow-origin': '*'});

    nock('http://site.com/')
      .persist()
      .get('/cubes/test2/aggregate?' +
        'group=administrative_classification.admin3_code%7Cadministrative_classification.admin3_label&' +
        'page=0&pagesize=30')
      .reply(200, aggregate2, {'access-control-allow-origin': '*'});


    nock('http://site.com/')
      .persist()
      .get('/cubes/test/model')
      .reply(200, testPackageModel, {'access-control-allow-origin': '*'});

    nock('http://site.com/')
      .persist()
      .get('/cubes/test2/model')
      .reply(200, test2PackageModel, {'access-control-allow-origin': '*'});

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
      cut: 'cut1',
      filter: 'filter'
    });
    assert.equal(
      url,
      'http://api.com/cubes/test/aggregate?cut=cut1&filter=filter'
    );

    done();
  });

  it('Should return aggregate data', function(done) {
    api.aggregate('http://site.com/', 'test', {
      group: ['administrative_classification.admin1']
    }).then(function(data) {
      assert.deepEqual(data,
        {
          summary: 350,
          count: 3,
          cells: [
            {
              key: 'Central',
              name: 'Central',
              value: 100
            },
            {
              key: 'Other',
              name: 'Other',
              value: 200
            },
            {
              key: 'Local',
              name: 'Local',
              value: 50
            }
          ]
        });
      done();
    });
  });

  it('Should return aggregate data grouped by field with `label-for`', function(done) {
    api.aggregate('http://site.com/', 'test2', {
      group: ['administrative_classification.admin3_code']
    }).then(function(data) {
      assert.deepEqual(data, {
        summary: 350,
        count: 88,
        cells: [
          {
            key: '289',
            name: 'National Social Insurance Company',
            value: 100
          },
          {
            key: '322',
            name: 'National Health Insurance Company',
            value: 200
          },
          {
            key: '200',
            name: 'General actions',
            value: 50
          }
        ]
      });
      done();
    });
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
      assert.equal(displayField, 'to.name');
      done();
    });
  });

  it('Should return `Display field` for field with `label-for`', function(done) {
    api.getPackageModel('http://site.com/', 'test2').then(function(model) {
      var displayField = api.getDisplayField(model, 'administrative_classification.admin3_code');
      assert.equal(displayField, 'administrative_classification.admin3_label');
      done();
    });
  });
});
