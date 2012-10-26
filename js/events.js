var sp = getSpotifyApi(1),
	models = sp.require("sp://import/scripts/api/models"),
	views = sp.require("sp://import/scripts/api/views"),
	ui = sp.require("sp://import/scripts/ui"),
	player = models.player,
	library = models.library,
	application = models.application,
	playerImage = new views.Player();

var songkick_apikey = "insert-your-songkick-api-key-here";
var songkick_url = "http://api.songkick.com/api/3.0";

var userPlaylist = new models.Playlist();
var userPlaylistList = new views.List(userPlaylist);

var cityPlaylist = new models.Playlist();
var cityPlaylistList = new views.List(cityPlaylist);

$(function(){
	
	$("button").click(function(e){
		var type = $(this).attr("id");
		var dateRangeFrom = $("#from").val();
		var dateRangeTo = $("#to").val();
		var query = $("#search-term").val();
		if (query !== "") {
			switch (type) {
				case "search-user":
					var userArtists = [];
					var userUrl;
					
					if (dateRangeFrom !== "" && dateRangeTo !== "") {
						userUrl = songkick_url + "/users/" + query + "/events.json?attendance=all" + "&min_date=" + dateRangeFrom + "&max_date=" + dateRangeTo + "&apikey=" + songkick_apikey + "&jsoncallback=?";
					} else {
						// var userUrl = songkick_url + "/users/" + query + "/calendar.json?reason=attendance&apikey=" + songkick_apikey + "&jsoncallback=?";
						userUrl = songkick_url + "/users/" + query + "/events.json?attendance=all&apikey=" + songkick_apikey + "&jsoncallback=?";
					}
					// console.log(userUrl);
					
					var userSaveButton = "<button id='saveUserPlaylist' class='add-playlist button icon'>Save As Playlist</button>";
					var userPlaylistArt = new views.Player();
					
					$("#search-results").empty();
					userPlaylist = new models.Playlist();
					userPlaylistList = new views.List(userPlaylist);
					userPlaylistList.node.classList.add("temporary");					
					userPlaylistArt.context = userPlaylist;			
					
					var userQuery = $.getJSON(userUrl, function(data) {
						if (data && data.resultsPage.totalEntries > 0) {
							$("#search-results").append("<h2 id='user'>" + query + "</h2>");
							$("#search-results").append(userPlaylistArt.node);
							$("#search-results .sp-player").append(userSaveButton);
							$("#search-results").append(userPlaylistList.node);
							
							var userEvents = data.resultsPage.results.event;
							for (var i = 0; i < userEvents.length; i++) {
								if (userEvents[i].performance) {
									var performers = userEvents[i].performance;
									for (var j = 0; j < performers.length; j++) {
										if (!userArtists.inArray(performers[j].artist.displayName)) {
											userArtists.push(performers[j].artist.displayName);
										}
									}
								}
							}
						} else {
							$("#search-results").append("<h2>User not found.</h2>");
						}
					});
					userQuery.complete(function() {
						for (var i = 0; i < userArtists.length; i++) {
							getTracks(userArtists[i], userPlaylist); 
						}
					});
				break;
				case "search-city":
					var cityId = "";
					var cityArtists = [];
					var cityUrl = songkick_url + "/search/locations.json?query=" + query + "&apikey=" + songkick_apikey + "&jsoncallback=?";
					var citySaveButton = "<button id='saveCityPlaylist' class='add-playlist button icon'>Save As Playlist</button>";
					var cityPlaylistArt = new views.Player();
					
					$("#search-results").empty();
					cityPlaylist = new models.Playlist();
					cityPlaylistList = new views.List(cityPlaylist);
					cityPlaylistList.node.classList.add("temporary");
					cityPlaylistArt.context = cityPlaylist;			
							
					var cityQuery = $.getJSON(cityUrl, function(data) {
						if (data && data.resultsPage.totalEntries > 0 && data.resultsPage.results.location) {
							cityId = data.resultsPage.results.location[0].metroArea.id;
						}
					});
					cityQuery.complete(function() {
						if (cityId) {
							var cityEventUrl;
							
							$("#search-results").append("<h2 id='city'>" + query + "</h2>");
							$("#search-results").append(cityPlaylistArt.node);
							$("#search-results .sp-player").append(citySaveButton);
							$("#search-results").append(cityPlaylistList.node);
							
							if (dateRangeFrom !== "" && dateRangeTo !== "") {
								cityEventUrl = songkick_url + "/events.json?apikey=" + songkick_apikey + "&location=sk:" + cityId + "&min_date=" + dateRangeFrom + "&max_date=" + dateRangeTo + "&jsoncallback=?";
							} else {
								cityEventUrl = songkick_url + "/metro_areas/" + cityId + "/calendar.json?apikey=" + songkick_apikey + "&jsoncallback=?";
							}
							// console.log(cityEventUrl);
							
							var cityEventsQuery = $.getJSON(cityEventUrl, function(data) {
								if (data && data.resultsPage.totalEntries > 0) {
									var cityEvents = data.resultsPage.results.event;
									for (var i = 0; i < cityEvents.length; i++) {
										if (cityEvents[i].performance) {
											var performers = cityEvents[i].performance;
											for (var j = 0; j < performers.length; j++) {
												if (!cityArtists.inArray(performers[j].artist.displayName)) {
													cityArtists.push(performers[j].artist.displayName);
												}
											}
										}
									}
								}
							});
		
							cityEventsQuery.complete(function() {
								for (var i = 0; i < cityArtists.length; i++) {
									getTracks(cityArtists[i], cityPlaylist); 
								}
							});
						} else {
							$("#search-results").append("<h2>City not found.</h2>");
						}
					});
				break;
				case "search-venue":
					var venueId = "";
					var venueArtists = [];
					var venueUrl = songkick_url + "/search/venues.json?query=" + query + "&apikey=" + songkick_apikey + "&jsoncallback=?";
					var venueSaveButton = "<button id='saveVenuePlaylist' class='add-playlist button icon'>Save As Playlist</button>";
					var venuePlaylistArt = new views.Player();
					
					$("#search-results").empty();
					venuePlaylist = new models.Playlist();
					venuePlaylistList = new views.List(venuePlaylist);
					venuePlaylistList.node.classList.add("temporary");
					venuePlaylistArt.context = venuePlaylist;			
							
					var venueQuery = $.getJSON(venueUrl, function(data) {
						if (data && data.resultsPage.totalEntries > 0 && data.resultsPage.results.venue) {
							venueId = data.resultsPage.results.venue[0].id;
						}
					});
					venueQuery.complete(function() {
						if (venueId) {
							var venueEventUrl;
							
							$("#search-results").append("<h2 id='venue'>" + query + "</h2>");
							$("#search-results").append(venuePlaylistArt.node);
							$("#search-results .sp-player").append(venueSaveButton);
							$("#search-results").append(venuePlaylistList.node);
							
							if (dateRangeFrom !== "" && dateRangeTo !== "") {
								venueEventUrl = songkick_url + "/venues/" + venueId + "/calendar.json?apikey=" + songkick_apikey + "&min_date=" + dateRangeFrom + "&max_date=" + dateRangeTo + "&jsoncallback=?";
							} else {
								venueEventUrl = songkick_url + "/venues/" + venueId + "/calendar.json?apikey=" + songkick_apikey + "&jsoncallback=?";
							}
							// console.log(venueEventUrl);
							
							var venueEventsQuery = $.getJSON(venueEventUrl, function(data) {
								if (data && data.resultsPage.totalEntries > 0) {
									var venueEvents = data.resultsPage.results.event;
									for (var i = 0; i < venueEvents.length; i++) {
										if (venueEvents[i].performance) {
											var performers = venueEvents[i].performance;
											for (var j = 0; j < performers.length; j++) {
												if (!venueArtists.inArray(performers[j].artist.displayName)) {
													venueArtists.push(performers[j].artist.displayName);
												}
											}
										}
									}
								}
							});
		
							venueEventsQuery.complete(function() {
								for (var i = 0; i < venueArtists.length; i++) {
									getTracks(venueArtists[i], venuePlaylist); 
								}
							});
						} else {
							$("#search-results").append("<h2>Venue not found.</h2>");
						}
					});
				break;					
			}
		}
	});
	$("#saveUserPlaylist").live('click',function(e){
		var myUserPlaylist = new models.Playlist("Upcoming Events for " + $("#user").text() + ": " + getDate());
		$.each(userPlaylist.data.all(),function(i,track){
			myUserPlaylist.add(track);
		});
		e.preventDefault();
	});
	$("#saveCityPlaylist").live('click',function(e){
		var myCityPlaylist = new models.Playlist("Upcoming Events for " + $("#city").text() + ": " + getDate());
		$.each(cityPlaylist.data.all(),function(i,track){
			myCityPlaylist.add(track);
		});
		e.preventDefault();
	});	
	$("#saveVenuePlaylist").live('click',function(e){
		var myVenuePlaylist = new models.Playlist("Upcoming Events for " + $("#venue").text() + ": " + getDate());
		$.each(venuePlaylist.data.all(),function(i,track){
			myVenuePlaylist.add(track);
		});
		e.preventDefault();
	});	
	
	var dates = $( "#from, #to" ).datepicker({
		defaultDate: "+1w",
		changeMonth: true,
		numberOfMonths: 1,
		onSelect: function( selectedDate ) {
			var option = this.id == "from" ? "minDate" : "maxDate",
				instance = $( this ).data( "datepicker" ),
				date = $.datepicker.parseDate(
					instance.settings.dateFormat ||
					$.datepicker._defaults.dateFormat,
					selectedDate, instance.settings );
			dates.not( this ).datepicker( "option", option, date );
		}
	});
	$( "#from, #to" ).datepicker( "option", "dateFormat", 'yy-mm-dd' );
});

/*
 * General Utilities
 */

function getTracks(artist, playlist) {
	var search = new models.Search('artist:"' + artist + '"');		
	search.pageSize = 5;
	search.observe(models.EVENT.CHANGE, function() {
		if(search.tracks.length) {
			$.each(search.tracks,function(index,track){
				playlist.add(models.Track.fromURI(track.uri));
			});				
		} else {
			// console.log('No tracks in results: ', artist);
		}
	});
	search.appendNext();
}

function getDate() {
	var d = new Date($.now());
	var curr_date = d.getDate();
	var curr_month = d.getMonth() + 1;
	var curr_year = d.getFullYear();
	return curr_year + "-" + (curr_month < 10 ? "0" : "") + curr_month + "-" + (curr_date < 10 ? "0" : "") + curr_date;
}

Array.prototype.inArray = function(){ 
  var i; 
  for(i=0; i < this.length; i++){ 
    if(this[i] === arguments[0]) 
      return true; 
  }
  return false; 
}; 