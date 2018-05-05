'use strict'
/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
module.exports = function escape (url) {
  if (typeof url !== 'string') {
    return url
  }
    // If url is already wrapped in quotes, remove them
  if (/^['"].*['"]$/.test(url)) {
    url = url.slice(1, -1)
  }
    // Should url be wrapped?
    // See https://drafts.csswg.org/css-values-3/#urls
  if (/["'() \t\n]/.test(url)) {
    return '"' + url.replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"'
  }

  return url
}
