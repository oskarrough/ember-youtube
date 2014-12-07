import Ember from 'ember';

export default Ember.Controller.extend({
	youTubeId: 'fZ7MhTRmJ60',

	actions: {
		ytPlaying: function() {
			Ember.debug('on playing from controller');
		},
		ytPaused: function() {
			Ember.debug('on paused from controller');
		},
		ytEnded: function() {
			Ember.debug('on ended from controller');
			// here you could load another video by changing the youTubeId
		}
	}
});
