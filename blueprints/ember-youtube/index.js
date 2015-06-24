module.exports = {
  description: 'install bower dependencies',
  normalizeEntityName: function() {},
  afterInstall: function(options) {
    var _this = this;
    return _this.addBowerPackageToProject('moment').then(function() {
      return _this.addBowerPackageToProject('moment-duration-format');
    });

  }
};
