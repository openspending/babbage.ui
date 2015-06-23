

ngCubes.directive('cubesPanel', ['$rootScope', function($rootScope) {
  return {
    restrict: 'EA',
    require: '^cubes',
    scope: {
    },
    templateUrl: 'angular-cubes-templates/panel.html',
    link: function($scope, $element, attrs, cubesCtrl) {
      $scope.state = {};
      $scope.axes = {};

      var update = function() {
        //$scope.state.page = 0;
        cubesCtrl.setState($scope.state);
      };

      $scope.add = function(axis, ref) {
        if (axis.selected.indexOf(ref) == -1) {
          axis.selected.push(ref);
          $scope.state[axis.name] = axis.selected;
          update();
        }
      };

      $scope.remove = function(axis, ref) {
        var i = axis.selected.indexOf(ref);
        if (i != -1) {
          axis.selected.splice(i, 1);
          $scope.state[axis.name] = axis.selected;
          update();
        }
      };

      var makeOptions = function(model) {
        var options = [];
        for (var di in model.dimensions) {
          var dim = model.dimensions[di];
          for (var li in dim.levels) {
            var lvl = dim.levels[li];
            for (var ai in lvl.attributes) {
              var attr = lvl.attributes[ai];
              attr.dimension = dim;
              attr.type = 'attributes';
              attr.sortKey = '1.' + dim.name + '.';
              if (attr.name != lvl.label_attribute) {
                attr.subLabel = attr.label;
                attr.sortKey = attr.sortKey + attr.name;
              }
              attr.label = dim.label;
              options.push(attr);
            }
          }
        }

        for (var ai in model.aggregates) {
          var agg = model.aggregates[ai];
          agg.type = 'aggregates';
          agg.sortKey = '2..' + agg.name;
          options.push(agg);
        }

        for (var mi in model.measures) {
          var mea = model.measures[mi];
          mea.type = 'measures';
          mea.sortKey = '3..' + mea.name;
          options.push(mea);
        }

        return options;
      }

      var sortOptions = function(a, b) {
        return a.sortKey.localeCompare(b.sortKey);
      }

      var makeAxes = function(state, model) {
        var axes = [],
            options = makeOptions(model);

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

          //console.log(axis);
          axes.push(axis);
        }

        return axes.sort(function(a, b) {
          return a.sortId - b.sortId;
        });
      };

      $rootScope.$on(cubesCtrl.modelUpdate, function(event, model, state) {
        $scope.state = state;
        $scope.axes = makeAxes(state, model);
      });
    }
  };
}]);
