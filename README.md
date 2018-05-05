# fast-css-loader

Blazing fast css loader for webpack (about 10 times faster than [css-loader](https://github.com/webpack-contrib/css-loader) when process large css files)

## install

```bash
npm install fast-css-loader --save-dev
```

## VS css-loader

fast-css-loader has high performance when process large css file, here is an example 
when process a **24200+ lines** css file:

- css-loader: `~2164ms`
- fast-css-loader: `~152ms`

![fast-css-loader](https://user-images.githubusercontent.com/4136679/39661927-cf76bea2-508c-11e8-85c3-4482e6916a12.gif)

### Why faster?

fast-css-loader rewrites resolving parts of `@import` and `url(...)` with RegExp 
and some tricks, it's extramely faster than postcss used by css-loader.

### Limitations

Compare with css-loader, fast-css-loader has these limitations:

- doesn't support sourceMap
- doesn't support minimize (you can minimize css with [mini-css-extract-plugin](https://www.npmjs.com/package/mini-css-extract-plugin))
- doesn't support `camelCase` option
- doesn't support css module

If you really need these features, just use original css-loader :)

## Usage

just like css-loader:

```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.(svg|bmp|gif|png|jpe?g)$/,
        loader: require.resolve('file-loader'),
        options: {
          name: '[name].[hash:8].[ext]'
        }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'fast-css-loader'   // replace you css-loader with fast-css-loader
        ]
      },
    ]
  }
}
```

## Options

|Name|Type|Default|Description|
|:--:|:--:|:-----:|:----------|
|**`root`**|`{String}`|`/`|Path to resolve URLs, URLs starting with `/` will not be translated|
|**`url`**|`{Boolean}`|`true`| Enable/Disable `url()` handling|
|**`alias`**|`{Object}`|`{}`|Create aliases to import certain modules more easily|
|**`import`** |`{Boolean}`|`true`| Enable/Disable @import handling|
|**`importLoaders`**|`{Number}`|`0`|Number of loaders applied before CSS loader|

The above listed options are consistent with css-loader, for more detail please refer to [css-loader options](https://github.com/webpack-contrib/css-loader#options)

## License

MIT
