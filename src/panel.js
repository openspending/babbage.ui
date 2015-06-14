
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

      var selectedAggregates = [];

      var update = function() {
        cubesCtrl.setState($scope.state);
        cubesCtrl.query();
      };

      $scope.getSelectedAggregates = function() {
        var aggregates = [], selected = selectedAggregates;
        var src = $scope.model ?  $scope.model.aggregates || [] : [];
        for (var i in src) {
          if (selected.indexOf(src[i].name) != -1) {
            aggregates.push(src[i]);
          }
        }
        return aggregates;
      };

      $scope.getAvailableAggregates = function() {
        var aggregates = [], selected = selectedAggregates;
        var src = $scope.model ?  $scope.model.aggregates || [] : [];
        for (var i in src) {
          if (selected.indexOf(src[i].name) == -1) {
            aggregates.push(src[i]);
          }
        }
        return aggregates;
      };

      $scope.addAggregate = function(agg) {
        selectedAggregates.push(agg.name);
        $scope.state.aggregates = selectedAggregates;
        update();
      };

      $scope.removeAggregate = function(agg) {
        var i = $scope.state.aggregates.indexOf(agg.name);
        if (i != -1) {
          console.log(i, $scope.state.aggregates);
          $scope.state.aggregates.splice(i, 1);
          update();
        }
      };

      $rootScope.$on(cubesCtrl.modelUpdate, function(event, model) {
        $scope.model = model;
      });

      $rootScope.$on(cubesCtrl.stateUpdate, function(event, state) {
        $scope.state = state;

        selectedAggregates = $scope.state.aggregates ? $scope.state.aggregates : [];
        selectedAggregates = angular.isArray(selectedAggregates) ? selectedAggregates : [selectedAggregates];
        if ($scope.model && !selectedAggregates.length) {
          for (var j in $scope.model.aggregates) {
            selectedAggregates.push($scope.model.aggregates[j].name); 
          }
        }
        $scope.state.aggregates = selectedAggregates;
      });
    }
  };
}]);
