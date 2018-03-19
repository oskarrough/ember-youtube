import Route from '@ember/routing/route';
import Object from '@ember/object';
import RSVP from 'rsvp'

export default Route.extend({
	model(params) {
		const model = Object.create({
			id: params.youtube_id
		});
		return new RSVP.Promise(resolve => {
			setTimeout(() => resolve(model), 500)
		})
	}
});
