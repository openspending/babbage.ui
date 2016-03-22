import GeoViewComponent from '../../../components/geoview'
import directive from './directive';

export class GeoViewDirective {
  init(angularModule) {
    directive(angularModule);

    angularModule.directive('geoView', [
      '$window',
      function($window) {
        return {
          restrict: 'EA',
          scope: {
            endpoint: '@',
            cube: '@',
            type: '@',
            state: '=',
            countryCode: '@',
            currencySign: '@?',
          },
          template: '<geoview country-code="{{ countryCode }}" ' +
          'currency-sign="{{ currencySign }}" values="values"></geoview>',
          replace: false,
          link: function($scope, element) {
            var geoView = new GeoViewComponent();

            geoView.getGeoMapData(
              $scope.endpoint,
              $scope.cube,
              $scope.state
            ).then((result) => {
              $scope.values = result;
            });

          }
        }
      }
    ])
  }
}

export default GeoViewDirective