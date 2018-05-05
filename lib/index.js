'use strict'
/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author yibn2008<yibn2008@qq.com>
*/
const loaderUtils = require('loader-utils')
const createResolver = require('./create-resolver')
const getImportPrefix = require('./import-prefix')
const cssReplace = require('./css-replace')

function getLoaderOptions (ctx) {
  const options = loaderUtils.getOptions(ctx) || {}

  return Object.assign({
    // default options
    url: true,
    import: true
  }, options)
}

/**
 * fast css loader
 *
 * transform css from:
 *
 * ```css
 * @charset "UTF-8";
 * @import "abc1.css";
 * @import 'abc2.css';
 * @import url(abc3.css);
 * @import url('abc4.css') screen and (orientation:landscape);
 *
 * body {
 *   background: no-repeat url(image.png);
 *   color: #F60;
 * }
 * ```
 *
 * to:
 *
 * ```js
 * var escape = __webpack_require__('./node_modules/fast-css-loader/lib/escape.js');
 * exports = module.exports = __webpack_require__('./node_modules/fast-css-loader/lib/css-base.js')(false);
 *
 * // imports
 * exports.i(__webpack_require__('./node_modules/fast-css-loader/index.js!./abc1.css'), '');
 * exports.i(__webpack_require__('./node_modules/fast-css-loader/index.js!./abc2.css'), '');
 * exports.i(__webpack_require__('./node_modules/fast-css-loader/index.js!./abc3.css'), '');
 * exports.i(__webpack_require__('./node_modules/fast-css-loader/index.js!./abc4.css'), 'screen and (orientation:landscape)');
 *
 * // module
 * exports.push([module.i, "@charset \"UTF-8\";\n\n\n\n\nbody {\n  background: url(" + escape(__webpack_require__("./image.png")) + ") no-repeat;\n  color: #F60;\n}\n", ""]);
 * ```
 *
 * more info:
 *
 * - https://developer.mozilla.org/en-US/docs/Web/CSS/%40import
 * - https://developer.mozilla.org/en-US/docs/Web/CSS/url
 */
module.exports = function (content) {
  /**
   * options: {
   *   root,
   *   alias,
   *   url,
   *   import,
   *   importLoaders,
   * }
   */
  const options = getLoaderOptions(this)
  const root = options.root
  const resolve = createResolver(options.alias)
  const importUrlPrefix = getImportPrefix(this, options)

  if (this.cacheable) {
    this.cacheable()
  }

  const imports = []
  const urls = []
  content = cssReplace(content, refer => {
    // handle @import
    if (refer.type === 'import' && options.import) {
      imports.push(refer)
      return ''
    }

    // handle url(...)
    if (refer.type === 'url' && options.url && loaderUtils.isUrlRequest(refer.path, root)) {
      const id = urls.length
      urls.push(refer)
      return `__URL_${id}__`
    }

    // return original rule
    return refer.rule
  })

  // generate imports code
  const alreadyImported = {}
  const importJs = imports.filter(refer => {
    // dedupe simple @imports (without media query)
    if (!refer.condition) {
      if (alreadyImported[refer.path]) {
        return false
      }
      alreadyImported[refer.path] = true
    }
    return true
  }).map(refer => {
    // resolve with alias
    const referUrl = resolve(refer.path)

    if (!loaderUtils.isUrlRequest(referUrl, root)) {
      const url = JSON.stringify(`@import url(${referUrl});`)
      const condition = JSON.stringify(refer.condition)

      return `exports.push([module.id, ${url}, ${condition}]);`
    } else {
      const url = loaderUtils.stringifyRequest(this, importUrlPrefix + referUrl)
      const condition = JSON.stringify(refer.condition)

      return `exports.i(require(${url}), ${condition})`
    }
  }).join('\n')

  let urlEscapeHelper = ''
  let cssString = JSON.stringify(content)
  if (urls.length) {
    const escapeJsPath = loaderUtils.stringifyRequest(this, require.resolve('./escape.js'))
    urlEscapeHelper = 'var escape = require(' + escapeJsPath + ');'

    cssString = cssString.replace(/__URL_(\d+)__/g, (total, id) => {
      const refer = urls[id | 0]
      let url = resolve(refer.path)

      let suffix = ''
      let idx = url.indexOf('?#')
      if (idx < 0) {
        idx = url.indexOf('#')
      }
      if (idx > 0) {
        // idx === 0 is catched by isUrlRequest
        // in cases like url('webfont.eot?#iefix')
        suffix = url.substring(idx)
        url = url.substring(0, idx)
      }
      const urlRequest = loaderUtils.stringifyRequest(this, url)

      return `url(" + escape(require(${urlRequest})) + "${suffix})`
    })
  }

  const cssBaseJsPath = loaderUtils.stringifyRequest(this, require.resolve('./css-base.js'))
  const cssBaseHelper = `exports = module.exports = require(${cssBaseJsPath})(false);`
  const moduleJs = `exports.push([module.id, ${cssString}, ""])`

  this.callback(null, `
${urlEscapeHelper}
${cssBaseHelper}
// imports
${importJs}
// module
${moduleJs}
`.trim())
}
