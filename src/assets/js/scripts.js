var $ = require('jquery');
require('./common/fancybox3.js');
// require the vue component for openweather
var openweather = require('./widgets/vue.openweather.js');
// instantiate the openweather component
openweather._init_('#showWidgets',function(ret){});