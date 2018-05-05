'use strict'

const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const assert = require('assert')
const webpack = require('webpack')
const getConfig = require('./webpack.config')

const fixturesDir = path.join(__dirname, 'fixtures')

function compile(basedir, isFast) {
  const config = getConfig(basedir, isFast)
  const compiler = webpack(config)

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        console.error(err.stack || err)
        if (err.details) {
          console.error(err.details)
        }
        reject(err)
      } else {
        console.log(stats.toString({
          chunks: false, // Makes the build much quieter
          chunkModules: false,
          colors: true, // Shows colors in the console
          children: false,
          builtAt: true,
          modules: false
        }))

        resolve()
      }
    })
  })
}

function compare (basedir, files) {
  for (let file of files) {
    let actual = fs.readFileSync(path.join(basedir, 'actual', file), 'utf-8')
    let expect = fs.readFileSync(path.join(basedir, 'expect', file), 'utf-8')

    actual = actual.split('\n').filter(line => line.length > 0).join('\n')
    expect = expect.split('\n').filter(line => line.length > 0).join('\n')

    assert.equal(actual, expect)
  }
}

describe('test', function () {
  this.timeout(60000)

  it('should loader simple css', async function () {
    await compile(path.join(fixturesDir, 'simple'), false)
    await compile(path.join(fixturesDir, 'simple'), true)

    compare(path.join(fixturesDir, 'simple'), [
      'index.css'
    ])
  })

  it('should has better performace then css-loader', async function () {
    // css-loader
    let start1 = Date.now()
    console.log(chalk.cyan.bold('\n# process with css-loader:\n'))
    await compile(path.join(fixturesDir, 'performance'), false)
    let cssLoaderCost = Date.now() - start1

    // fast-css-loader
    let start2 = Date.now()
    console.log(chalk.cyan.bold('\n# process with fast-css-loader:\n'))
    await compile(path.join(fixturesDir, 'performance'), true)
    let fastCssLoaderCost = Date.now() - start2

    console.log('\n-------------------------------------')
    console.log('       CSS_LOADER COST: %s ms', cssLoaderCost)
    console.log('  FAST_CSS_LOADER COST: %s ms', fastCssLoaderCost)
    console.log('-------------------------------------\n')

    assert(fastCssLoaderCost < cssLoaderCost * 0.5)
  })
})
