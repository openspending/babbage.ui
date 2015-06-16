

ngCubes.directive('cubesPanel', ['$rootScope', function($rootScope) {
  return {
    restrict: 'EA',
    require: '^cubes',
    scope: {
    },
    templateUrl: 'angular-cubes-templates/panel.html',
    link: function($scope, $element, attrs, cubesCtrl) {
      $scope.model = null;
      $scope.state = {};

      var attributes = {}, usedAttributes = [];

      var update = function() {
        cubesCtrl.setState($scope.state);
        cubesCtrl.query();
      };

      $scope.getSelectedAggregates = function() {
        var aggregates = [];
        var src = $scope.model ?  $scope.model.aggregates || [] : [];
        for (var i in src) {
          if ($scope.state.aggregates.indexOf(src[i].name) != -1) {
            aggregates.push(src[i]);
          }
        }
        return aggregates;
      };

      $scope.getAvailableAggregates = function() {
        var aggregates = [];
        var src = $scope.model ? $scope.model.aggregates || [] : [];
        for (var i in src) {
          if ($scope.state.aggregates.indexOf(src[i].name) == -1) {
            aggregates.push(src[i]);
          }
        }
        return aggregates;
      };

      $scope.addAggregate = function(agg) {
        $scope.state.aggregates.push(agg.name);
        update();
      };

      $scope.removeAggregate = function(agg) {
        var i = $scope.state.aggregates.indexOf(agg.name);
        if (i != -1) {
          $scope.state.aggregates.splice(i, 1);
          update();
        }
      };

      $scope.getAvailableAttributes = function() {
        var available = {};
        for (var ref in attributes) {
          if (usedAttributes.indexOf(ref) == -1) {
            available[ref] = attributes[ref];
          }
        }
        return available;
      };

      $scope.getSelectedAttributes = function(axis) {
        var selected = {};
        for (var ref in attributes) {
          if ($scope.state[axis].indexOf(ref) != -1) {
            selected[ref] = attributes[ref];
          }
        }
        return selected;
      };

      $scope.hasAvailableAttributes = function() {
        for (var i in $scope.getAvailableAttributes()) {
          return true;
        }
        return false;
      };

      $scope.addAttribute = function(axis, ref) {
        $scope.state[axis].push(ref);
        update();
      };

      $scope.removeAttribute = function(axis, ref) {
        var i = $scope.state[axis].indexOf(ref);
        if (i != -1) {
          $scope.state[axis].splice(i, 1);
          update();
        }
      };

      $rootScope.$on(cubesCtrl.modelUpdate, function(event, model) {
        $scope.model = model;
        $scope.queryModel = cubesCtrl.queryModel;

        attributes = {};
        for (var di in model.dimensions) {
          var dim = model.dimensions[di];
          for (var li in dim.levels) {
            var lvl = dim.levels[li];
            for (var ai in lvl.attributes) {
              var attr = lvl.attributes[ai];
              attr.dimension = dim;
              attributes[attr.ref] = attr;
            }
          }
        }

      });

      $rootScope.$on(cubesCtrl.stateUpdate, function(event, state) {
        // get list of currently active aggregates.
        state.aggregates = asArray(state.aggregates);
        if ($scope.model && !state.aggregates.length) {
          for (var j in $scope.model.aggregates) {
            state.aggregates.push($scope.model.aggregates[j].name); 
          }
        }

        // get list of currently used attributes
        usedAttributes = [];
        for (var axis in $scope.queryModel) {
          state[axis] = asArray(state[axis]);
          for (var i in state[axis]) {
            usedAttributes.push(state[axis][i]);
          }
        }

        $scope.state = state;
      });

      cubesCtrl.registerQueryProcessor(function(q, state) {
        q.aggregates = q.aggregates.concat(state.aggregates);
        for (var axis in $scope.queryModel) {
          q.drilldown = q.drilldown.concat(state[axis]);  
        }
        return q;
      });

    }
  };
}]);
