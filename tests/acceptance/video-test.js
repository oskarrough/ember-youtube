import { test } from 'qunit';
import moduleForAcceptance from '../../tests/helpers/module-for-acceptance';

moduleForAcceptance('Acceptance | video');

// test('homepage renders two videos', function(assert) {
// 	visit('/');
// 	andThen(() => {
// 		assert.equal(find('.EmberYoutube iframe').length, 2);
// 	});
// });

test('visiting /video', function(assert) {
	assert.expect(2);
	visit('/video/jmCytJPqQis');
	andThen(() => {
		assert.equal(currentURL(), '/video/jmCytJPqQis');
		assert.ok(find('.EmberYoutube iframe').length);
	});
});
