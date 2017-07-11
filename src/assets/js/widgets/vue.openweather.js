var $ = require('jquery');
var APPID = '53f9d8e4213222cf517d86dc406d67fc';
var api = {};
var lat = 0;
var lon = 0;
var data = {};
if (navigator.geolocation) {
	navigator.geolocation.getCurrentPosition(function(location) {
		lat = location.coords.latitude;
		lon = location.coords.longitude;
	},function(err){
        if (err.code == 1) {
            // user said no!
			console.log('Access blocked from the geolocation service.');
        }
	});
}else{
	console.log('GeoLocation is not available for this browser.');
}

var Class = {
    _init_: function (element, callBack) {
        if(typeof element === "undefined") {
            console.log(
				'You need to specify a targeted HTML DOM element '+
				'"class" or "id" for the information to render into'
			);
            return callBack({'status':false});
        }
		var self = $(element);
        if (typeof self.html() !== "undefined") {
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(function(location) {
					lat = location.coords.latitude;
					lon = location.coords.longitude;
					api = require('./../api/api.openweather.js')({
						latitude: lat,
						longitude: lon,
						appid: APPID,
						id: ''
					});
					var data = {};
					api.methods.getLocationInformation(function(ret){
						if(ret){ // api returned data?
							data = ret; // assign the returned data to the data variable for later to be able to reactive update.
							new Vue({
								el: element,
								template: require('./../../../templates/widgets.html'),
								data: data,
								mounted: function () {},
								updated: function(){},
								methods: {
									showTime: function(unix_timestamp){
										var date = new Date(unix_timestamp*1000);
										// Hours part from the timestamp
										var hours = date.getHours();
										// Minutes part from the timestamp
										var minutes = "0" + date.getMinutes();
										// Seconds part from the timestamp
										var seconds = "0" + date.getSeconds();

										// Will display time in 10:30 format
										var formattedTime = hours + ':' + minutes.substr(-2);
										return formattedTime;
									},
									rotation: function(deg){
										return 'rotate('+deg+'deg)'
									},
									direction: function(deg){
									  if (deg>11.25 && deg<33.75){
										return "NNE";
									  }else if (deg>33.75 && deg<56.25){
										return "ENE";
									  }else if (deg>56.25 && deg<78.75){
										return "E";
									  }else if (deg>78.75 && deg<101.25){
										return "ESE";
									  }else if (deg>101.25 && deg<123.75){
										return "ESE";
									  }else if (deg>123.75 && deg<146.25){
										return "SE";
									  }else if (deg>146.25 && deg<168.75){
										return "SSE";
									  }else if (deg>168.75 && deg<191.25){
										return "S";
									  }else if (deg>191.25 && deg<213.75){
										return "SSW";
									  }else if (deg>213.75 && deg<236.25){
										return "SW";
									  }else if (deg>236.25 && deg<258.75){
										return "WSW";
									  }else if (deg>258.75 && deg<281.25){
										return "W";
									  }else if (deg>281.25 && deg<303.75){
										return "WNW";
									  }else if (deg>303.75 && deg<326.25){
										return "NW";
									  }else if (deg>326.25 && deg<348.75){
										return "NNW";
									  }else{
										return "N"; 
									  }
									},
									reloadInfo: function(event){
										var self = $(event.target);
										api.methods.getLocationInformation(function(ret){
											for(var i in ret){
												data[i] = ret[i];
											}
											self.parent().append('<div class="alert alert-info">Weather data updated</div>');
											setTimeout(function(){
												$('.alert.alert-info').remove();
											},2000);
										});
									}
								}
							});
						}else{
							self.html('<div class="alert alert-danger">Could not retrieve proper weather information. Please refresh your page and try again.</div>');
							return callBack({'status':false,'message':'API Call to openweather service failed.'});
						}
					});
				},function(err){
					if (err.code == 1) {
						// user said no!
						self.html('<div class="alert alert-danger">This app can not work without permissions to your current location!<br>You can change your settings by updating your browser privacy settings or clicking on the "i" (info) icon and setting the location to "Allow always".</div>');
						return callBack({'status':false,'message':'Denied access to location service.'});
					}
				});
			}else{
				self.html('<div class="alert alert-danger">Geolocation not supported by browser. Please use a browser that supports geolocation services. Please use a proper browser that supports HTML5 location services, eg: Chrome or Firefox</div>');
				return callBack({'status':false,'message':'geolocation not supported by browser'});
			}
        }else{
			console.log(
				'No DOM element could be found with tag: "' + element +'"'
			);
            return callBack({'status':false});
        }
    }
}
module.exports = Class;