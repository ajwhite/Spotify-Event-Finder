(function () {
  var Spotify = require('./spotify');

  Spotify.getArtists().then(function (artists) {
    console.log('artists', artists);
  });
}).call(this);
