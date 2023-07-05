/* exported Cookie */
var Cookie = {
  get: function(name) {
    var array = document.cookie.split('; ').map(v => {
      var a = v.split('=');
      return [a[0], a[1]];
    });
    for (var i = 0; i < array.length; i++) {
			if (array[i][0] === name) {
				return JSON.parse(array[i][1]);
			}
    }
    return null;
  },
  set: function(name, value, days) {
    var date = new Date();
    date.setTime(date.getTime() + (days * 86400000));
    document.cookie = name + "=" + JSON.stringify(value) + "; " + "expires=" + date.toUTCString();
  }
};
