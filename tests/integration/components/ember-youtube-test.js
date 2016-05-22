import Ember from 'ember';
import {moduleForComponent, test} from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('ember-youtube', 'Integration | Component | ember youtube', {
	integration: true
});

test('it renders', function (assert) {
	assert.expect(2);
	// Set any properties with this.set('myProperty', 'value');
	// Handle any actions with this.on('myAction', function(val) { ... });" + EOL + EOL +

	this.render(hbs`{{ember-youtube}}`);

	assert.equal(this.$().text().trim(), '', 'starts empty');

	// Template block usage:" + EOL +
	this.render(hbs`
		{{#ember-youtube}}
			template block text
		{{/ember-youtube}}
	`);
	assert.equal(this.$('.EmberYoutube-yield').text().trim(), 'template block text', 'yield is wrapped in an extra <div>');
});

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

test('it has an iframe', function (assert) {
	const done = assert.async();
	this.set('youtubeVideoId', 'fZ7MhTRmJ60');
	this.render(hbs`{{ember-youtube ytid=youtubeVideoId}}`);
	// It takes some time before the youtube api is loaded,
	// how do we avoid the timeout?
	Ember.run.later(this, function () {
		assert.ok(this.$('iframe').length);
		done();
	}, 1000);
});
