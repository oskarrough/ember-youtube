/* jshint node: true */
'use strict';

module.exports = {
  name: 'ember-youtube',

  included: function(app) {
    this._super.included(app);

    app.import(app.bowerDirectory + '/moment/moment.js');
    app.import(app.bowerDirectory + '/moment-duration-format/lib/moment-duration-format.js');
  }
};