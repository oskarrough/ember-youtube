/* global YT, window */
import Ember from 'ember';

const {computed, debug, observer, on, run} = Ember;

export default Ember.Component.extend({
	classNames: ['EmberYoutube'],
	ytid: null,
	player: null,
	playerState: 'loading',
	showControls: false,
	showProgress: false,
	showDebug: false,

	// YouTube's embedded player can take a number of optional parameters.
	// https://developers.google.com/youtube/player_parameters#Parameters
	// https://developers.google.com/youtube/youtube_player_demo
	playerVars: {},

	startSeconds: undefined,
	endSeconds: undefined,
	suggestedQuality: undefined,
	height: 360,
	width: 270,

	// from YT.PlayerState
	stateNames: {
		'-1': 'ready',		// READY
		0: 'ended', 		// YT.Player.ENDED
		1: 'playing', 		// YT.PlayerState.PLAYING
		2: 'paused', 		// YT.PlayerState.PAUSED
		3: 'buffering', 	// YT.PlayerState.BUFFERING
		5: 'queued'			// YT.PlayerState.CUED
	},

	// Expose the component to the outside world.
	_register: on('init', function () {
		const delegate = this.get('delegate');
		const delegateAs = this.get('delegate-as');
		run.schedule('afterRender', () => {
			if (!delegate) {
				return;
			}
			delegate.set(delegateAs || 'emberYoutubePlayer', this);
		});
	}),

	loadAndCreatePlayer: on('didInsertElement', function () {
		this.loadYouTubeIframeAPI().then(() => {
			// Wait a tick to avoid janky performance.
			Ember.run.schedule('afterRender', this, function () {
				this.createPlayer();
			});
		});
	}),

	// Returns a promise that is resolved when the API is loaded.
	loadYouTubeIframeAPI() {
		let iframeAPIReady;
		iframeAPIReady = new Ember.RSVP.Promise(resolve => {
			if (window.YT && window.YT.loaded) {
				// If already loaded, resolve immediately.
				resolve(window.YT);
			} else {
				let previous = window.onYouTubeIframeAPIReady;
				// The API will call this function once the API has finished downloading.
				window.onYouTubeIframeAPIReady = () => {
					if (previous) {
						previous();
					}
					resolve(window.YT);
				};
			}
		});
		Ember.$.getScript('https://www.youtube.com/iframe_api').then(() => {
			// got iframe script
		});
		return iframeAPIReady;
	},

	createPlayer() {
		const playerVars = this.get('playerVars');
		const width = this.get('width');
		const height = this.get('height');
		const $iframe = this.$('#EmberYoutube-player');
		if (!$iframe) {
			// The YouTube API iframe wasn't inserted yet
			Ember.debug('Sorry, some async stuff went wrong. Could use your help: https://github.com/oskarrough/ember-youtube');
			return;
		}
		let player = new YT.Player($iframe.get(0), {
			width,
			height,
			playerVars,
			events: {
				onReady: this.onPlayerReady.bind(this),
				onStateChange: this.onPlayerStateChange.bind(this),
				onError: this.onPlayerError.bind(this)
			}
		});
		this.set('player', player);
	},

	// Gets called by the YouTube player.
	onPlayerReady() {
		this.set('playerState', 'ready');
		this.loadVideo();
	},

	// Gets called by the YouTube player.
	onPlayerStateChange(event) {
		// Set a readable state name
		let state = this.get('stateNames.' + event.data.toString());
		this.set('playerState', state);
		if (this.get('showDebug')) {
			debug(state);
		}
		// send actions outside
		this.sendAction(state);
		// send actions inside
		this.send(state);
	},

	// Gets called by the YouTube player.
	onPlayerError(event) {
		let errorCode = event.data;
		this.set('playerState', 'error');
		Ember.debug('error' + errorCode);
		// Send the event to the controller
		this.sendAction('error', errorCode);

		// switch(errorCode) {
		// 	case 2:
		// 		Ember.debug('Invalid parameter');
		// 		break;
		// 	case 100:
		// 		Ember.debug('Not found/private');
		// 		this.send('playNext');
		// 		break;
		// 	case 101:
		// 	case 150:
		// 		Ember.debug('Embed not allowed');
		// 		this.send('playNext');
		// 		break;
		// 	default:
		// 		break;
		// }
	},

	isPlaying: computed('playerState', {
		get() {
			const player = this.get('player');
			if (!player || this.get('playerState') === 'loading') {
				return false;
			}
			return player.getPlayerState() === 1;
		},
		set(name, paused) {
			const player = this.get('player');
			// Stop without player or when loading.
			if (!player || this.get('playerState') === 'loading') {
				return;
			}
			if (paused) {
				this.send('play');
			} else {
				this.send('pause');
			}
		}
	}),

	// Load (and plays) a video every time ytid changes
	loadVideo: observer('ytid', function () {
		const player = this.get('player');
		const videoId = this.get('ytid');
		const startSeconds = this.get('startSeconds');
		const endSeconds = this.get('endSeconds');
		const suggestedQuality = this.get('suggestedQuality');
		// Make sure we have access to the functions we need
		// otherwise the player might die
		if (!videoId || !player.loadVideoById || !player.cueVideoById) {
			if (this.get('showDebug')) {
				debug('no id');
			}
			return;
		}
		// Set parameters for the video to be played.
		let options = {
			videoId,
			startSeconds,
			endSeconds,
			suggestedQuality
		};
		// Check mute status and set it.
		this.set('isMuted', player.isMuted());
		// Either load or cue depending on `autoplay`
		if (this.playerVars.autoplay) {
			player.loadVideoById(options);
		} else {
			player.cueVideoById(options);
		}
	}),

	volume: computed({
		get: function () {
			return this.get('player').getVolume();
		},
		set: function (name, volume) {
			let player = this.get('player');
			// Clamp between 0 and 100
			if (volume > 100) {
				volume = 100;
			} else if (volume < 0) {
				volume = 0;
			}
			if (player) {
				player.setVolume(volume);
			}
		}
	}),

	startTimer: function () {
		const player = this.get('player');
		const interval = 1000;
		// set initial times
		this.setProperties({
			currentTime: player.getCurrentTime(),
			duration: player.getDuration()
		});
		// stop any previously started timer we forgot to clear
		this.stopTimer();
		// every second update current time
		let timer = window.setInterval(function () {
			this.set('currentTime', player.getCurrentTime());
		}.bind(this), interval);
		// save the timer so we can stop it later
		this.set('timer', timer);
	},

	stopTimer: function () {
		window.clearInterval(this.get('timer'));
	},

	// avoids 'undefined' value for the <progress> element
	currentTimeValue: computed('currentTime', function () {
		let time = this.get('currentTime');
		return time ? time : 0;
	}),

	// avoids 'undefined' value for the <progress> element
	durationValue: computed('duration', function () {
		let duration = this.get('duration');
		return duration ? duration : 0;
	}),

	// OK, this is really stupid but couldn't access the "event" inside
	// an ember action so here's a manual click handler instead
	progressBarClick: on('didInsertElement', function () {
		let self = this;
		this.$().on('click', 'progress', function (event) {
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
		play() {
			if (this.get('player')) {
				this.get('player').playVideo();
			}
		},
		pause() {
			if (this.get('player')) {
				this.get('player').pauseVideo();
			}
		},
		togglePlay() {
			this.toggleProperty('isPlaying');
		},
		mute() {
			if (this.get('player')) {
				this.get('player').mute();
				this.set('isMuted', true);
			}
		},
		unMute() {
			if (this.get('player')) {
				this.get('player').unMute();
				this.set('isMuted', false);
			}
		},
		toggleVolume() {
			if (this.get('player').isMuted()) {
				this.send('unMute');
			} else {
				this.send('mute');
			}
		},
		seekTo(seconds) {
			if (this.get('player')) {
				this.get('player').seekTo(seconds);
			}
		},
		// youtube events
		ready() {},
		ended() {},
		playing() {
			this.startTimer();
		},
		paused() {
			this.stopTimer();
		},
		buffering() {},
		queued() {}
	}
});
