var nock = require('nock');
var assert = require('chai').assert;
var _ = require('underscore');

describe('Babbage.ui API', function() {
  var api = new (require('../lib/api/').Api)();
  var aggregate1 = require('./data/api/aggregate1.json');

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
      .get('/cubes/test/aggregate?groupBy=administrative_classification.admin1')
      .reply(200, aggregate1, {'access-control-allow-origin': '*'});

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
    }).catch(function(e) {
      console.log('----------------');
      console.log(e);
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
      groupBy: ['administrative_classification.admin1']
    }).then(function(data) {
      assert.deepEqual(data, [
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
      ]);
      done();
    });
  });

});
