import GeoViewComponent from '../../../components/geoview'
import _ from 'lodash';
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
            downloader: '=?'
          },
          template: require('./template.html'),
          replace: false,
          link: function($scope) {
            $scope.status = {
              isLoading: true,
              isEmpty: false,
              isCutOff: false,
              cutoff: 0
            };

            var component = new GeoViewComponent();

            component.on('loading', () => {
              $scope.status.isLoading = true;
              $scope.status.isEmpty = false;
              $scope.status.isCutOff = false;
              $scope.$applyAsync();
            });
            component.on('ready', (component, data, error) => {
              $scope.status.isLoading = false;
              $scope.status.isEmpty = !(_.isObject(data) &&
                (data.cells.length > 0));
              $scope.status.isCutOff = false;
              $scope.$applyAsync();
            });

            $q((resolve, reject) => {
              component.downloader = $scope.downloader;
              component.getGeoMapData(
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