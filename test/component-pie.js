const nock = require('nock');
const assert = require('chai').assert;
const _ = require('lodash');

describe('Babbage.ui pie component', function() {
  const cleanupJSDOM = require('jsdom-global')();
  const aggregate2 = require('./data/component-pie/aggregate2.json');
  const test2PackageModel = require('./data/component-pie/package2Model.json');
  var pieComponent;

  before(() => {
    // FIXME: We need to define these because of https://github.com/progers/pathseg/issues/19
    window.SVGPathSeg = function() {};
    window.SVGPathSegList = function() {};

    pieComponent = new (require('../src/components/pie').PieChartComponent)();

    nock('http://example.com/')
      .persist()
      .get('/cubes/test2/aggregate')
      .query({
        drilldown: 'administrative_classification_admin3_code.admin3_code' +
          '|administrative_classification_admin3_code.admin3_label',
        pagesize: '30',
        order: 'approved.sum:desc',
      })
      .reply(200, aggregate2, {'access-control-allow-origin': '*'});

    nock('http://example.com/')
      .persist()
      .get('/cubes/test2/model/')
      .reply(200, test2PackageModel, {'access-control-allow-origin': '*'});
  });

  after(() => {
    cleanupJSDOM();
  });

  it('Should exists', () => {
    assert(_.isObject(pieComponent));
  });

  it('Should return some data', () => {
    const params = {
      aggregates: 'approved.sum',
      group: ['administrative_classification_admin3_code.admin3_code']
    };

    return pieComponent._getData('http://example.com', 'test2', params)
      .then(function(data) {
        assert.isDefined(data);
        assert.lengthOf(data.cells, 3);
      });
  });

  describe('Grouping data', () => {
    it('Should return the unmodified data if it has no cells', () => {
      const data = {
        cells: [],
      };
      assert.deepEqual(pieComponent._groupSlicesIfMoreThan(data), data);
    });

    it('Should return the unmodified data if it has less cells than maxSlices', () => {
      const data = {
        cells: [{}],
      };
      assert.deepEqual(pieComponent._groupSlicesIfMoreThan(data, 1), data);
    });

    it('Should return the unmodified data if maxSlices is undefined', () => {
      const data = {
        cells: [{}],
      };
      assert.deepEqual(pieComponent._groupSlicesIfMoreThan(data), data);
    });

    it('Should throw RangeError if maxSlices is less than 1', () => {
      const data = {};

      for (const maxSlices of [-1, 0]) {
        assert.throws(
          () => pieComponent._groupSlicesIfMoreThan(data, maxSlices),
          RangeError
        );
      }
    });

    it('Should set the "others" cell\'s dimension values to i18n("others")', () => {
      const data = _stubAggregateData([
        100,
        200,
      ]);
      const maxSlices = 1;

      const grouppedData = pieComponent._groupSlicesIfMoreThan(_.cloneDeep(data), maxSlices);
      const othersCell = grouppedData.cells[grouppedData.cells.length - 1];
      othersCell.dimensions.forEach((dimension) => {
        Object.keys(dimension).forEach((dimensionKey) => {
          if (dimensionKey.endsWith('Value')) {
            assert.equal(dimension[dimensionKey], pieComponent.i18n('others'));
          } else {
            assert.notEqual(dimension[dimensionKey], pieComponent.i18n('others'));
          }
        });
      });
    });

    it('Should work with a single slice', () => {
      const data = _stubAggregateData([
        100,
        200,
        300,
        500,
      ]);
      const maxSlices = 1;

      const grouppedData = pieComponent._groupSlicesIfMoreThan(_.cloneDeep(data), maxSlices);
      const othersCell = grouppedData.cells[grouppedData.cells.length - 1];
      assert.lengthOf(grouppedData.cells, maxSlices);
      othersCell.measures.forEach((measure) => {
        // If there's only one slice, its values must be equal to the summary values
        assert.equal(measure.value, data.summary[measure.key]);
      });
    });

    it('Should work with more than one slice', () => {
      const data = _stubAggregateData([
        100,
        200,
        300,
        500,
      ]);
      const maxSlices = 2;

      const grouppedData = pieComponent._groupSlicesIfMoreThan(_.cloneDeep(data), maxSlices);
      const othersCell = grouppedData.cells[grouppedData.cells.length - 1];
      assert.lengthOf(grouppedData.cells, maxSlices);
      othersCell.measures.forEach((measure) => {
        assert.equal(measure.value, 1000);
      });
    });
  });
});


function _stubAggregateData(cellsMeasuresValues) {
  const MEASURE = {
    key: 'approved.sum',
    name: 'approved',
  };
  const data = {};

  data.cells = cellsMeasuresValues.map((value) => {
    return {
      dimensions: [{
        keyField: 'KEY_FIELD',
        keyValue: 'KEY_VALUE',
        nameField: 'NAME_FIELD',
        nameValue: 'NAME_VALUE',
      }],
      measures: [
        {
          key: MEASURE.key,
          name: MEASURE.name,
          value,
        },
      ],
    };
  });

  data.summary = data.cells.reduce((summary, cell) => {
    const measure = cell.measures.find((measure) => measure.key === MEASURE.key);
    summary[MEASURE.key] += measure.value;
    return summary;
  }, {
    [MEASURE.key]: 0,
  });

  return data;
}
