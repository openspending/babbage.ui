import ChartComponent from '../../../components/chart'

export class ChartDirective {
  init(angularModule) {
    angularModule.directive('chart', [
      '$window',
      function($window) {
        return {
          restrict: 'EA',
          scope: {
            endpoint: '@',
            cube: '@',
            type: '@',
            state: '='
          },
          template: require('./template.html'),
          replace: false,
          link: function($scope, element) {
            var chart = new ChartComponent();
            var wrapper = element.find('.chart-babbage')[0];

            chart.build($scope.type, $scope.endpoint, $scope.cube, $scope.state, wrapper);

            $scope.cutoffWarning = false;
            $scope.queryLoaded = true;
          }
        }
      }
    ])
  }
}

export default ChartDirective