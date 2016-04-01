import Ember from 'ember';

export default Ember.Controller.extend({
	youTubeId: 'fZ7MhTRmJ60', // NEFrNP-BLcI

	customPlayerVars: {
		autoplay: 1,
		rel: 0, // disable related videos
		showinfo: 0 // hide uploader info
	},

	volume: 100,
	actions: {
		ytPlaying() {
			Ember.debug('on playing from controller');
		},
		ytPaused() {
			Ember.debug('on paused from controller');
		},
		ytEnded() {
			Ember.debug('on ended from controller');
			// here you could load another video by changing the youTubeId
		},
		ytBuffering() {
			Ember.debug('on buffering from controller');
		}
	}
});
