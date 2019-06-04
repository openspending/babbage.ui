import GeoViewComponent from '../../../components/geoview'
import * as _ from 'lodash'
import {createI18NMapper} from '../utils'
import directive from './directive'

export class GeoViewDirective {
  init(angularModule) {
    directive(angularModule);

    angularModule.directive('geoView', [
      '$q', '$sce',
      function($q, $sce) {
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
            downloader: '=?',
            formatValue: '=?',
            messages: '=?'
          },
          template: require('./template.html'),
          replace: false,
          link: function($scope) {
            $scope.status = {
              isLoading: true,
              isEmpty: false,
              hasError: false,
              isCutOff: false,
              cutoff: 0
            };

            $scope.i18n = createI18NMapper($scope.messages);
            $scope.$watch('messages', function(newValue, oldValue) {
              if (newValue !== oldValue) {
                $scope.i18n = createI18NMapper($scope.messages);
              }
            }, true);
            $scope.trustAsHtml = function(value) {
              return $sce.trustAsHtml(value);
            };

            let component = new GeoViewComponent();
            $scope.component = component;

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
              $scope.status.hasError = !!error;
              $scope.error = !!error && error.message;
              $scope.$applyAsync();
            });

            $q((resolve, reject) => {
              component.downloader = $scope.downloader;
              $scope.$emit('babbage-ui.initialize', component);
              component.getGeoMapData(
                $scope.endpoint,
                $scope.cube,
                $scope.state
              ).then(resolve).catch(reject)
            })
            .then((result) => {
              $scope.values = result;
            });

            $scope.$on('babbage-ui.internal.geoview-ready', function($event) {
              $event.stopPropagation();
              $scope.$emit('babbage-ui.ready', component, $scope.values);
            });

            $scope.$emit('babbage-ui.create');
            $scope.$on('$destroy', function() {
              $scope.$emit('babbage-ui.destroy');
            });
          }
        }
      }
    ])
  }
}

export default GeoViewDirective