
ngCubes.directive('cubesTreemap', ['$rootScope', '$http', function($rootScope, $http) {
  return {
  restrict: 'EA',
  require: '^cubes',
  scope: {
    drilldown: '='
  },
  templateUrl: 'angular-cubes-templates/treemap.html',
  link: function(scope, element, attrs, cubesCtrl) {
    scope.queryLoaded = false;
    scope.columns = [];
    scope.rows = [];
    scope.table = [];

    var query = function(model, state) {
      var tile = asArray(state.tile)[0],
          area = asArray(state.area)[0];

      var q = cubesCtrl.getQuery();

      q.aggregates = area ? [area] : defaultArea(model);
      if (!tile) {
        return;
      }
      q.drilldown = [tile];
      q.page = 0;
      q.pagesize = 100;

      var dfd = $http.get(cubesCtrl.getApiUrl('aggregate'),
                          cubesCtrl.queryParams(q));
      dfd.then(function(res) {
        queryResult(res.data, q, model, state);
      });
    };

    var queryResult = function(data, q, model, state) {
      var tileRef = asArray(state.tile)[0],
          areaRef = asArray(state.area)[0];

      console.log(data);

      scope.queryLoaded = true;
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

    // console.log('crosstab init');
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

