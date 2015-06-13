
ngCubes.directive('cubesWorkspace', ['$location', function($location) {
  return {
    restrict: 'EA',
    scope: {
      slicer: '@',
      cube: '@'
    },
    templateUrl: 'angular-cubes-templates/workspace.html',
    link: function(scope, element, attrs, cubesCtrl) {
      scope.state = {};

      // var unpack = function(obj, key, value) {
      //   var parts = key.split('.'), first = parts[0],
      //       rem = parts.splice(1).join('.');
      //   if (rem.length == 0) {
      //     obj[first] = value;
      //   } else {
      //     obj[first] = unpack(obj[first] || {}, rem, value);
      //   }
      //   return obj;
      // };

      // var pack = function(obj, src, prefix) {
      //   for (var el in src) {
      //     var val = src[el], name = el;
      //     if (prefix) {
      //       name = prefix + '.' + name;
      //     }
      //     if (angular.isObject(val)) {
      //       obj = pack(obj, val, name);
      //     } else {
      //       obj[name] = val;
      //     }
      //   }
      //   return obj;
      // };

      var loadState = function() {
        // var raw = $location.search(), state = {};
        // for (var key in raw) {
        //   state = unpack(state, key, raw[key]);
        // }
        // scope.state = state;
        scope.state = $location.search();
      };

      scope.updateState = function(state) {
        //$location.search(pack({}, state, null));
        $location.search(state);
      };

      loadState();
    }
  };
}]);
