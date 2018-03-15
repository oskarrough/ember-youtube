import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';

module('Acceptance | video', function(hooks) {
	setupApplicationTest(hooks);

	test('visiting /video', async function(assert) {
		await visit('/video/jmCytJPqQis');

		assert.equal(currentURL(), '/video/jmCytJPqQis');
	});
});

