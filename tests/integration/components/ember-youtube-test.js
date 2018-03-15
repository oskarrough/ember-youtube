import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

// https://github.com/emberjs/ember-test-helpers/blob/master/API.md#wait-helpers

module('Integration | Component | ember-youtube', function(hooks) {
	setupRenderingTest(hooks);

	test('it renders', async function(assert) {
		// Set any properties with this.set('myProperty', 'value');
		// Handle any actions with this.set('myAction', function(val) { ... });

		await render(hbs`{{ember-youtube}}`);

		assert.equal(this.element.textContent.trim(), '');

		// Template block usage:
		await render(hbs`
			{{#ember-youtube}}
				template block text
			{{/ember-youtube}}
		`);

		assert.equal(this.element.textContent.trim(), 'template block text');
	});

	test('it loads the youtubeapi and create an iframe', async function (assert) {
		this.set('youTubeId', 'w311Hd4K_Fk');

		await render(hbs`{{ember-youtube ytid=youTubeId}}`);
		assert.ok(this.element.querySelector('iframe'), 'has iframe');
	});

	// Todo: create a promise so we can assert autoplay is working
	// test('it can autoplay', async function (assert) {
	// 	assert.expect(2);

	// 	this.set('youTubeId', 'w311Hd4K_Fk');
	// 	this.set('myPlayerVars', {autoplay: 1});

	// 	await render(hbs`
	// 		{{ember-youtube
	// 			ytid=youTubeId
	// 			showControls=true
	// 			playerVars=myPlayerVars}}`);

	// 	var buttons = this.element.querySelectorAll('.EmberYoutube-controls button')
	// 	var btn = buttons[0]
	// 	// console.log(btn)
	// 	assert.equal(btn.textContent, 'Play');
	// 	// assert.equal(btn.textContent, 'Pause', 'it says pause because it is already playing');
	// });

	test('it can show and remove controls', async function (assert) {
		assert.expect(3);
		this.set('controls', true);
		await render(hbs`{{ember-youtube showControls=controls}}`);
		assert.ok(this.$('.EmberYoutube-controls button').length);
		assert.equal(this.$('.EmberYoutube-controls button').eq(0).text().trim(), 'Play');
		this.set('controls', false);
		assert.notOk(this.$('.EmberYoutube-controls button').length);
	});

	test('it can show and hide progress', async function (assert) {
		assert.expect(2);
		this.set('progress', false);
		await render(hbs`{{ember-youtube showProgress=progress}}`);
		assert.equal(this.$('.EmberYoutube-progress').length, 0, 'Progress is hidden by default');
		this.set('progress', true);
		assert.equal(this.$('.EmberYoutube-progress').length, 1, 'Progress can be shown');
	});
});
