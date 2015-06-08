# ember-youtube

A simple Ember.js component to play and control single YouTube videos using the iframe API. It will autoplay as soon as you pass a YouTube ID.

```hbs
{{ember-youtube
	ytid="fZ7MhTRmJ60"
	autoplay=true
	volume=100

	showControls=false
	showTime=false
	showProgress=false
	showDebug=false

	delegate=controller
	delegate-as="myPlayer"

	playing="ytPlaying"
	paused="ytPaused"
	ended="ytEnded"
	buffering="ytBuffering"}}
```

## Features

- Full support for all YouTube player events
- External controls (make your own buttons)
- Custom time properties (for instance "4:31 / 7:58") formatted with Moment.js
- Custom progress bar in full sync with the YouTube player
- Error handling

## Installation

Inside your ember-cli project run:

```bash
ember install ember-youtube
```

For ember-cli 0.1.5 - 0.2.2, please use:

```bash
ember install:addon ember-youtube
```

## Usage

As it's an ember addon everything will be merged into your application which means you'll be able to do this immediately:

```hbs
{{ember-youtube ytid=youTubeId autoplay=true}}
```

Beautiful, no? All available settings are in the example at the top of this file. You can also see the component file directly: [addon/components/ember-youtube.js](https://github.com/oskarrough/ember-youtube/blob/master/addon/components/ember-youtube.js).

## External controls

If you want your own buttons, you need to do two things:

1) Make the ember-youtube available to outside which normally means your controller. You do this with the `delegate` and `delegate-as` properties of ember-youtube.

They expose the component and give you a target for your actions. Like this:

```hbs
{{ember-youtube ytid=youTubeId delegate=controller delegate-as="myPlayer"}}
```

2) Specify a target on your actions

Now, and because we used `delegate` and `delegate-as`, you actually have complete access to the insides of the component. Be careful.

But it allows you to do this in the template where you include the player:

```hbs
<button {{action "togglePlay" target=myPlayer}}>
	{{#if myPlayer.isPlaying}}Pause{{else}}Play{{/if}}
</button>
<button {{action "toggleVolume" target="emberYoutube"}}>
	{{#if myPlayer.isMuted}}Unmute{{else}}Mute{{/if}}
</button>
```

You can also do this:

```hbs
<button {{action "play" target=myPlayer}}>Play</button>
<button {{action "pause" target=myPlayer}}>Pause</button>
<button {{action "mute" target=myPlayer}}>Mute</button>
<button {{action "unMute" target=myPlayer}}>Unmute</button>
```

## Events

The ember-youtube component send four different actions: `playing`, `paused`, `ended` and `buffering`. You should map them to your own actions like this:

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

## Autoplay on iOS

On iOS autoplay of videos is disabled by Apple to save your precious data. I haven't been able to circumvent this. The user needs to tap the video itself before we can call the player's play/load methods. If anyone has a workaround, let me know.

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

For more information on using ember-cli, visit [http://www.ember-cli.com/](http://www.ember-cli.com/).

## Similar projects

* https://www.npmjs.com/package/react-youtube
* http://cejast.github.io/ng-youtube/
* https://github.com/brandly/angular-youtube-embed
* https://github.com/gilesvangruisen/Swift-YouTube-Player
* https://github.com/mikecrittenden/tangletube

**This is very much a work in progress and my first ember addon. Please file an issue if you have any feedback or would like to contribute.**

Thanks to https://github.com/oskarrough/ember-youtube/graphs/contributors.
