import { module, test } from 'qunit'
import { setupRenderingTest } from 'ember-qunit'
import { render, waitFor } from '@ember/test-helpers'
import hbs from 'htmlbars-inline-precompile'

// https://github.com/emberjs/ember-test-helpers/blob/master/API.md#wait-helpers

module('Integration | Component | ember-youtube', function(hooks) {
	setupRenderingTest(hooks)

	test('youtube api replaces our container with an iframe', async function (assert) {
		this.set('youTubeId', 'w311Hd4K_Fk')
		await render(hbs`{{ember-youtube ytid=youTubeId}}`)
		assert.ok(this.element.querySelector('.EmberYoutube-player'), 'has container')
		await waitFor('iframe')
		assert.equal(this.element.querySelector('.EmberYoutube-player').tagName, 'IFRAME', 'container is replaced')
	})

	test('it can show and remove controls', async function (assert) {
		assert.expect(3)
		this.set('controls', true)
		await render(hbs`{{ember-youtube showControls=controls}}`)
		assert.ok(this.element.querySelector('.EmberYoutube-controls button'))
		assert.equal(this.element.querySelectorAll('.EmberYoutube-controls button')[0].textContent, 'Play')
		this.set('controls', false)
		assert.notOk(this.element.querySelector('.EmberYoutube-controls button'))
	})

	test('it can show and hide progress', async function (assert) {
		assert.expect(2)
		this.set('progress', false)
		await render(hbs`{{ember-youtube showProgress=progress}}`)
		assert.notOk(this.element.querySelector('.EmberYoutube-progress'), 'Progress is hidden by default')
		this.set('progress', true)
		assert.ok(this.element.querySelector('.EmberYoutube-progress'), 'Progress can be shown')
	})

	// Todo: create a promise so we can assert autoplay is working
	// test('it can autoplay', async function (assert) {
	// 	assert.expect(2)

	// 	this.set('youTubeId', 'w311Hd4K_Fk')
	// 	this.set('myPlayerVars', {autoplay: 1})

	// 	await render(hbs`
	// 		{{ember-youtube
	// 			ytid=youTubeId
	// 			showControls=true
	// 			playerVars=myPlayerVars}}`)

	// 	var buttons = this.element.querySelectorAll('.EmberYoutube-controls button')
	// 	var btn = buttons[0]
	// 	// console.log(btn)
	// 	assert.equal(btn.textContent, 'Play')
	// 	// assert.equal(btn.textContent, 'Pause', 'it says pause because it is already playing')
	// })
})
