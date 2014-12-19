# ember-youtube

A simple Ember.js component to play and control single YouTube videos using the iframe API. It will autoplay as soon as you pass a YouTube ID.

```hbs
{{ember-youtube ytid="fZ7MhTRmJ60"
	name=player

	showControls=false
	showTime=false
	showProgress=false
	showDebug=false

	playing="ytPlaying"
	paused="ytPaused"
	ended="ytEnded"
	buffering="ytBuffering"}}
```

## Features

- Full support for all YouTube player events
- External controls (make your own buttons!)
- Custom time (4:31/7:58)
- Custom progress bar (just for show, for now)
- Error handling

## Usage

Inside your ember-cli project do:

`npm install --save-dev ember-youtube`

Files will be included automatically by ember-cli and you can do this:

```hbs
{{ember-youtube ytid=youTubeId}}
```

**This is very much a work in progress and my first ember addon. Please file an issue if you have any feedback or would like to contribute.**

## External controls

If you want your own buttons, you need to do two things:

1) Give the ember-youtube component a `name`.
This exposes the component and gives you a target for your actions.

```hbs
{{ember-youtube ytid=youTubeId name=myPlayer}}
```

2) Specify a target on your actions
Because we gave it a name, you actually have complete access to the insides of the component. Be careful.

```hbs
<button {{action "togglePlay" target="myPlayer"}}>
	{{#if myPlayer.isPlaying}}Pause{{else}}Play{{/if}}
</button>
<button {{action "toggleVolume" target="myPlayer"}}>
	{{#if myPlayer.isMuted}}Unmute{{else}}Mute{{/if}}
</button>
```

You can also do this:

```hbs
<button {{action "play" target="myPlayer"}}>Play</button>
<button {{action "pause" target="myPlayer"}}>Pause</button>
<button {{action "mute" target="myPlayer"}}>Mute</button>
<button {{action "unMute" target="myPlayer"}}>Unmute</button>
```

## Events

The component send four different events: `playing`, `paused`, `ended` and `buffering`. You can bind them to actions in your controller. Like this:

```hbs
{{ember-youtube ytid="fZ7MhTRmJ60"
	playing="ytPlaying"
	paused="ytPaused"
	ended="ytEnded"
	buffering="ytBuffering"}}
```

```JavaScript
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
  },
  ytBuffering: function() {
    Ember.debug('on buffering from controller');
  }
}
```

## Development

* `git clone` this repository
* `npm install`
* `bower install`

## Running

* `ember server`
* Visit your app at http://localhost:4200.

## Running Tests

* `ember test`
* `ember test --server`

## Building

* `ember build`

For more information on using ember-cli, visit [http://www.ember-cli.com/](http://www.ember-cli.com/).

## Ember addon links

* http://www.ember-cli.com/#developing-addons-and-blueprints
* http://reefpoints.dockyard.com/2014/06/24/introducing_ember_cli_addons.html
* http://hashrocket.com/blog/posts/building-ember-addons
* https://github.com/jasonkriss/ember-flash-message

## YouTube links

* https://www.npmjs.com/package/react-youtube
* https://github.com/mikecrittenden/tangletube
* https://github.com/4South/ember-youtube/blob/master/public/js/views/YoutubeView.js
* http://alg.github.io/talks/emberjs/#/title
* http://urli.st/8hw-Building-an-app-in-emberjs
* http://cejast.github.io/ng-youtube/
* https://github.com/brandly/angular-youtube-embed
* http://emberjs.com/guides/components/sending-actions-from-components-to-your-application/
* https://github.com/jasonkriss/ember-flash-message
