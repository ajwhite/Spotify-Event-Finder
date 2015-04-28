module.exports = (function () {
  var Config = require('./config'),
      SpotifyApi = require('spotify-web-api-node'),
      Promise = require('bluebird'),
      _ = require('lodash'),
      spotifySdk;

  spotifySdk  = new SpotifyApi({
    clientId: Config.spotify.client_id,
    clientSecret: Config.spotify.client_secret,
    redirectUri: Config.spotify.redirect_uri
  });
  spotifySdk.setAccessToken(Config.spotify.access_token);

  function getArtists () {
    var me;
    return spotifySdk.getMe().then(function (data) {
      me = data.body;
      return spotifySdk.getUserPlaylists(data.body.id);
    }).then(function (data) {
      var promises = _.map(data.body.items, function (playlist) {
        return spotifySdk.getPlaylistTracks(me.id, playlist.id, {limit: 100, offset: 0});
      });
      return Promise.settle(promises);
      // return spotifySdk.getPlaylistTracks(me.id, playlists[0].id);
    }).then(function (data) {
      return _.reduce(data, function (collection, response) {
        if (response.isFulfilled()) {
          collection.push(response.value());
        }
        return collection;
      }, []);
    }).then(function (data) {
      var playlistTracks,
          artistMap,
          artistCollection;

      playlistTracks = _.map(data, function (response) {
        return response.body;
      }).map(function (tracks) {
        return _.map(tracks.items, function (item) {
          return item.track
        });
      });
      playlistTracks = _.flatten(playlistTracks);

      artistMap = _.reduce(playlistTracks, function (map, track) {
        _.each(track.artists, function (artist) {
          if (map[artist.name]) {
            map[artist.name]++;
          } else {
            map[artist.name] = 1;
          }
        });
        return map;
      }, {});

      lookupCollection = _.reduce(artistMap, function (collection, count, artist) {
        if (count > 1) {
          collection.push(artist);
        }
        return collection;
      }, []);
      return lookupCollection;
    });
  }

  return {
    getArtists: getArtists
  };
}).call(this);
