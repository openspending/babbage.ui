# angular-cubes

The library provides a DSL, query frontend and visualisation functions running against the [Cubes OLAP](https://cubes.readthedocs.org/en/latest/server.html#aggregation-and-browsing) API.The intent is to make a re-usable set of angular-based frontend components for business intelligence.

### A few links

* [Sample API result](https://spendb-dev.herokuapp.com/api/slicer/cube/wb_contract_awards/aggregate?drilldown=supplier_country)
* [vega tutorial](https://github.com/trifacta/vega/wiki/Tutorial)
* [nvd3](https://github.com/novus/nvd3) and [angular-nvd3](https://github.com/krispo/angular-nvd3)
* [OffenerHaushalt Treemaps](https://github.com/okfde/offenerhaushalt.de/blob/master/offenerhaushalt/static/js/treemap.js)

### Imagined use

```html
<cubes slicer-url="http://host.org/slicer" cube="sales">
    <div class="row">    
        <div class="col-md-4">
            <cubes-filter-panel></cubes-filter-panel>
        </div>
        <div class="col-md-8">
            <cubes-table></cubes-table>
        </div>
    </div>
</cubes>
```

Or, with inline config:

```html
<cubes slicer-url="http://host.org/slicer" cube="sales">
    <cubes-treemap drilldown="region" measure="sales_usd" cut="time.year:2015">
    </cubes-treemap>
</cubes>
```
