/*global YT*/
import Ember from 'ember';

const { computed, debug, observer, on, run } = Ember;
const moment = window.moment;

export default Ember.Component.extend({
	classNames: ['EmberYoutube'],
	ytid: null,
	player: null,
	playerState: 'loading',
	showControls: false,
	showTime: false,
	showProgress: false,
	showDebug: false,
	autoplay: 0,
	currentTimeFormat: "mm:ss",
	durationFormat: "mm:ss",
	startSeconds: undefined,
	endSeconds: undefined,
	suggestedQuality: undefined,

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
	_register: on('init', function() {
		const delegate = this.get('delegate');
		const delegateAs = this.get('delegate-as');

		run.schedule('afterRender', () => {
			if (!delegate) { return; }
			delegate.set(delegateAs || "emberYoutubePlayer", this);
		});
	}),

	// update autoplay from true/false to 1/0 which the YouTube api needs
	setAutoplay: on('init', observer('autoplay', function() {
		this.playerVars.autoplay = this.get('autoplay') ? 1 : 0;
	})),

	// Did insert element hook
	loadAndCreatePlayer: on('didInsertElement', function() {
    if (!window._youtubePlayerAPIReadyPromise) {
      var deferred = Ember.RSVP.defer();
      Ember.$.getScript("https://www.youtube.com/iframe_api").then(() => {
				window.onYouTubePlayerAPIReady = deferred.resolve;
			});
      window._youtubePlayerAPIReadyPromise = deferred.promise;
    }

    window._youtubePlayerAPIReadyPromise.then(() => {
			this.createPlayer();
    });
	}),

	isMuted: computed({
		get: function() {
			return this.get('player').isMuted();
		},
		set: function(name, muted) {
			if (muted) {
				this.send('mute');
			} else {
				this.send('unMute');
			}
		}
	}),

	isPlaying: computed('playerState', {
		get: function() {
			let player = this.get('player');
			if (!player || this.get('playerState') === 'loading') { return false; }

			return player.getPlayerState() !== YT.PlayerState.PAUSED;
		},
		set: function(name, playing) {
			let player = this.get('player');
			if (!player || this.get('playerState') === 'loading') { return; }
			let state = player.getPlayerState();
			if (state !== YT.PlayerState.PLAYING && state !== YT.PlayerState.PAUSED) { return; }

			if (playing) {
				this.send('play');
			} else {
				this.send('pause');
			}
		}
	}),

	createPlayer() {
		let playerVars = this.get('playerVars');
		let $iframe = this.$('#EmberYoutube-player');

		let player = new YT.Player($iframe[0], {
			width: 360,
			height: 270,
			playerVars: playerVars,
			events: {
				'onReady': this.onPlayerReady.bind(this),
				'onStateChange': this.onPlayerStateChange.bind(this),
				'onError': this.onPlayerError.bind(this)
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
	loadVideo: observer('ytid', function() {
		let id = this.get('ytid');
		let player = this.get('player');

		// make sure we have access to the functions we need
		// otherwise the player might die
		if (!id || !player.loadVideoById || !player.cueVideoById) {
			if (this.get('showDebug')) { debug('no id'); }
			return;
		}

		let options = {
			'videoId': id,
			'startSeconds': this.get('startSeconds'),
			'endSeconds': this.get('endSeconds'),
			'suggestedQuality': this.get('suggestedQuality')
		};

		if (this.playerVars.autoplay) {
			player.loadVideoById(options);
		} else {
			player.cueVideoById(options);
		}
	}),

	volume: computed({
		get: function() {
			return this.get('player').getVolume();
		}, set: function(name, volume) {
			// Clamp between 0 and 100
			if (volume > 100) {
				volume = 100;
			} else if (volume < 0) {
				volume = 0;
			}
			let player = this.get('player');
			if (player) {
				this.get('player').setVolume(volume);
			}
		}
	}),

	// called by YouTube
	onPlayerStateChange: function(event) {
		// Get a readable state name
		let state = this.get('stateNames.' + event.data.toString());
		this.set('playerState', state);

		if (this.get('showDebug')) { debug(state); }

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
		const player = this.get('player');
		const interval = 1000;

		// set initial times
		this.setProperties({
			'currentTime' : player.getCurrentTime(),
			'duration' : player.getDuration()
		});

		// stop any previously started timer we forgot to clear
		this.stopTimer();

		// every second update current time
		let timer = window.setInterval(function() {
			this.set('currentTime', player.getCurrentTime());
		}.bind(this), interval);

		// save the timer so we can stop it later
		this.set('timer', timer);
	},

	stopTimer: function() {
		window.clearInterval(this.get('timer'));
	},

	// avoids 'undefined' value for the <progress> element
	currentTimeValue: computed('currentTime', function() {
		let time = this.get('currentTime');
		return time ? time : 0;
	}),

	// returns a momentJS formated date based on "currentTimeFormat" property
	currentTimeFormatted: computed('currentTime', 'currentTimeFormat', function() {
		let time = this.get('currentTime');
		let format = this.get('currentTimeFormat');
		if (!time || !format) { return; }
		let duration = moment.duration(time, 'seconds');
		return duration.format(format);
	}),

	// avoids 'undefined' value for the <progress> element
	durationValue: computed('duration', function() {
		let duration = this.get('duration');
		return duration ? duration : 0;
	}),

	// returns a momentJS formated date based on "durationFormat" property
	durationFormatted: computed('duration', 'durationFormat', function() {
		let duration = this.get('duration');
		let format = this.get('durationFormat');

		if (!duration || !format) { return; }

		let time = moment.duration(duration, 'seconds');

		return time.format(format);
	}),

	// OK, this is really stupid but couldn't access the "event" inside
	// an ember action so here's a manual click handler instead
	progressBarClick: on('didInsertElement', function() {
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

	// clean up when element will be destroyed.
	willDestroyElement() {

		// clear the timer
		this.stopTimer();

		// destroy video player
		var player = this.get('player');
		if (player) {
			player.destroy();
			this.set('player', null);
		}
	},

	actions: {
		load: function() { this.get('player') && this.get('player').loadVideo(); },
		play: function() { this.get('player') && this.get('player').playVideo(); },
		pause: function() { this.get('player') && this.get('player').pauseVideo(); },
		mute: function() { this.get('player') && this.get('player').mute(); },
		unMute: function() { this.get('player') && this.get('player').unMute(); },
		togglePlay: function() {
			this.toggleProperty('isPlaying');
		},
		toggleVolume: function() {
			this.toggleProperty('isMuted');
		},
		seekTo(ms) {
			this.get('player') && this.get('player').seekTo(ms);
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
