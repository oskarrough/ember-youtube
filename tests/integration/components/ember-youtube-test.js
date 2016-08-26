// import Ember from 'ember';
import {moduleForComponent, test} from 'ember-qunit';
import wait from 'ember-test-helpers/wait';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('ember-youtube', 'Integration | Component | ember youtube', {
	integration: true
});

test('it loads the youtubeapi and create an iframe', function (assert) {
	this.set('youTubeId', 'w311Hd4K_Fk');
	this.render(hbs`{{ember-youtube ytid=youTubeId}}`);
	return wait().then(() => {
		return wait().then(() => {
			// it needs a double wait for whatever reason
			console.log('asserting');
			assert.ok(this.$('iframe').length, 'has iframe');
		});
	});
});

// Todo: create a promise so we can assert autoplay is working
// test('it can autoplay', function (assert) {
// 	this.set('youTubeId', 'w311Hd4K_Fk');
// 	this.set('myPlayerVars', {autoplay: 1});
// 	this.render(hbs`{{ember-youtube ytid=youTubeId showControls=true playerVars=myPlayerVars}}`);
// 	// console.log(this.$('.EmberYoutube-controls button').eq(0).text());
// 	return wait().then(() => {
// 		// it needs a double wait for whatever reason
// 		return wait().then(() => {
// 			assert.ok(this.$('iframe').length, 'has iframe');
// 			// var btnText = this.$('.EmberYoutube-controls button').eq(0).text();
// 			// assert.equal(btnText, 'pause');
// 		});
// 	});
// });

test('it can show and remove controls', function (assert) {
	assert.expect(3);
	this.set('controls', true);
	this.render(hbs`{{ember-youtube showControls=controls}}`);
	assert.ok(this.$('.EmberYoutube-controls button').length);
	assert.equal(this.$('.EmberYoutube-controls button').eq(0).text().trim(), 'Play');
	this.set('controls', false);
	assert.notOk(this.$('.EmberYoutube-controls button').length);
});

test('it can show and hide progress', function (assert) {
	assert.expect(2);
	this.set('progress', false);
	this.render(hbs`{{ember-youtube showProgress=progress}}`);
	assert.equal(this.$('.EmberYoutube-progress').length, 0, 'Progress is hidden by default');
	this.set('progress', true);
	assert.equal(this.$('.EmberYoutube-progress').length, 1, 'Progress can be shown');
});
