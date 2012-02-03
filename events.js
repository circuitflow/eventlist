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
		var query = $("#search-term").val();
		var type = $(this).attr("id");
		if (query !== "") {
			switch (type) {
				case "search-user":
					var userArtists = [];
					var userUrl = songkick_url + "/users/" + query + "/calendar.json?reason=attendance&apikey=" + songkick_apikey + "&jsoncallback=?";	
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
					
							var calendarEntries = data.resultsPage.results.calendarEntry;
							for (var i = 0; i < calendarEntries.length; i++) {
								if (calendarEntries[i].reason.trackedArtist) {
									var trackedArtists = calendarEntries[i].reason.trackedArtist;
									for (var j = 0; j < trackedArtists.length; j++) {
										userArtists.push(trackedArtists[j].displayName);
									}
								} else {
									var performers = calendarEntries[i].event.performance;
									for (var k = 0; k < performers.length; k++) {
										userArtists.push(performers[k].artist.displayName);
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
							$("#search-results").append("<h2 id='city'>" + query + "</h2>");
							$("#search-results").append(cityPlaylistArt.node);
							$("#search-results .sp-player").append(citySaveButton);
							$("#search-results").append(cityPlaylistList.node);
					
							var cityEventUrl = songkick_url + "/metro_areas/" + cityId + "/calendar.json?apikey=" + songkick_apikey + "&jsoncallback=?";
							// cityEventUrl = songkick_url + "/events.json?apikey=" + songkick_apikey + "&location=sk:" + cityId + "&min_date=" + dateRange[0] + "&max_date=" + dateRange[1] + "&jsoncallback=?";
			
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
		console.log('save');
		var myCityPlaylist = new models.Playlist("Upcoming Events for " + $("#city").text() + ": " + getDate());
		$.each(cityPlaylist.data.all(),function(i,track){
			myCityPlaylist.add(track);
		});
		e.preventDefault();
	});	

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