import Controller from '@ember/controller'
import { debug } from '@ember/debug'

export default Controller.extend({
	youTubeId: 'fZ7MhTRmJ60',
	volume: 100,

	init() {
		this._super()

		// On this route we'll use some different settings.
		this.set('customPlayerVars', {
			autoplay: 1,
			rel: 0, // disable related videos
			showinfo: 0 // hide uploader info
		})
	},

	actions: {
		ytPlaying() {
			debug('on playing from controller')
		},
		ytPaused() {
			debug('on paused from controller')
		},
		ytEnded() {
			debug('on ended from controller')
			// here you could load another video by changing the youTubeId
		},
		ytBuffering() {
			debug('on buffering from controller')
		}
	}
})
