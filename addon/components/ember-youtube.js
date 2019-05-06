/* global YT, window */

import Component from '@ember/component'
import RSVP from 'rsvp'
import { computed, getProperties, setProperties, observer } from '@ember/object'
import { debug } from '@ember/debug'
import { run } from '@ember/runloop'
import { task } from 'ember-concurrency'

export default Component.extend({
	classNames: ['EmberYoutube'],
	ytid: null,
	width: 560,
	height: 315,

	// These options are used to load a video.
	startSeconds: undefined,
	endSeconds: undefined,
	suggestedQuality: undefined,

	lazyload: false,
	showControls: false,
	showDebug: false,
	showProgress: false,
	showExtras: computed.or('showControls', 'showProgress', 'showDebug'),

	player: null,
	playerState: 'loading',

	init() {
		this._super()

		setProperties(this, {
			// YouTube's embedded player can take a number of optional parameters.
			// https://developers.google.com/youtube/player_parameters#Parameters
			// https://developers.google.com/youtube/youtube_player_demo
			playerVars: Object.assign({}, this.playerVars),
			// from YT.PlayerState
			stateNames: {
				'-1': 'ready', // READY
				0: 'ended', // YT.Player.ENDED
				1: 'playing', // YT.PlayerState.PLAYING
				2: 'paused', // YT.PlayerState.PAUSED
				3: 'buffering', // YT.PlayerState.BUFFERING
				5: 'queued' // YT.PlayerState.CUED
			}
		})

		this._register()
	},

	// Expose the component to the outside world.
	_register() {
		const delegate = this.get('delegate')
		const delegateAs = this.get('delegate-as')
		run.schedule('afterRender', () => {
			if (!delegate) {
				return
			}
			delegate.set(delegateAs || 'emberYouTube', this)
		})
	},

	didInsertElement() {
		this._super(...arguments)

		this.addProgressBarClickHandler()

		if (!this.get('lazyload') && this.get('ytid')) {
			// If "lazyload" is not enabled and we have an ID, we can start immediately.
			// Otherwise the `loadVideo` observer will take care of things.
			this.get('loadAndCreatePlayer').perform()
		}
	},

	willDestroyElement() {
		this.get('loadAndCreatePlayer').cancelAll()

		// clear the timer
		this.stopTimer()

		// remove progress bar click handler
		this.removeProgressBarClickHandler()

		// destroy video player
		const player = this.get('player')
		if (player) {
			player.destroy()
			this.set('player', null)
		}

		// clear up if "delegated"
		const delegate = this.get('delegate')
		const delegateAs = this.get('delegate-as')
		if (delegate) {
			delegate.set(delegateAs || 'emberYouTube', null)
		}
	},

	loadAndCreatePlayer: task(function*() {
		try {
			yield this.loadYouTubeApi()
			let player = yield this.createPlayer()

			this.setProperties({
				player,
				playerState: 'ready'
			})

			this.sendAction('playerCreated', player)

			this.loadVideo()
		} catch (err) {
			if (this.get('showDebug')) {
				debug(err)
			}

			throw err
		}
	}).drop(),

	// A promise that is resolved when window.onYouTubeIframeAPIReady is called.
	// The promise is resolved with a reference to window.YT object.
	loadYouTubeApi() {
		return new RSVP.Promise(resolve => {
			let previous
			previous = window.onYouTubeIframeAPIReady

			// The API will call this function when page has finished downloading
			// the JavaScript for the player API.
			window.onYouTubeIframeAPIReady = () => {
				if (previous) {
					previous()
				}
				resolve(window.YT)
			}

			if (window.YT && window.YT.loaded) {
				// If already loaded, make sure not to load the script again.
				resolve(window.YT)
			} else {
				let ytScript = document.createElement('script')
				ytScript.src = 'https://www.youtube.com/iframe_api'
				document.head.appendChild(ytScript)
			}
		})
	},

	// A promise that is immediately resolved with a YouTube player object.
	createPlayer() {
		const playerVars = this.get('playerVars')
		const width = this.get('width')
		const height = this.get('height')
		const container = this.element.querySelector('.EmberYoutube-player')
		let player
		return new RSVP.Promise((resolve, reject) => {
			if (!container) {
				reject(`Couldn't find the container element to create a YouTube player`)
			}
			player = new YT.Player(container, {
				width,
				height,
				playerVars,
				events: {
					onReady() {
						resolve(player)
					},
					onStateChange: this.onPlayerStateChange.bind(this),
					onError: this.onPlayerError.bind(this)
				}
			})
		})
	},

	// Gets called by the YouTube player.
	onPlayerStateChange(event) {
		// Set a readable state name
		let state = this.get('stateNames.' + event.data.toString())
		this.set('playerState', state)
		if (this.get('showDebug')) {
			debug(state)
		}
		// send actions outside
		this.sendAction(state, event)
		this.sendAction('playerStateChanged', event)
		// send actions inside
		this.send(state)
	},

	// Gets called by the YouTube player.
	onPlayerError(event) {
		let errorCode = event.data
		this.set('playerState', 'error')
		// Send the event to the controller
		this.sendAction('error', errorCode)
		if (this.get('showDebug')) {
			debug('error' + errorCode)
		}
		// switch(errorCode) {
		// 	case 2:
		// 		debug('Invalid parameter');
		// 		break;
		// 	case 100:
		// 		debug('Not found/private');
		// 		this.send('playNext');
		// 		break;
		// 	case 101:
		// 	case 150:
		// 		debug('Embed not allowed');
		// 		this.send('playNext');
		// 		break;
		// 	default:
		// 		break;
		// }
	},

	// Returns a boolean that indicates playback status by looking at the player state.
	isPlaying: computed('playerState', {
		get() {
			const player = this.get('player')
			if (!player) {
				return false
			}
			return player.getPlayerState() === 1
		}
	}),

	// Load (and plays) a video every time ytid changes.
	ytidDidChange: observer('ytid', function() {
		const player = this.get('player')
		const ytid = this.get('ytid')

		if (!ytid) {
			return
		}

		if (!player) {
			this.get('loadAndCreatePlayer').perform()
			return
		}
		this.loadVideo()
	}),

	loadVideo() {
		const player = this.get('player')
		const ytid = this.get('ytid')

		// Set parameters for the video to be played.
		let options = getProperties(this, ['startSeconds', 'endSeconds', 'suggestedQuality'])
		options.videoId = ytid
		// Either load or cue depending on `autoplay`.
		if (this.playerVars.autoplay) {
			player.loadVideoById(options)
		} else {
			player.cueVideoById(options)
		}
	},

	updateTime() {
		const player = this.get('player')
		if (player && player.getDuration && player.getCurrentTime) {
			this.set('currentTime', player.getCurrentTime())
			this.set('duration', player.getDuration())
		}
	},

	startTimer() {
		// stop any previously started timer we forgot to clear
		this.stopTimer()
		// set initial time by getting the computed properties
		this.updateTime()
		// and also once every second so the progressbar is up to date
		let timer = window.setInterval(() => {
			this.updateTime()
		}, 1000)
		// save the timer so we can stop it later
		this.set('timer', timer)
	},

	stopTimer() {
		window.clearInterval(this.get('timer'))
	},

	// A wrapper around the YouTube method to get current time.
	currentTime: computed({
		get() {
			let player = this.get('player')
			let value = player ? player.getCurrentTime() : 0
			return value
		},
		set(key, value) {
			return value
		}
	}),

	// A wrapper around the YouTube method to get the duration.
	duration: computed({
		get() {
			let player = this.get('player')
			let value = player ? player.getDuration() : 0
			return value
		},
		set(key, value) {
			return value
		}
	}),

	// A wrapper around the YouTube method to get and set volume.
	volume: computed({
		get() {
			let player = this.get('player')
			let value = player ? player.getVolume() : 0
			return value
		},
		set(name, vol) {
			let player = this.get('player')
			// Clamp between 0 and 100
			if (vol > 100) {
				vol = 100
			} else if (vol < 0) {
				vol = 0
			}
			if (player) {
				player.setVolume(vol)
			}
			return vol
		}
	}),

	// OK, this is stupid but couldn't access the "event" inside
	// an ember action so here's a manual click handler instead.
	addProgressBarClickHandler() {
		this.element.addEventListener('click', this.progressBarClick.bind(this), false)
	},
	progressBarClick(event) {
		let self = this
		let element = event.srcElement
		if (element.tagName.toLowerCase() !== 'progress') return
		// get the x position of the click inside our progress el
		let x = event.pageX - element.getBoundingClientRect().x
		// convert it to a value relative to the duration (max)
		let clickedValue = (x * element.max) / element.offsetWidth
		// 250 = 0.25 seconds into player
		self.set('currentTime', clickedValue)
		self.send('seekTo', clickedValue)
	},
	removeProgressBarClickHandler() {
		this.element.removeEventListener('click', this.progressBarClick.bind(this), false)
	},

	actions: {
		play() {
			if (this.get('player')) {
				this.get('player').playVideo()
			}
		},
		pause() {
			if (this.get('player')) {
				this.get('player').pauseVideo()
			}
		},
		togglePlay() {
			if (this.get('player') && this.get('isPlaying')) {
				this.send('pause')
			} else {
				this.send('play')
			}
		},
		mute() {
			if (this.get('player')) {
				this.get('player').mute()
				this.set('isMuted', true)
			}
		},
		unMute() {
			if (this.get('player')) {
				this.get('player').unMute()
				this.set('isMuted', false)
			}
		},
		toggleVolume() {
			if (this.get('player').isMuted()) {
				this.send('unMute')
			} else {
				this.send('mute')
			}
		},
		seekTo(seconds) {
			if (this.get('player')) {
				this.get('player').seekTo(seconds)
			}
		},
		// YouTube events.
		ready() {},
		ended() {},
		playing() {
			this.startTimer()
		},
		paused() {
			this.stopTimer()
		},
		buffering() {},
		queued() {}
	}
})
