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
	autoplay: 0,

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

	// Make the component available to the outside world
	_register: Ember.on('init', function() {
		// this.set('name', this);
		if (this.get('delegate')) {
			this.get('delegate').set(this.get('delegate-property') || "default", this);
		}
	}),

	// update autoplay from true/false to 1/0 which yt api needs
	setAutoplay: Ember.on('init', Ember.observer('autoplay', function() {
		this.playerVars.autoplay = this.get('autoplay') ? 1 : 0;
	})),

	// Load the iframe player API asynchronously from YouTube
	loadApi: Ember.on('init', function() {
		let tag = document.createElement('script');
		let firstTag = document.getElementsByTagName('script')[0];

		tag.src = "https://www.youtube.com/iframe_api";
		firstTag.parentNode.insertBefore(tag, firstTag);

		// YouTube callback when API is ready
		window.onYouTubePlayerAPIReady = function() {
			// Ember.debug('yt player api ready');
			this.createPlayer();
		}.bind(this);
	}),

	isPlaying: Ember.computed('playerState', function() {
		let player = this.get('player');
		if (!player || this.get('playerState') === 'loading') { return false; }

		return player.getPlayerState() === YT.PlayerState.PLAYING;
	}),

	createPlayer: function() {
		let _this = this;
		let playerVars = this.get('playerVars');
		let $iframe = this.$('#EmberYoutube-player');

		let player = new YT.Player($iframe[0], {
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
	loadVideo: Ember.observer('ytid', function() {
		let id = this.get('ytid');
		let player = this.get('player');

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
	}),

	// @todo: here for later
	// onVolumeChange: Ember.observer('volumeChange', function() {
	// 	if (this.get('volume')) {
	// 		this.send('play');
	// 	} else {
	// 		this.send('pause');
	// 	}
	// }),

	// called by YouTube
	onPlayerStateChange: function(event) {
		// Get a readable state name
		let state = this.get('stateNames.' + event.data.toString());
		this.set('playerState', state);

		// Ember.debug(state);

		// send actions outside
		this.sendAction(state);

		// send actions inside
		this.send(state);
	},

	// called by the API
	onPlayerError: function(event) {
		let errorCode = event.data;
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
		let player = this.get('player');

		this.set('currentTime', player.getCurrentTime());
		this.set('duration', player.getDuration());

		// every 60ms, update current time
		let timer = window.setInterval(function() {
			this.set('currentTime', player.getCurrentTime());
		}.bind(this), 60);

		this.set('timer', timer);
	},

	stopTimer: function() {
		window.clearInterval(this.get('timer'));
	},

	// avoids 'undefined' value for the <progress> element
	currentTimeValue: Ember.computed('currentTime', function() {
		let value = this.get('currentTime');
		return value ? value : 0;
	}),

	// returns a 0:00 format
	currentTimeFormatted: Ember.computed('currentTime', function() {
		let time = this.get('currentTime');
		if (!time) { return; }
		let minutes = Math.floor(time / 60);
		let seconds = Math.floor(time - minutes * 60);
		if (seconds < 10) { seconds = '0' + seconds; }
		return minutes + ':' + seconds;
	}),

	// avoids 'undefined' value for the <progress> element
	durationValue: Ember.computed('duration', function() {
		let value = this.get('duration');
		return value ? value : 0;
	}),

	// returns a 0:00 format
	durationFormatted: Ember.computed('duration', function() {
		let time = this.get('duration');
		if (!time) { return; }
		let minutes = Math.floor(time / 60);
		let seconds = time - minutes * 60;
		return minutes + ':' + seconds;
	}),

	// OK, this is really stupid but couldn't access the "event" inside
	// an ember action so here do a manual click handler instead
	progressBarClick: Ember.on('didInsertElement', function() {
		let self = this;

		this.$().on('click', 'progress', function(event) {

			// get the x position of the click inside our progress el
			let x = event.pageX - Ember.$(this).position().left;

			// convert it to a value relative to the duration (max)
			let clickedValue = x * this.max / this.offsetWidth;

			// 250 = 0.25 seconds into player
			self.send('seekTo', clickedValue);
		});
	}),

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
			let player = this.get('player');
			this.toggleProperty('isMuted');
			if (player.isMuted()) {
				this.send('unMute');
			} else {
				this.send('mute');
			}
		},
		seekTo(ms) {
			this.get('player').seekTo(ms);
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
