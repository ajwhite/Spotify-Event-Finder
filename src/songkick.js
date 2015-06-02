module.exports = (function () {
  var Songkick = require('node-songkick'),
      Promise = require('bluebird'),
      Config = require('./config'),
      songkick = new Songkick(Config.songkick.key);

  function getEvents (artist) {
    return new Promise(function (resolve, reject) {
      songkick.artist.search('muse', {}, function (response) {
        var artist = response.resultsPage.results.artist[0];
        songkick.artist.calendar('artist_id', artist.id, {}, function (response) {
          var events = response.resultsPage.results.event;
          resolve({
            artist: artist.displayName,
            events: events
          });
        });
      });
    });
  }

  return {
    getEvents: getEvents
  };
}).call(this);
