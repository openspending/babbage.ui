
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
      $scope.create = {}

      var selectedAggregates = function()  {
        var selected = $scope.state.aggregates ? $scope.state.aggregates : [];
        return angular.isArray(selected) ? selected : [selected];
      }

      $scope.getSelectedAggregates = function() {
        var aggregates = [], selected = selectedAggregates();
        var src = $scope.model ?  $scope.model.aggregates || [] : [];
        for (var i in src) {
          if (selected.indexOf(src[i].name) != -1) {
            aggregates.push(src[i]);
          }
        }
        return aggregates;
      };

      $scope.getAvailableAggregates = function() {
        var aggregates = [], selected = selectedAggregates();
        var src = $scope.model ?  $scope.model.aggregates || [] : [];
        for (var i in src) {
          if (selected.indexOf(src[i].name) == -1) {
            aggregates.push(src[i]);
          }
        }
        return aggregates;
      };

      $scope.addAggregate = function() {
        var selected = selectedAggregates();
        selected.push($scope.create.aggregate);
        $scope.state.aggregates = selected;
        $scope.create.aggregate = null;
        cubesCtrl.setState($scope.state);
        cubesCtrl.query();
      };

      $rootScope.$on(cubesCtrl.modelUpdate, function(event, model) {
        $scope.model = model;
      });

      $rootScope.$on(cubesCtrl.stateUpdate, function(event, state) {
        $scope.state = state;
        
        var aggs = $scope.getAvailableAggregates();
        if (aggs.length && !$scope.create.aggregate) {
          $scope.create.aggregate = aggs[0].name;
        }
      });
    }
  };
}]);
