'use strict';

angular.module('cashewApp.version', [
  'cashewApp.version.interpolate-filter',
  'cashewApp.version.version-directive'
])

.value('version', '1.0.0');
