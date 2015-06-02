(function () {
  var Spotify = require('./spotify'),
      Songkick = require('./songkick');

  // Songkick.getEvents();
  // return;

  Spotify.getArtists().then(function (artists) {
    console.log('artists', artists);
  });
}).call(this);
