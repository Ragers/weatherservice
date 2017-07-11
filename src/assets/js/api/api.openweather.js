var $ = require('jquery');

module.exports = function(options) {
    var settings = $.extend({
        url: 'http://api.openweathermap.org/data/',
        version: '2.5',
		endpoint: '/weather',
		latitude: '',
		longitude: '',
		appid: '',
        methods: {
			getLocationInformation: function(callBack){
				require('es6-promise').polyfill();
				var axios = require('axios');
				if(settings.appid==''){
					console.log('Please supply your APPID in the configuration');
					return callBack(false);
				}
				if(settings.latitude==''){
					console.log('The latitude of the user could not be determined');
					return callBack(false);
				}
				if(settings.longitude==''){
					console.log('The longitude of the user could not be determined');
					return callBack(false);
				}
				axios.get(
					settings.url + 
					settings.version + 
					settings.endpoint +
					'?lat='+settings.latitude+
					'&lon='+settings.longitude+
					'&APPID='+settings.appid+
					'&units=metric',
					{}
				).then(function (response) {
					if(response.data == ""){
						return callBack(response);
					}
					return callBack(response.data);
				}).catch(function (error) {
					if(typeof error.response !== "undefined" &&
						typeof error.response.data!== "undefined" &&
						typeof error.response.data.error !== "undefined"
					){
						return callBack(error.response.data);
					}
					return callBack(false);
				});
			}
		}
	},options);
	return settings;
}
		