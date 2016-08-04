# babbage.ui

[![Gitter](https://img.shields.io/gitter/room/openspending/chat.svg)](https://gitter.im/openspending/chat)
[![Issues](https://img.shields.io/badge/issue-tracker-orange.svg)](https://github.com/openspending/openspending/issues)
[![Docs](https://img.shields.io/badge/docs-latest-blue.svg)](http://docs.openspending.org/en/latest/developers/views/)

A set of view components to visualise data returned by a Babbage API.

## Quick start

Install from npm, and use in your app. See the [docs](http://docs.openspending.org/en/latest/developers/views/), and below, for more information.


The library provides a DSL, query frontend and visualisation functions running against the [Babbage Analytical Engine](https://github.com/spendb/babbage) API. The intent is to make a re-usable set of angular-based front-end
components for business intelligence.

### Usage

#### Preparing your `angular` application

There are two ways to use `angular` bindings in your application:

- `require` components from `/src/bindings/*` (ES2016 code) or from `/lib/bindings/*` (compiled sources) directory;
- add `/dist/babbage-*.js` or `/dist/babbage-*.min.js` file to html page. Important note: ensure that `c3`, `d3` and `jQuery` objects are available in global scope. They are marked as external to allow extending them. Also see notes for some visualizations.   
 
Then you should initialize library components, in example:
 
```javascript

// This two lines should be used only with CommonJS code;
// when using webpack bundles - angular and Babbage will be available
// in global scope
var angular = require('angular');
var Babbage = require('babbage.ui/lib/bindings/angular');

var pieDirective = new Babbage.PieChartDirective();
var chartDirective = new Babbage.ChartDirective();
var treeMapDirective = new Babbage.TreemapDirective();
var bubbleTreeDirective = new Babbage.BubbleTreeDirective();
var tableDirective = new Babbage.BabbageTableDirective();
var geoViewDirective = new Babbage.GeoViewDirective();
var pivotTableDirective = new Babbage.PivotTableDirective();
var factsDirective = new Babbage.FactsDirective();
var sankeyDirective = new Babbage.SanKeyChartDirective();

var module = angular.module('babbage.ui', []);

pieDirective.init(module);
chartDirective.init(module);
treeMapDirective.init(module);
tableDirective.init(module);
bubbleTreeDirective.init(module);
geoViewDirective.init(module);
pivotTableDirective.init(module);
factsDirective.init(module);
sankeyDirective.init(module);
```

#### Using `angular` bindings

Common parameters for each visualization: 

- `aggregates` - string; single key of measure. 
- `filter` - array of strings; each string should contain key of dimension and filter value, separated by pipe `|`. 
- `order` - array of objects; each object should have `key` (key of measure or dimension) and `direction` fields. Possible values for `direction` are `asc` and `desc`. 
 
Other visualizations may require other additional parameters.
 
##### Treemap, BubbleTree, Facts, Table, Map components and charts  

```html
<tree-map endpoint="http://example.com/api/" cube="demo" state="state"></tree-map>

<bubbletree endpoint="http://example.com/api/" cube="demo" state="state"></bubbletree>

<facts endpoint="http://example.com/api/" cube="demo" state="state"></facts>

<babbage-table endpoint="http://example.com/api/" cube="demo" state="state"></babbage-table>

<geo-view endpoint="http://example.com/api/" cube="demo" state="state"
    cosmo-endpoint="http://example.com/cosmopolitan/" 
    currency-sign="USD" 
    country-code="US"></geo-view>
 
<chart type="bar" endpoint="http://example.com/api/" cube="demo" state="state"></pivot>

<chart type="line" endpoint="http://example.com/api/" cube="demo" state="state"></pivot>

<pie-chart endpoint="http://example.com/api/" cube="demo" state="state"></pie-chart>   
```

Additional required fields:

- `group` - array of strings - keys of dimensions to group by.

Important notes:

- BubbleTree requires [bubbletree](https://github.com/okfn/bubbletree) library (take care about its dependencies too).
- TreeMap and Map visualizations require [d3](https://github.com/d3/d3) library.
- All charts require [c3](https://github.com/masayuki0812/c3) library.    

##### Pivot Table

```html
<pivot-table endpoint="http://example.com/api/" cube="demo" state="state"></pivot-table>
```

Additional required fields:
- `rows` - array of strings - keys of dimensions to use as rows. 
- `cols` - array of strings - keys of dimensions to use as columns. 
  
##### Sankey

```html
<san-key-chart endpoint="http://example.com/api/" cube="demo" state="state"></san-key-chart>
```

Additional required fields:
- `source` - string - key of dimension to use as source (left nodes on graph). 
- `target` - string - key of dimension to use as target (right nodes on graph).
 
Important note: this visualization requires [sankey](https://github.com/d3/d3-plugins/tree/master/sankey) plugin for [d3](https://github.com/d3/d3). 

### Example

Clone the repository and open ``index.html`` to see ``babbage`` in action, no pre-config required.

### Dev installation

* Dev tool installation with [npm](https://www.npmjs.com/): ``npm install`` (see ``package.json``).
* Compile library sources using `npm run build:lib`.
* Use `npm run build:dist` or `npm run build:dist:min` to create `webpack` bundles for each binding. Also use `npm run build` to completely rebuild the library.
* Run tests with `npm test`. 
* Check code style with `npm run review`. Run `npm run fix` to check code style and automatically fix errors.  

### A few links

* [Sample API result](https://spendb-dev.herokuapp.com/api/slicer/cube/wb-contract-awards/aggregate?drilldown=supplier_country)
* [vega tutorial](https://github.com/trifacta/vega/wiki/Tutorial)
* [nvd3](https://github.com/novus/nvd3) and [angular-nvd3](https://github.com/krispo/angular-nvd3)
* [OffenerHaushalt Treemaps](https://github.com/okfde/offenerhaushalt.de/blob/master/offenerhaushalt/static/js/treemap.js)
