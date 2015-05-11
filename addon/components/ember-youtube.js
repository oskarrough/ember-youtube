/*global YT*/
import Ember from 'ember';

export default Ember.Component.extend({
	classNames: ['EmberYoutube'],
	ytid: null,
	player: null,
	playerState: 'loading',
	isMuted: false,
	showControls: false,
	showTime: false,
	showProgress: false,
	showDebug: false,
	autoplay: 1,

	// progressBar: function() {
	// 	var player = this.get('player');
	// 	player.getCurrentTime // 205.32458
	// 	player.getDuration // 478.145305
	// 	player.seekTo
	// }.on('playing')

	// from YT.PlayerState
	stateNames: {
		'-1': 'ready',		// READY
		0: 'ended', 		// YT.Player.ENDED
		1: 'playing', 		// YT.PlayerState.PLAYING
		2: 'paused', 		// YT.PlayerState.PAUSED
		3: 'buffering', 	// YT.PlayerState.BUFFERING
		5: 'queued'			// YT.PlayerState.CUED
	},

	// YouTube's embedded player can take a number of optional parameters.
	// Full list here: https://developers.google.com/youtube/player_parameters#Parameters
	// demo: https://developers.google.com/youtube/youtube_player_demo
	playerVars: {
		autoplay: 0,
		controls: 1,
		enablejsapi: 1,
		rel: 0, // disable related videos
		showinfo: 0,
		autohide: 1,
		fs: 0, // disable fullscreen button
		playsinline: 1
		// disablekb: 1,
		// iv_load_policy: 3,
		// modestbranding: 1,
	},

	// update autoplay from true/false to 1/0 which yt api needs
	setAutoplay: function() {
		this.playerVars.autoplay = this.get('autoplay') ? 1 : 0;
	}.observes('autoplay').on('init'),

	isPlaying: function() {
		var player = this.get('player');
		if (!player || this.get('playerState') === 'loading') { return false; }

		return player.getPlayerState() === YT.PlayerState.PLAYING;
	}.property('playerState'),

	// Make the component available to the outside world
	_register: function() {
		this.set('name', this);
	}.on('init'),

	// Load the iframe player API asynchronously from YouTube
	loadApi: function() {
		var tag = document.createElement('script');
		var firstTag = document.getElementsByTagName('script')[0];

		tag.src = "https://www.youtube.com/iframe_api";
		firstTag.parentNode.insertBefore(tag, firstTag);

		// YouTube callback when API is ready
		window.onYouTubePlayerAPIReady = function() {
			// Ember.debug('yt player api ready');
			this.createPlayer();
		}.bind(this);
	}.on('init'),

	createPlayer: function() {
		var _this = this;
		var playerVars = this.get('playerVars');
		var $iframe = this.$('#EmberYoutube-player');

		var player = new YT.Player($iframe[0], {
			width: 360,
			height: 270,
			playerVars: playerVars,
			events: {
				'onReady': _this.onPlayerReady.bind(_this),
				'onStateChange': _this.onPlayerStateChange.bind(_this),
				'onError': _this.onPlayerError.bind(_this)
			}
		});

		this.set('player', player);
		window.emberYouTubePlayer = player; // to access it outside ember
	},

	// called by the YouTube API
	onPlayerReady: function() {
		this.set('playerState', 'ready');
		this.loadVideo();
	},

	// Load (and plays) a video every time ytid changes
	loadVideo: function() {
		var id = this.get('ytid');
		var player = this.get('player');

		// make sure we have access to the functions we need
		// otherwise the player might die
		if (!id || !player.loadVideoById || !player.cueVideoById) {
			return;
		}

		if (this.playerVars.autoplay) {
			player.loadVideoById(id);
		} else {
			player.cueVideoById(id);
		}
	}.observes('ytid'),

	// @todo: here for later
	// onVolumeChange: function() {
	// 	if (this.get('volume')) {
	// 		this.send('play');
	// 	} else {
	// 		this.send('pause');
	// 	}
	// }.observes('volumeChange'),

	// called by YouTube
	onPlayerStateChange: function(event) {
		// Get a readable state name
		var state = this.get('stateNames.' + event.data.toString());
		this.set('playerState', state);

		// Ember.debug(state);

		// send actions outside
		this.sendAction(state);

		// send actions inside
		this.send(state);
	},

	// called by the API
	onPlayerError: function(event) {
		var errorCode = event.data;
		this.set('playerState', 'error');

		Ember.warn('error' + errorCode);

		// Send the event to the controller
		this.sendAction('error', errorCode);

		// switch(errorCode) {
		// 	case 2:
		// 		Ember.warn('Invalid parameter');
		// 		break;
		// 	case 100:
		// 		Ember.warn('Not found/private');
		// 		this.send('playNext');
		// 		break;
		// 	case 101:
		// 	case 150:
		// 		Ember.warn('Embed not allowed');
		// 		this.send('playNext');
		// 		break;
		// 	default:
		// 		break;
		// }
	},

	startTimer: function() {
		var player = this.get('player');

		this.set('currentTime', player.getCurrentTime());
		this.set('duration', player.getDuration());

		// every 60ms, update current time
		var timer = window.setInterval(function() {
			this.set('currentTime', player.getCurrentTime());
		}.bind(this), 60);

		this.set('timer', timer);
	},

	stopTimer: function() {
		window.clearInterval(this.get('timer'));
	},

	// avoids 'undefined' value for the <progress> element
	currentTimeValue: function() {
		var value = this.get('currentTime');
		return value ? value : 0;
	}.property('currentTime'),

	// avoids 'undefined' value for the <progress> element
	durationValue: function() {
		var value = this.get('duration');
		return value ? value : 0;
	}.property('duration'),

	// returns a 0:00 format
	currentTimeFormatted: function() {
		var time = this.get('currentTime');
		if (!time) { return; }
		var minutes = Math.floor(time / 60);
		var seconds = Math.floor(time - minutes * 60);
		if (seconds < 10) { seconds = '0' + seconds; }
		return minutes + ':' + seconds;
	}.property('currentTime'),

	// returns a 0:00 format
	durationFormatted: function() {
		var time = this.get('duration');
		if (!time) { return; }
		var minutes = Math.floor(time / 60);
		var seconds = time - minutes * 60;
		return minutes + ':' + seconds;
	}.property('duration'),

	actions: {
		load: function() { this.get('player').loadVideo(); },
		play: function() { this.get('player').playVideo(); },
		pause: function() { this.get('player').pauseVideo(); },
		mute: function() { this.get('player').mute(); },
		unMute: function() { this.get('player').unMute(); },
		togglePlay: function() {
			if (this.get('isPlaying')) {
				this.send('pause');
			} else {
				this.send('play');
			}
		},
		toggleVolume: function() {
			var player = this.get('player');
			this.toggleProperty('isMuted');
			if (player.isMuted()) {
				this.send('unMute');
			} else {
				this.send('mute');
			}
		},

		// youtube events
		ready: function() {},
		ended: function() {},
		playing: function() {
			this.startTimer();
		},
		paused: function() {
			this.stopTimer();
		},
		buffering: function() {},
		queued: function() {},
	}
});
