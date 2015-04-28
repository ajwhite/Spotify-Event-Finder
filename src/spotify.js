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

    // get the user profile
    return spotifySdk.getMe().then(function (data) {
      me = data.body;
      // get the user playsts
      return spotifySdk.getUserPlaylists(data.body.id);
    })

    // get the tracks for each playlist
    .then(function (data) {
      var promises = _.map(data.body.items, function (playlist) {
        return spotifySdk.getPlaylistTracks(me.id, playlist.id, {limit: 100, offset: 0});
      });
      // don't let `404`s break the chain, settle the promises
      return Promise.settle(promises);
    })

    // only accept the resolved promises
    .then(function (data) {
      return _.reduce(data, function (collection, response) {
        if (response.isFulfilled()) {
          collection.push(response.value());
        }
        return collection;
      }, []);
    })

    // derive the user's preferred artist based on their playlist tracks
    .then(function (data) {
      var playlistTracks,
          artistMap,
          artistCollection;

      // transform the response into a collection of track collections
      playlistTracks = _.map(data, function (response) {
        return response.body;
      }).map(function (tracks) {
        return _.map(tracks.items, function (item) {
          return item.track
        });
      });

      // flatten into a single collection of tracks across all playlists
      playlistTracks = _.flatten(playlistTracks);

      // determine frequency of each artist
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

      // transform frequency map into a collection of frequent artists
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
