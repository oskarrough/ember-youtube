import {moduleForComponent, test} from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('ember-youtube-hehe', 'Integration | Component | ember youtube hehe', {
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

test('it can show controls', function (assert) {
	this.render(hbs`{{ember-youtube showControls=true}}`);
	assert.equal(this.$('.EmberYoutube-controls button').eq(0).text().trim(), 'Play');
});

test('it can show progress', function (assert) {
	assert.expect(2);
	this.set('progress', false);
	this.render(hbs`{{ember-youtube showProgress=progress}}`);
	assert.equal(this.$('.EmberYoutube-progress').length, 0, 'Progress is hidden by default');
	this.set('progress', true);
	assert.equal(this.$('.EmberYoutube-progress').length, 1, 'Progress can be shown');
});

// test('it can play', function (assert) {
//   this.set('youtubeId', 'NEFrNP-BLcI');
//   this.render(hbs`{{ember-youtube showDebug=true ytid=youtubeId}}`);

//   console.log(this.$()[0]);
//   assert.equal(this.get('ytid'), 'NEFrNP-BLcI', 'ytid works');
//   // return wait().then(() => {
//   //   assert.equal(this.$('iframe').length, 1);
//   //   // assert.equal(this.$('.result').length, 2, 'two results rendered');
//   // });
// });

// {{ember-youtube ytid=youTubeId
//   volume=volume
//   playerVars=customPlayerVars
//
//   showControls=false
//   showProgress=true
//   showDebug=true
//
//   delegate=this
//   delegate-as="emberYoutube"
//
//   playing="ytPlaying"
//   paused="ytPaused"
//   ended="ytEnded"}}
// </section>
//
// <p>Multiple players on the same route are supported as well.</p>
// {{ember-youtube ytid="NEFrNP-BLcI"}}
