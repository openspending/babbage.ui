
var makeSignal = function(name) {
  return 'cubes_' + Math.random().toString(36).replace(/[^a-z]+/g, '');
};

function asArray(obj) {
  objs = obj ? obj : [];
  return angular.isArray(objs) ? objs : [objs];
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
// suggested polyfill for safari & IE
if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString, position) {
      var subjectString = this.toString();
      if (position === undefined || position > subjectString.length) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
  };
}
;
var ngCubes = angular.module('ngCubes', ['ngCubes.templates']),
    numberFormat = d3.format("0,000");

ngCubes.filter('numeric', function() {
  return function(val) {
    var fval = parseFloat(val)
    if (isNaN(fval)) {
      return '-';
    }
    return numberFormat(Math.round(fval));
  };
})

ngCubes.factory('cubesApi', ['$http', '$q', 'slugifyFilter', function($http, $q, slugifyFilter) {
  var cache = {};

  var getUrl = function(slicer, cube, endpoint) {
    var api = slicer.slice(),
        api = api.endsWith('/') ? api.slice(0, api.length - 1) : api,
        api = api + '/cube/' + cube + '/' + endpoint;
    return api;
  };

  var getCached = function(url) {
    if (!angular.isDefined(cache[url])) {
      cache[url] = $http.get(url);
    }
    return cache[url];
  };

  var getModel = function(slicer, cube) {
    return getCached(getUrl(slicer, cube, 'model')).then(function(res) {
      var model = res.data;
      model.refs = {};
      model.refKeys = {};
      model.refLabels = {};

      for (var i in model.measures) {
        var measure = model.measures[i];
        measure.numeric = true;
        measure.hideLabel = true;
        model.refs[measure.ref] = measure;
      }

      for (var di in model.dimensions) {
        var dim = model.dimensions[di];
        for (var li in dim.levels) {
          var lvl = dim.levels[li];
          for (var ai in lvl.attributes) {
            var attr = lvl.attributes[ai],
                nested = attr.ref.indexOf('.') != -1;
            attr.dimension = dim;
            attr.hideLabel = slugifyFilter(attr.label) == slugifyFilter(dim.label);
            model.refs[attr.ref] = attr;
            model.refKeys[attr.ref] = nested ? dim.name + '.' + lvl.key : attr.ref;
            model.refLabels[attr.ref] = nested ? dim.name + '.' + lvl.label_attribute : attr.ref;
          }
        }
      }
      return model;
    });
  };

  var getDimensionMembers = function(slicer, cube, dimension) {
    return getCached(getUrl(slicer, cube, 'members/' + dimension));
  };

  var flush = function() {
    cache = {};
  };

  return {
    getUrl: getUrl,
    getModel: getModel,
    getDimensionMembers: getDimensionMembers,
    flush: flush
  };
}]);

ngCubes.directive('cubes', ['$http', '$rootScope', '$location', 'cubesApi',
    function($http, $rootScope, $location, cubesApi) {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      slicer: '@',
      cube: '@',
      state: '='
    },
    templateUrl: 'angular-cubes-templates/cubes.html',
    controller: ['$scope', function($scope) {
      var self = this,
          state = angular.extend({}, $scope.state || {}, $location.search());

      self.dataUpdate = makeSignal();
      self.modelUpdate = makeSignal();
      self.queryModel = {};

      self.init = function(queryModel) {
        self.queryModel = queryModel;
        cubesApi.getModel($scope.slicer, $scope.cube).then(function(model) {
          $rootScope.$broadcast(self.modelUpdate, model, state);
        });
      };

      self.getState = function() {
        return state;
      };

      self.setState = function(s) {
        $location.search(s);
      };

      self.getApiUrl = function(endpoint) {
        return cubesApi.getUrl($scope.slicer, $scope.cube, endpoint);
      };

      self.getDimensionMembers = function(dimension) {
        return cubesApi.getDimensionMembers($scope.slicer, $scope.cube, dimension);
      };

      self.getSorts = function() {
        var sorts = [],
            order = state.order || '',
            order = asArray(order.split(','));
        for (var i in order) {
          var parts = order[i].split(':'),
              sort = {};
          sort.ref = parts[0],
          sort.direction = parts[1] || null;
          sorts.push(sort);
        }
        return sorts;
      };

      self.getSort = function(ref) {
        var sorts = self.getSorts();
        for (var i in sorts) {
          if (sorts[i].ref == ref) {
            return sorts[i];
          }
        }
        return {ref: ref};
      };

      self.pushSort = function(ref, direction) {
        var sorts = self.getSorts().filter(function(s) {
          return s.ref != ref;
        });
        sorts.unshift({ref: ref, direction: direction});
        state.order = self.mergeSorts(sorts);
        self.setState(state);
      };

      self.removeSorts = function(ref) {
        var sorts = self.getSorts().filter(function(s) {
          return s.ref != ref;
        });
        return self.mergeSorts(sorts);
      };

      self.mergeSorts = function(order) {
        var sorts = [];
        order = asArray(order);
        for (var i in order) {
          var o = order[i];
          if (angular.isObject(o) && o.ref.length) {
            o.direction = o.direction || 'asc';
            o = o.ref + ':' + o.direction;
            sorts.push(o);
          }
        }
        return sorts.join(',');
      };

      self.getQuery = function() {
        var q = {
          drilldown: [],
          aggregates: [],
          cut: state.cut || [],
          page: state.page || 0,
          pagesize: state.pagesize || 30,
          order: self.getSorts()
        };
        return q;
      };

      self.queryParams = function(q) {
        q.order = self.mergeSorts(q.order);

        // join arguments and remove empty arguments
        for (var k in q) {
          if (angular.isArray(q[k])) {
            if (['order', 'fields'].indexOf(k) != -1) {
              q[k] = q[k].join(',');
            } else {
              q[k] = q[k].join('|');
            }
          }
          q[k] = q[k] + '';
          if (!q[k].length) {
            delete q[k];
          }
        }
        return {params: q};
      }
    }]
  };
}]);
;
ngCubes.directive('cubesPager', ['$timeout', '$location', function ($timeout, $location) {
  return {
    restrict: 'E',
    scope: {
      'context': '='
    },
    templateUrl: 'angular-cubes-templates/pager.html',
    link: function (scope, element, attrs, model) {
      scope.showPager = false;
      scope.hasPrev = false;
      scope.hasNext = false;
      scope.pages = [];
      scope.cur = 0;
      scope.num = 0;
        
      scope.$watch('context', function(e) {
        if (!scope.context || scope.context.total <= scope.context.pagesize) {
          return;
        }
        scope.current = parseInt(scope.context.page, 10) || 0;
        scope.num = Math.ceil(scope.context.total / scope.context.pagesize)
        var pages = [],
          num = scope.num,
          range = 3,
          low = scope.current - range,
          high = scope.current + range;

        if (low < 0) {
          low = 0;
          high = Math.min((2*range)+1, num);
        }
        if (high > num) {
          high = num;
          low = Math.max(1, num - (2*range)+1);
        }

        for (var page = low; page <= high; page++) {
          // var offset = (page - 1) * scope.context.pagesize;
          pages.push({
            page: page,
            current: page == scope.current,
            //offset: offset
          });
        }
        scope.hasPrev = scope.current > 0;
        scope.hasNext = scope.current < num;
        scope.showPager = num > 1;
        scope.pages = pages;
      });

      scope.setPage = function(page) {
        if (page >= 0 && page <= scope.num) {
          var state = $location.search();
          state.page = page;
          $location.search(state);  
        }
      }
    }
  };
}]);
;var VAL_KEY = '@@@@',
    POS_KEY = '!@!@'

ngCubes.directive('cubesCrosstab', ['$rootScope', '$http', function($rootScope, $http) {
  return {
  restrict: 'EA',
  require: '^cubes',
  scope: {
    drilldown: '='
  },
  templateUrl: 'angular-cubes-templates/crosstab.html',
  link: function(scope, element, attrs, cubesCtrl) {
    scope.queryLoaded = false;
    scope.columns = [];
    scope.rows = [];
    scope.table = [];

    var query = function(model, state) {
      state.rows = asArray(state.rows);
      state.columns = asArray(state.columns);
      state.aggregates = asArray(state.aggregates);
      // TODO: handle a case in which both sets contain the same
      // ref.

      var q = cubesCtrl.getQuery();
      q.aggregates = q.aggregates.concat(state.aggregates);
      if (!q.aggregates.length) {
        q.aggregates = defaultAggregates(model);
      }
      q.drilldown = q.drilldown.concat(state.rows);
      q.drilldown = q.drilldown.concat(state.columns);
      q.page = 0;
      q.pagesize = q.pagesize * 10000;

      q.order = asArray(q.order);
      var drilldowns = state.rows.concat(state.columns),
          refs = drilldowns.concat(q.aggregates);
      for (var i in drilldowns) {
        var dd = drilldowns[i];
        if (!cubesCtrl.getSort(dd).direction) {
          if (q.order.indexOf(dd) == -1) {
            q.order.push({ref: dd});
          }  
        }
      }
      var order = [];
      for (var i in q.order) {
        var o = q.order[i];
        if (refs.indexOf(o.ref) != -1) {
          order.push(o);
        }
      }
      q.order = order;

      var dfd = $http.get(cubesCtrl.getApiUrl('aggregate'),
                          cubesCtrl.queryParams(q));
      dfd.then(function(res) {
        queryResult(res.data, q, model, state);
      });
    };

    var queryResult = function(data, q, model, state) {
      state.rows = asArray(state.rows);
      state.columns = asArray(state.columns);

      var aggregates = model.aggregates.filter(function(agg) {
        return data.aggregates.indexOf(agg.ref) != -1;
      });

      // following code inspired by: 
      // https://github.com/DataBrewery/cubes/blob/master/cubes/formatters.py#L218
      var matrix = {}, table = [],
          row_headers = [], column_headers = [],
          row_keys = [], column_keys = [];

      for (var i in data.cells) {
        var pickValue = function(k) { return cell[k]; },
            pickRefs = function(k) { return cell[model.refKeys[k]] + cell[k]; };

        var cell = data.cells[i],
            row_values = state.rows.map(pickValue),
            row_set = state.rows.map(pickRefs).join(VAL_KEY),
            all_column_values = state.columns.map(pickValue),
            all_column_set = state.columns.map(pickRefs);

        for (var k in aggregates) {
          var agg = aggregates[k],
              label = agg.label || agg.name,
              column_values = all_column_values.concat([label]);
              column_set = all_column_set.concat([label]).join(VAL_KEY)

          if (row_keys.indexOf(row_set) == -1) {
            row_keys.push(row_set);
            row_values.key = row_set;
            row_headers.push(row_values);
          }

          if (column_keys.indexOf(column_set) == -1) {
            column_keys.push(column_set);
            column_headers.push(column_values);
          }

          var key = [row_set, column_set].join(POS_KEY);
          matrix[key] = cell[agg.name];
        }
      }

      for (var i in row_keys) {
        var row_key = row_keys[i];
        var row = [];
        for (var j in column_keys) {
          var column_key = column_keys[j];
          var key = [row_key, column_key].join(POS_KEY);
          row.push(matrix[key] || data.aggregates.map(function(a) { return undefined; }));
        }
        table.push(row);
      }

      scope.rows = row_headers;
      scope.columns = column_headers;
      scope.table = table;
      scope.queryLoaded = true;
    };


    $rootScope.$on(cubesCtrl.modelUpdate, function(event, model, state) {
      query(model, state);
    });

    var defaultAggregates = function(model) {
      var aggs = [];
      for (var i in model.aggregates) {
        var agg = model.aggregates[i];
        aggs.push(agg.ref);
      }
      return aggs;
    };

    // console.log('crosstab init');
    cubesCtrl.init({
      columns: {
        label: 'Columns',
        addLabel: 'add column',
        types: ['attributes'],
        defaults: [],
        sortId: 0,
        multiple: true
      },
      rows: {
        label: 'Rows',
        addLabel: 'add row',
        types: ['attributes'],
        defaults: [],
        sortId: 1,
        multiple: true
      },
      aggregates: {
        label: 'Values',
        addLabel: 'add value',
        types: ['aggregates'],
        defaults: defaultAggregates,
        sortId: 2,
        multiple: true
      },

    });
  }
  };
}]);

;
ngCubes.directive('cubesFacts', ['$rootScope', '$http', '$q', function($rootScope, $http, $q) {
  return {
  restrict: 'EA',
  require: '^cubes',
  scope: {
    drilldown: '='
  },
  templateUrl: 'angular-cubes-templates/facts.html',
  link: function(scope, element, attrs, cubesCtrl) {
    scope.page = 0;
    scope.data = [];
    scope.columns = [];
    scope.pagerCtx = {};
    scope.getSort = cubesCtrl.getSort;
    scope.pushSort = cubesCtrl.pushSort;

    var query = function(model, state) {
      var q = cubesCtrl.getQuery();
      q.fields = asArray(state.fields);
      if (q.fields.length == 0) {
        q.fields = defaultFields(model);
      }

      var order = [];
      for (var i in q.order) {
        var o = q.order[i];
        if (q.fields.indexOf(o.ref) != -1) {
          order.push(o);
        }
      }
      q.order = order;

      var aq = angular.copy(q);
      aq.drilldown = aq.fields = [];
      aq.page = 0;
      var facts = $http.get(cubesCtrl.getApiUrl('facts'),
                            cubesCtrl.queryParams(q)),
          aggs = $http.get(cubesCtrl.getApiUrl('aggregate'),
                            cubesCtrl.queryParams(aq));
      $q.all([facts, aggs]).then(function(res) {
        queryResult(res[0].data, res[1].data, q, state, model);
      });
    };

    var queryResult = function(data, aggs, q, state, model) {
      if (!data.length) {
        scope.columns = [];
        scope.data = [];
        scope.pagerCtx = {};
        return;
      };

      var frst = data[0],
          keys = [];

      for (var k in frst) {
        keys.push(k);
      }
      keys = keys.sort();

      var columns = [],
          prev = null,
          prev_idx = 0;

      for (var i in keys) {
        var ref = keys[i],
            column = model.refs[ref],
            header = column.dimension ? column.dimension : column;

        column.ref = ref;

        if (header.name == prev) {
          columns[prev_idx].span += 1;
          column.span = 0;
        } else {
          column.span = 1;
          column.label = column.label || column.name;
          column.header = header.label || header.name;
          column.hide = column.hideLabel;
          prev = header.name;
          prev_idx = columns.length;
        }
        columns.push(column);
      }
      scope.columns = columns;
      scope.data = data;
      scope.pagerCtx = {
        page: q.page,
        pagesize: q.pagesize,
        // FIXME: this is SpenDB-specific:
        total: aggs.summary.fact_count
      }
    };

    var defaultFields = function(model) {
      var defaults = [];
      for (var i in model.measures) {
        var mea = model.measures[i];
        defaults.push(mea.ref);
      }
      for (var i in model.dimensions) {
        var dim = model.dimensions[i];
        for (var j in dim.levels) {
          var lvl = dim.levels[j];
          for (var k in lvl.attributes) {
            var attr = lvl.attributes[k];
            if (attr.name == lvl.label_attribute) {
              defaults.push(attr.ref);
            }
          }
        }
      }
      return defaults;
    };

    $rootScope.$on(cubesCtrl.modelUpdate, function(event, model, state) {
      query(model, state);
    });

    // console.log('facts init');
    cubesCtrl.init({
      fields: {
        label: 'Columns',
        addLabel: 'add column',
        types: ['attributes', 'measures'],
        defaults: defaultFields,
        sortId: 0,
        multiple: true
      }
    });
  }
  };
}]);

;ngCubesCategoryColors = [
    "#CF3D1E", "#F15623", "#F68B1F", "#FFC60B", "#DFCE21",
    "#BCD631", "#95C93D", "#48B85C", "#00833D", "#00B48D",
    "#60C4B1", "#27C4F4", "#478DCB", "#3E67B1", "#4251A3", "#59449B",
    "#6E3F7C", "#6A246D", "#8A4873", "#EB0080", "#EF58A0", "#C05A89"
    ];

ngCubesColorScale = d3.scale.ordinal().range(ngCubesCategoryColors);

ngCubes.directive('cubesTreemap', ['$rootScope', '$http', '$document', function($rootScope, $http, $document) {
  return {
  restrict: 'EA',
  require: '^cubes',
  scope: {
    drilldown: '='
  },
  templateUrl: 'angular-cubes-templates/treemap.html',
  link: function(scope, element, attrs, cubesCtrl) {
    var treemap = null,
        div = null;

    scope.queryLoaded = false;
    scope.cutoffWarning = false;

    var query = function(model, state) {
      var tile = asArray(state.tile)[0],
          area = asArray(state.area)[0],
          area = area ? [area] : defaultArea(model);

      var q = cubesCtrl.getQuery();
      q.aggregates = area;
      if (!tile) {
        return;
      }
      q.drilldown = [tile];

      var order = [];
      for (var i in q.order) {
        var o = q.order[i];
        if ([tile, area].indexOf(o.ref) != -1) {
          order.push(o);
        }
      }
      if (!order.length) {
        order = [{ref: area, direction: 'desc'}];
      }

      q.order = order;
      q.page = 0;
      q.pagesize = 50;

      scope.cutoffWarning = false;
      scope.queryLoaded = true;
      var dfd = $http.get(cubesCtrl.getApiUrl('aggregate'),
                          cubesCtrl.queryParams(q));

      var wrapper = element.querySelectorAll('.treemap-cubes')[0],
          width = wrapper.clientWidth,
          height = width * 0.6;

      treemap = d3.layout.treemap()
        .size([width, height])
        .sticky(true)
        .sort(function(a, b) { return a[area] - b[area]; })
        .value(function(d) { return d[area]; });

      div = d3.select(wrapper).append("div")
        .style("position", "relative")
        .style("width", width + "px")
        .style("height", height + "px");

      dfd.then(function(res) {
        queryResult(res.data, q, model, state);
      });
    };

    var queryResult = function(data, q, model, state) {
      var tileRef = asArray(state.tile)[0],
          areaRef = asArray(state.area)[0],
          areaRef = areaRef ? [areaRef] : defaultArea(model);

      var root = {
        children: []
      };

      for (var i in data.cells) {
        var cell = data.cells[i];
        cell._area_fmt = numberFormat(Math.round(cell[areaRef]));
        cell._name = cell[tileRef];
        cell._color = ngCubesColorScale(i);
        cell._percentage = cell[areaRef] / Math.max(data.summary[areaRef], 1);
        root.children.push(cell);
      };

      var node = div.datum(root).selectAll(".node")
          .data(treemap.nodes)
        .enter().append("a")
          .attr("href", function(d){ return d.href; })
          .attr("class", "node")
          .call(positionNode)
          .style("background", '#fff')
          .html(function(d) {
            if (d._percentage < 0.02) {
              return '';
            }
            return d.children ? null : '<span class="amount">' + d._area_fmt + '</span>' + d._name;
          })
          .on("mouseover", function(d) {
            d3.select(this).transition().duration(200)
              .style({'background': d3.rgb(d._color).darker() });
          })
          .on("mouseout", function(d) {
            d3.select(this).transition().duration(500)
              .style({'background': d._color});
          })
          .transition()
          .duration(500)
          .delay(function(d, i) { return Math.min(i * 30, 1500); })
          .style("background", function(d) { return d._color; });

      scope.cutoffWarning = data.total_cell_count > q.pagesize;
      scope.cutoff = q.pagesize;
    };

    function positionNode() {
      this.style("left", function(d) { return d.x + "px"; })
          .style("top", function(d) { return d.y + "px"; })
          .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
          .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
    };


    $rootScope.$on(cubesCtrl.modelUpdate, function(event, model, state) {
      query(model, state);
    });

    var defaultArea = function(model) {
      for (var i in model.aggregates) {
        var agg = model.aggregates[i];
        if (agg.measure) {
          return [agg.ref];
        }
      }
      return [];
    };

    cubesCtrl.init({
      tile: {
        label: 'Tiles',
        addLabel: 'set breakdown',
        types: ['attributes'],
        defaults: [],
        sortId: 0,
        multiple: false
      },
      area: {
        label: 'Area',
        addLabel: 'set area',
        types: ['aggregates'],
        defaults: defaultArea,
        sortId: 1,
        multiple: false
      },
    });
  }
  };
}]);
;
ngCubes.directive('cubesSankey', ['$rootScope', '$http', '$document', function($rootScope, $http, $document) {
  return {
  restrict: 'EA',
  require: '^cubes',
  scope: {
    drilldown: '='
  },
  templateUrl: 'angular-cubes-templates/sankey.html',
  link: function(scope, element, attrs, cubesCtrl) {
    var unit = 15,
        margin = {top: unit / 2, right: 1, bottom: 6, left: 1},
        svg = null, group = null;

    scope.queryLoaded = false;
    scope.cutoffWarning = false;
    scope.cutoff = 0;

    var query = function(model, state) {
      var source = asArray(state.source)[0],
          target = asArray(state.target)[0]
          aggregate = asArray(state.aggregate)[0],
          aggregate = aggregate ? [aggregate] : defaultAggregate(model);

      var q = cubesCtrl.getQuery();
      q.aggregates = aggregate;
      if (!source || !target) {
        return;
      }
      q.drilldown = [source, target];

      q.order = [
        {
          ref: aggregate,
          direction: 'desc'
        },
        {
          ref: source,
          direction: 'asc'
        },
        {
          ref: target,
          direction: 'asc'
        }
      ];
      q.page = 0;
      q.pagesize = 2000;

      scope.queryLoaded = true;
      scope.cutoffWarning = false;
      var dfd = $http.get(cubesCtrl.getApiUrl('aggregate'),
                          cubesCtrl.queryParams(q));

      var wrapper = element.querySelectorAll('.sankey-cubes')[0],
          width = wrapper.clientWidth;

      if (!svg) {
          svg = d3.select(wrapper).append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", margin.top + margin.bottom);
          group =  svg.append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
      }

      dfd.then(function(res) {
        queryResult(width, res.data, q, model, state);
      });
    };

    var queryResult = function(width, data, q, model, state) {
      var sourceRef = asArray(state.source)[0],
          targetRef = asArray(state.target)[0]
          aggregateRef = asArray(state.aggregate)[0],
          aggregateRef = aggregateRef ? [aggregateRef] : defaultAggregate(model),
          height = data.cells.length * unit * 0.8;

      svg.attr("height", height + margin.top + margin.bottom);

      var graph = {nodes: [], links: []},
          objs = {};

      // console.log(data);

      var sourceScale = ngCubesColorScale.copy(),
          targetScale = d3.scale.ordinal().range(['#ddd', '#ccc', '#eee', '#bbb']);;
      data.cells.forEach(function(cell) {
        var sourceId = cell[sourceRef],
            targetId = cell[targetRef],
            link = {
              //value: Math.sqrt(cell[aggregateRef]),
              value: cell[aggregateRef],
              number: numberFormat(cell[aggregateRef])
            };

        if (link.value == 0 || !sourceId || !targetId) {
          return;
        }

        if (!objs[sourceId]) {
          var label = cell[model.refLabels[sourceRef]];
          graph.nodes.push({
            name: label,
            color: sourceScale(sourceId)
          });
          objs[sourceId] = {idx: graph.nodes.length - 1};
        }
        link.source = objs[sourceId].idx;

        if (!objs[targetId]) {
          var label = cell[model.refLabels[targetRef]];
          graph.nodes.push({
            name: label,
            color: targetScale(targetId)
          });
          objs[targetId] = {
            idx: graph.nodes.length - 1
          };
        }
        link.target = objs[targetId].idx;
        graph.links.push(link);
      });

      var sankey = d3.sankey()
         .nodeWidth(unit)
         .nodePadding(unit * 0.6)
         .size([width, height]);

      var path = sankey.link();

      sankey
        .nodes(graph.nodes)
        .links(graph.links)
        .layout(32);

    var link = group.append("g").selectAll(".link")
        .data(graph.links)
      .enter().append("path")
        .attr("class", "link")
        .attr("d", path)
        .style("stroke-width", function(d) {
          return Math.max(1, d.dy);
        })
        .style("stroke", function(d) {
          return d.source.color;
        })
        .sort(function(a, b) { return b.dy - a.dy; });

    link.append("title")
        .text(function(d) { return d.source.name + " → " + d.target.name + "\n" + d.number; });

    var node = group.append("g").selectAll(".node")
        .data(graph.nodes)
      .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

    node.append("rect")
        .attr("height", function(d) { return d.dy; })
        .attr("width", sankey.nodeWidth())
        .style("fill", function(d) { return d.color; })
        .style("stroke", function(d) { return d3.rgb(d.color).darker(1); })
      .append("title")
        .text(function(d) { return d.name });

    node.append("text")
        .attr("x", -6)
        .attr("y", function(d) { return d.dy / 2; })
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .attr("transform", null)
        .text(function(d) { return d.name; })
      .filter(function(d) { return d.x < width / 2; })
        .attr("x", 6 + sankey.nodeWidth())
        .attr("text-anchor", "start");

      scope.cutoffWarning = data.total_cell_count > q.pagesize;
      scope.cutoff = q.pagesize;
    };


    $rootScope.$on(cubesCtrl.modelUpdate, function(event, model, state) {
      query(model, state);
    });

    var defaultAggregate = function(model) {
      for (var i in model.aggregates) {
        var agg = model.aggregates[i];
        if (agg.measure) {
          return [agg.ref];
        }
      }
      return [];
    };

    cubesCtrl.init({
      source: {
        label: 'Source',
        addLabel: 'set left side',
        types: ['attributes'],
        defaults: [],
        sortId: 0,
        multiple: false
      },
      target: {
        label: 'Target',
        addLabel: 'set right side',
        types: ['attributes'],
        defaults: [],
        sortId: 1,
        multiple: false
      },
      aggregate: {
        label: 'Width',
        addLabel: 'set width',
        types: ['aggregates'],
        defaults: defaultAggregate,
        sortId: 2,
        multiple: false
      },

    });
  }
  };
}]);
;
ngCubes.directive('cubesPanel', ['$rootScope', 'slugifyFilter', function($rootScope, slugifyFilter) {
  return {
    restrict: 'EA',
    require: '^cubes',
    scope: {
    },
    templateUrl: 'angular-cubes-templates/panel.html',
    link: function($scope, $element, attrs, cubesCtrl) {
      var model = null;

      $scope.state = {};
      $scope.axes = [];
      $scope.filterAttributes = [];
      $scope.filters = [];
      $scope.getSort = cubesCtrl.getSort;
      $scope.pushSort = cubesCtrl.pushSort;

      var update = function() {
        //$scope.state.page = 0;
        cubesCtrl.setState($scope.state);
      };

      $scope.add = function(axis, ref) {
        if (axis.selected.indexOf(ref) == -1) {
          if (axis.multiple) {
            axis.selected.push(ref);
          } else {
            if (axis.selected.length) {
              $scope.state.order = cubesCtrl.removeSorts(axis.selected[0]);  
            }
            axis.selected = [ref];
          }
          $scope.state[axis.name] = axis.selected;
          update();
        }
      };

      $scope.remove = function(axis, ref) {
        var i = axis.selected.indexOf(ref);
        if (i != -1) {
          axis.selected.splice(i, 1);
          $scope.state[axis.name] = axis.selected;
          $scope.state.order = cubesCtrl.removeSorts(ref);
          update();
        }
      };

      var makeOptions = function() {
        var options = [];
        for (var di in model.dimensions) {
          var dim = model.dimensions[di];
          for (var li in dim.levels) {
            var lvl = dim.levels[li];
            for (var ai in lvl.attributes) {
              var attr = angular.copy(lvl.attributes[ai]);
              attr.dimension = dim;
              attr.level = lvl;
              attr.type = 'attributes';
              if (slugifyFilter(dim.label) != slugifyFilter(attr.label)) {
                attr.subLabel = '' + attr.label;
              }
              attr.sortKey = '0' + dim.label + attr.label;
              attr.label = dim.label;
              attr.cardinality = lvl.cardinality;
              options.push(attr);
            }
          }
        }

        for (var ai in model.aggregates) {
          var agg = model.aggregates[ai];
          agg.type = 'aggregates';
          agg.sortKey = '1' + agg.name;
          options.push(agg);
        }

        for (var mi in model.measures) {
          var mea = model.measures[mi];
          mea.type = 'measures';
          mea.sortKey = '2' + mea.name;
          options.push(mea);
        }

        return options;
      }

      var sortOptions = function(a, b) {
        return a.label.localeCompare(b.label);
      }

      var makeAxes = function(state, options) {
        var axes = [];
        if (!cubesCtrl.queryModel) return [];

        for (var name in cubesCtrl.queryModel) {
          var axis = cubesCtrl.queryModel[name];
          axis.name = name;
          axis.sortId = axis.sortId || 1;
          axis.available = [];
          axis.active = [];

          axis.selected = asArray(state[name]);
          if (!axis.selected.length) {
            if (angular.isFunction(axis.defaults)) {
              axis.selected = axis.defaults(model);
            } else {
              axis.selected = asArray(axis.defaults);
            }
          }
          axis.available = axis.available.sort(sortOptions);
          axis.active = axis.active.sort(sortOptions);

          for (var i in options) {
            var opt = options[i];
            if (axis.selected.indexOf(opt.ref) != -1) {
              axis.active.push(opt);
            } else if (axis.types.indexOf(opt.type) != -1) {
              axis.available.push(opt);
            }
          }
          axes.push(axis);
        }

        return axes.sort(function(a, b) {
          return a.sortId - b.sortId;
        });
      };

      var makeFilterAttributes = function(options) {
        var filters = [];
        for (var i in options) {
          var opt = options[i];
          if (opt.type == 'attributes' && opt.cardinality != 'high') {
            if (opt.level.label_attribute == opt.name) {
              filters.push(opt);  
            }
          }
        }
        return filters.sort(sortOptions);
      };

      var refToDimension = function(ref) {
        return ref.split('.', 1);
      };

      var makeValues = function(ref, res) {
        return res.data.data.map(function(e) {
          return {
            label: e[ref],
            value: e[model.refKeys[ref]]
          };
        });
      };

      var getAttributeByRef = function(ref) {
        for (var i in $scope.filterAttributes) {
          var attr = $scope.filterAttributes[i];
          if (attr.ref == ref) {
            return attr;
          }
        }
      };

      var loadFilters = function(state) {
        var cuts = asArray(state.cut);
        for (var i in cuts) {
          var cut = cuts[i];
          if (cut.indexOf(':') != -1) {
            var ref = cut.split(':', 1)[0],
                values = cut.slice(ref.length + 1).split(';');
            for (var j in values) {
              $scope.addFilter(getAttributeByRef(ref), values[j]);
            }
          }
        }
      };

      $scope.addFilter = function(attr, value) {
        cubesCtrl.getDimensionMembers(refToDimension(attr.ref)).then(function(res) {
          $scope.filters.push({
            ref: attr.ref,
            attr: attr,
            value: value,
            values: makeValues(attr.ref, res)
          });
        });
      };

      $scope.removeFilter = function(filter) {
        var idx = $scope.filters.indexOf(filter);
        if (idx != -1) {
          $scope.filters.splice(idx, 1);
          $scope.updateFilters();
        }
      };

      $scope.setFilter = function(filter, item, value) {
        $scope.updateFilters();
      };

      $scope.updateFilters = function() {
        var filters = {};
        for (var i in $scope.filters) {
          var f = $scope.filters[i];
          if (angular.isUndefined(filters[f.ref])) {
            filters[f.ref] = [];
          }
          filters[f.ref].push(f.value);
        }
        var cuts = [];
        for (var ref in filters) {
          var values = filters[ref],
              value = values.join(';')
              cut = ref + ':' + value;
          cuts.push(cut);
        }
        $scope.state.cut = cuts;
        update();
      };

      $rootScope.$on(cubesCtrl.modelUpdate, function(event, mdl, state) {
        model = mdl;
        $scope.state = state;

        var options = makeOptions();
        $scope.axes = makeAxes(state, options);
        $scope.filterAttributes = makeFilterAttributes(options);
        $scope.filters = [];
        loadFilters(state);

      });
    }
  };
}]);
;
ngCubes.directive('cubesWorkspace', ['$location', function($location) {
  return {
    restrict: 'EA',
    scope: {
      slicer: '@',
      cube: '@'
    },
    templateUrl: 'angular-cubes-templates/workspace.html',
    link: function(scope, element, attrs) {
      var getActiveVisualization = function() {
        var active;
        scope.visualizations.some(function(v) {
          if(v.view == scope.view) {
            active = v;
            return true;
          }
        });
        return active;
      }
      scope.state = {};
      scope.visualizationHead = {
        name: 'Visulization',
        icon: 'fa-eye',
        visible: false
      }
      scope.visualizations = [
        {
          name: 'Treemap',
          icon: 'fa-th-large',
          view: 'treemap',
          visible: true
        },
        {
          name: 'Barchart',
          icon: 'fa-bar-chart',
          view: 'barchart',
          visible: true
        },
        {
          name: 'Flow diagram',
          icon: 'fa-random',
          view: 'sankey',
          visible: true
        }
      ];
      scope.view = $location.search().view || 'facts';
      scope.activeVisualization = getActiveVisualization() || scope.visualizationHead;

      scope.$watch('view', function(view) {
        if(view) {
          scope.activeVisualization = getActiveVisualization() || scope.visualizationHead;
        }
      });
      scope.setView = function(view) {
        var state = $location.search();
        state.view = view;
        $location.search(state);
      };
      scope.status = {
        isopen: false
      };
      scope.toggleDropdown = function($event, view) {
        $event.preventDefault();
        $event.stopPropagation();
        scope.status.isopen = !scope.status.isopen;
        scope.setView(view);
      };
    }
  };
}]);
;angular.module('ngCubes.templates', ['angular-cubes-templates/barchart.html', 'angular-cubes-templates/crosstab.html', 'angular-cubes-templates/cubes.html', 'angular-cubes-templates/facts.html', 'angular-cubes-templates/pager.html', 'angular-cubes-templates/panel.html', 'angular-cubes-templates/sankey.html', 'angular-cubes-templates/treemap.html', 'angular-cubes-templates/workspace.html']);

angular.module("angular-cubes-templates/barchart.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("angular-cubes-templates/barchart.html",
    "<div class=\"table-cubes\" ng-hide=\"queryLoaded\">\n" +
    "  <div class=\"alert alert-info\">\n" +
    "    <strong>You have not selected any data.</strong> Please choose a breakdown for\n" +
    "    your treemap.\n" +
    "  </div>\n" +
    "</div>\n" +
    "<div class=\"barchart-cubes\">\n" +
    "");
}]);

angular.module("angular-cubes-templates/crosstab.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("angular-cubes-templates/crosstab.html",
    "<div class=\"table-cubes\" ng-show=\"rows.length\">\n" +
    "  <table class=\"table table-bordered table-condensed\">\n" +
    "    <thead>\n" +
    "      <tr ng-repeat=\"x in columns[0]\">\n" +
    "        <th ng-repeat=\"r in rows[0]\"></th>\n" +
    "        <th ng-repeat=\"c in columns\">\n" +
    "          {{c[$parent.$index]}}\n" +
    "        </th>\n" +
    "      </tr>\n" +
    "    </thead>\n" +
    "    <tbody>\n" +
    "      <tr ng-repeat=\"row in rows\">\n" +
    "        <th ng-repeat=\"r in row\">\n" +
    "          {{r}}\n" +
    "        </th>\n" +
    "        <td ng-repeat=\"val in table[$index] track by $index\" class=\"numeric\">\n" +
    "          {{val | numeric}}\n" +
    "        </td>\n" +
    "      </tr>\n" +
    "    </tbody>\n" +
    "  </table>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"table-cubes\" ng-hide=\"rows.length || !queryLoaded\">\n" +
    "  <div class=\"alert alert-info\">\n" +
    "    <strong>You have not selected any data.</strong> Please choose a set of rows \n" +
    "    and columns to generate a cross-table.\n" +
    "  </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("angular-cubes-templates/cubes.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("angular-cubes-templates/cubes.html",
    "<div class=\"cubes-frame\" ng-transclude>\n" +
    "</div>\n" +
    "");
}]);

angular.module("angular-cubes-templates/facts.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("angular-cubes-templates/facts.html",
    "<div class=\"table-cubes\" ng-show=\"data\">\n" +
    "  <table class=\"table table-bordered table-striped table-condensed\">\n" +
    "    <thead>\n" +
    "      <tr>\n" +
    "        <th ng-repeat-start=\"c in columns\" class=\"title\">\n" +
    "          {{ c.header }}\n" +
    "          <span class=\"sublabel\" ng-hide=\"c.hide\">{{ c.label }}</span>\n" +
    "        </th>\n" +
    "        <th ng-repeat-end class=\"operations\" ng-switch=\"getSort(c.ref).direction\">\n" +
    "          <span ng-switch-when=\"desc\" ng-click=\"pushSort(c.ref, 'asc')\" class=\"ng-link\">\n" +
    "            <i class=\"fa fa-sort-desc\"></i>\n" +
    "          </span>\n" +
    "          <span ng-switch-when=\"asc\" ng-click=\"pushSort(c.ref, 'desc')\" class=\"ng-link\">\n" +
    "            <i class=\"fa fa-sort-asc\"></i>\n" +
    "          </span>\n" +
    "          <span ng-switch-default ng-click=\"pushSort(c.ref, 'desc')\" class=\"ng-link\">\n" +
    "            <i class=\"fa fa-sort\"></i>\n" +
    "          </span>\n" +
    "        </th>\n" +
    "      </tr>\n" +
    "    </thead>\n" +
    "    <tbody>\n" +
    "      <tr ng-repeat=\"row in data\">\n" +
    "        <td ng-repeat=\"c in columns\" ng-class=\"{'numeric': c.numeric}\" class=\"simple\"\n" +
    "          colspan=\"2\">\n" +
    "          <span ng-if=\"c.numeric\">\n" +
    "            {{ row[c.ref] | numeric }}\n" +
    "          </span>\n" +
    "          <span ng-if=\"!c.numeric\">\n" +
    "            {{ row[c.ref] }}\n" +
    "          </span>\n" +
    "        </td>\n" +
    "      </tr>\n" +
    "    </tbody>\n" +
    "  </table>\n" +
    "</div>\n" +
    "<cubes-pager context=\"pagerCtx\"></cubes-pager>\n" +
    "");
}]);

angular.module("angular-cubes-templates/pager.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("angular-cubes-templates/pager.html",
    "<ul ng-show=\"showPager\" class=\"pagination pagination-sm\">\n" +
    "  <li ng-class=\"{'disabled': !hasPrev}\">\n" +
    "    <a class=\"ng-link\" ng-click=\"setPage(current - 1)\">&laquo;</a>\n" +
    "  </li>\n" +
    "  <li ng-repeat=\"page in pages\" ng-class=\"{'active': page.current}\">\n" +
    "    <a class=\"ng-link\" ng-click=\"setPage(page.page)\">{{page.page + 1}}</a>\n" +
    "  </li>\n" +
    "  <li ng-class=\"{'disabled': !hasNext}\">\n" +
    "    <a class=\"ng-link\" ng-click=\"setPage(current + 1)\">&raquo;</a>\n" +
    "  </li>\n" +
    "</ul>\n" +
    "");
}]);

angular.module("angular-cubes-templates/panel.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("angular-cubes-templates/panel.html",
    "<div class=\"panel panel-default\" ng-repeat=\"axis in axes\">\n" +
    "  <div class=\"panel-heading\">\n" +
    "    <strong>{{axis.label}}</strong>\n" +
    "\n" +
    "    <div class=\"btn-group\" dropdown ng-show=\"axis.available.length\">\n" +
    "      &mdash;\n" +
    "      <a dropdown-toggle class=\"ng-link\">{{axis.addLabel}}</a>\n" +
    "      <ul class=\"dropdown-menu\" role=\"menu\">\n" +
    "        <li ng-repeat=\"opt in axis.available\">\n" +
    "          <a ng-click=\"add(axis, opt.ref)\">\n" +
    "            <strong>{{opt.label}}</strong>\n" +
    "            {{opt.subLabel}}\n" +
    "          </a>\n" +
    "        </li>\n" +
    "      </ul>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "  <table class=\"table\">\n" +
    "    <tr ng-repeat=\"opt in axis.active\">\n" +
    "      <td colspan=\"2\">\n" +
    "        <div class=\"pull-right\">\n" +
    "          <span ng-switch=\"getSort(opt.ref).direction\">\n" +
    "            <a ng-switch-when=\"desc\" ng-click=\"pushSort(opt.ref, 'asc')\" class=\"ng-link ng-icon\">\n" +
    "              <i class=\"fa fa-sort-amount-desc\"></i></a>\n" +
    "            <a ng-switch-when=\"asc\" ng-click=\"pushSort(opt.ref, 'desc')\" class=\"ng-link ng-icon\">\n" +
    "              <i class=\"fa fa-sort-amount-asc\"></i></a>\n" +
    "            <a ng-switch-default ng-click=\"pushSort(opt.ref, 'desc')\" class=\"ng-link ng-icon\">\n" +
    "              <i class=\"fa fa-sort-amount-desc\"></i></a>\n" +
    "          </span>\n" +
    "          <a ng-click=\"remove(axis, opt.ref)\" ng-show=\"axis.multiple\" class=\"ng-link ng-icon\">\n" +
    "            <i class=\"fa fa-times\"></i></a>\n" +
    "        </div>\n" +
    "        <strong>{{opt.label}}</strong>\n" +
    "        {{opt.subLabel}}\n" +
    "      </td>\n" +
    "    </tr>\n" +
    "  </table>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "<div class=\"panel panel-default\">\n" +
    "  <div class=\"panel-heading\">\n" +
    "    <strong>Filters</strong>\n" +
    "\n" +
    "    <div class=\"btn-group\" dropdown ng-show=\"filterAttributes.length\">\n" +
    "      &mdash;\n" +
    "      <a dropdown-toggle class=\"ng-link\">add filter</a>\n" +
    "      <ul class=\"dropdown-menu\" role=\"menu\">\n" +
    "        <li ng-repeat=\"attr in filterAttributes\">\n" +
    "          <a ng-click=\"addFilter(attr)\">\n" +
    "            <strong>{{attr.label}}</strong>\n" +
    "            {{attr.subLabel}}\n" +
    "          </a>\n" +
    "        </li>\n" +
    "      </ul>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "  <table class=\"table table-panel\">\n" +
    "    <tbody ng-repeat=\"filter in filters\">\n" +
    "      <tr>\n" +
    "        <td colspan=\"2\">\n" +
    "          <strong>{{filter.attr.label}}</strong>\n" +
    "          {{filter.attr.subLabel}}\n" +
    "        </td>\n" +
    "        <td width=\"1%\">\n" +
    "          <span class=\"pull-right\">\n" +
    "            <a ng-click=\"removeFilter(filter)\" class=\"ng-link\">\n" +
    "              <i class=\"fa fa-times\"></i>\n" +
    "            </a>\n" +
    "          </span>\n" +
    "        </td>\n" +
    "      </tr>\n" +
    "      <tr class=\"adjoined\">\n" +
    "        <td width=\"1%\" class=\"middle\">\n" +
    "          is\n" +
    "        </td>\n" +
    "        <td width=\"95%\">\n" +
    "          <ui-select ng-model=\"filter.value\" disable-search=\"false\" on-select=\"setFilter(filter, $item, $model)\">\n" +
    "            <ui-select-match placeholder=\"Pick one...\">{{$select.selected.label}}</ui-select-match>\n" +
    "            <ui-select-choices repeat=\"v.value as v in filter.values | filter: $select.search track by $index\">\n" +
    "               <div ng-bind=\"v.label\"></div>\n" +
    "            </ui-select-choices>\n" +
    "          </ui-select>\n" +
    "        </td>\n" +
    "        <td class=\"middle\">\n" +
    "        </td>\n" +
    "      </tr>\n" +
    "    </tbody>\n" +
    "  </table>\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("angular-cubes-templates/sankey.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("angular-cubes-templates/sankey.html",
    "<div class=\"table-cubes\" ng-hide=\"queryLoaded\">\n" +
    "  <div class=\"alert alert-info\">\n" +
    "    <strong>You have not selected any data.</strong> Please choose a breakdown for\n" +
    "    both sides of the flow diagram.\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"alert alert-warning\" ng-show=\"cutoffWarning\">\n" +
    "  <strong>Too many links.</strong> The source and target you have selected\n" +
    "  have many different links, only the {{cutoff}} biggest are shown.\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"sankey-cubes\"></div>\n" +
    "");
}]);

angular.module("angular-cubes-templates/treemap.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("angular-cubes-templates/treemap.html",
    "<div class=\"table-cubes\" ng-hide=\"queryLoaded\">\n" +
    "  <div class=\"alert alert-info\">\n" +
    "    <strong>You have not selected any data.</strong> Please choose a breakdown for\n" +
    "    your treemap.\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"alert alert-warning\" ng-show=\"cutoffWarning\">\n" +
    "  <strong>Too many tiles.</strong> The breakdown you have selected contains many\n" +
    "  different categories, only the {{cutoff}} biggest are shown.\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"treemap-cubes\"></div>\n" +
    "");
}]);

angular.module("angular-cubes-templates/workspace.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("angular-cubes-templates/workspace.html",
    "<cubes slicer=\"{{slicer}}\" cube=\"{{cube}}\" state=\"state\">\n" +
    "  <div class=\"row\">\n" +
    "    <div class=\"col-md-12\">\n" +
    "      <div class=\"btn-group spaced pull-right\" role=\"group\">\n" +
    "        <a class=\"btn btn-default\"\n" +
    "          ng-class=\"{'active': view == 'facts'}\"\n" +
    "          ng-click=\"setView('facts')\">\n" +
    "          <i class=\"fa fa-table\"></i> Items\n" +
    "        </a>\n" +
    "        <a class=\"btn btn-default\"\n" +
    "          ng-class=\"{'active': view == 'crosstab'}\"\n" +
    "          ng-click=\"setView('crosstab')\">\n" +
    "          <i class=\"fa fa-cubes\"></i> Pivot table\n" +
    "        </a>\n" +
    "        <a class=\"btn btn-default\"\n" +
    "          ng-class=\"{'active': view == 'barchart'}\"\n" +
    "          ng-click=\"setView('barchart')\">\n" +
    "          <i class=\"fa fa-bar-chart\"></i> Bar chart\n" +
    "        </a>\n" +
    "        <a class=\"btn btn-default\"\n" +
    "          ng-class=\"{'active': view == 'treemap'}\"\n" +
    "          ng-click=\"setView('treemap')\">\n" +
    "          <i class=\"fa fa-th-large\"></i> Treemap\n" +
    "        </a>\n" +
    "        <a class=\"btn btn-default\"\n" +
    "          ng-class=\"{'active': view == 'sankey'}\"\n" +
    "          ng-click=\"setView('sankey')\">\n" +
    "          <i class=\"fa fa-random\"></i> Flow\n" +
    "        </a>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "  <div class=\"row\">\n" +
    "    <div class=\"col-md-9\">\n" +
    "      <div ng-if=\"view == 'crosstab'\">\n" +
    "        <cubes-crosstab></cubes-crosstab>\n" +
    "      </div>\n" +
    "      <div ng-if=\"view == 'facts'\">\n" +
    "        <cubes-facts></cubes-facts>\n" +
    "      </div>\n" +
    "      <div ng-if=\"view == 'treemap'\">\n" +
    "        <cubes-treemap></cubes-treemap>\n" +
    "      </div>\n" +
    "      <div ng-if=\"view == 'barchart'\">\n" +
    "        <cubes-barchart></cubes-barchart>\n" +
    "      </div>\n" +
    "      <div ng-if=\"view == 'sankey'\">\n" +
    "        <cubes-sankey></cubes-sankey>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "    <div class=\"col-md-3\">\n" +
    "\n" +
    "      <cubes-panel></cubes-panel>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</cubes>\n" +
    "");
}]);
