import GeoViewComponent from '../../../components/geoview'
import directive from './directive';

export class GeoViewDirective {
  init(angularModule) {
    directive(angularModule);

    angularModule.directive('geoView', [
      '$q',
      function($q) {
        return {
          restrict: 'EA',
          scope: {
            endpoint: '@',
            cosmoEndpoint: '@',
            cube: '@',
            type: '@',
            state: '=',
            countryCode: '@',
            currencySign: '@?',
          },
          template: '<geoview class="geoview-container" country-code="{{ countryCode }}" ' +
          'currency-sign="{{ currencySign }}" cosmo-endpoint="{{ cosmoEndpoint }}" ' +
          'values="values"></geoview>',
          replace: false,
          link: function($scope, element) {
            var geoView = new GeoViewComponent();

            $q((resolve, reject) => {
              geoView.getGeoMapData(
                $scope.endpoint,
                $scope.cube,
                $scope.state
              ).then(resolve).catch(reject)
            })
            .then((result) => {
              $scope.values = result;
            });

          }
        }
      }
    ])
  }
}

export default GeoViewDirective