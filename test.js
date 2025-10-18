#!/usr/bin/env -S mocha --ui=tdd
'use strict';

let assert = require('assert')
let fs = require('fs')
let sh = require('child_process').spawnSync

let adieu = __dirname + '/adieu.js'
let chunk1 = '<p>text</p><h1><b>big</b> title</h1>'
let chunk2 = '<p>foo</p><p>bar</p>\n'

suite('smoke', function() {
    suiteSetup(function () {
        this.tmp_dir = fs.mkdtempSync(__dirname + "/tmp.")
        this.chunk1_file = this.tmp_dir + '/chunk1.html'
        fs.writeFileSync(this.chunk1_file, chunk1)
    })

    suiteTeardown(function () {
        fs.rmSync(this.tmp_dir, { recursive: true, force: true })
    })

    test('usage', function() {
        let r = sh(adieu)
        assert.equal(r.stderr,
                     fs.readFileSync(__dirname + '/usage.txt').toString())
    })

    test('404', function() {
    	let r = sh(adieu, ['http://127.0.0.1/4d5a5d3e'])
	assert.strictEqual(r.status, 1)
    })

    test('ENOENT', function() {
    	let r = sh(adieu, ['no-such-file'])
	assert(r.stderr.toString().match(/ENOENT/))
    })

    test('extract text from stdin', function() {
        let r = sh(adieu, ['-pe', '$("h1").text()'], {input: chunk1})
        assert.equal(r.stdout, "big title\n")
    })

    test('extract text from file', function() {
        let r = sh(adieu, ['-pe', '$("h1").text()', this.chunk1_file])
        assert.equal(r.stdout, "big title\n")
    })

    test('prettify LoadedCheerio', function() {
        let r = sh(adieu, ['-pe', '$("p")'], {input: chunk2})
        assert.equal(r.stdout.toString(), `Object [LoadedCheerio] {
  '0': Object [Element] {
    type: 'tag',
    name: 'p',
    attribs: {},
    '[inner_html]': 'foo',
    parent: { type: 'root' },
    prev: null,
    next: { type: 'tag', name: 'p' }
  },
  '1': Object [Element] {
    type: 'tag',
    name: 'p',
    attribs: {},
    '[inner_html]': 'bar',
    parent: { type: 'root' },
    prev: { type: 'tag', name: 'p' },
    next: { type: 'text' }
  },
  length: 2
}
`)
    })

    test('prettify Element', function() {
        let r = sh(adieu, ['-pe', '$("p")[0]'], {input: chunk2})
        assert.equal(r.stdout.toString(), `Object [Element] {
  type: 'tag',
  name: 'p',
  attribs: {},
  '[inner_html]': 'foo',
  parent: { type: 'root' },
  prev: null,
  next: { type: 'tag', name: 'p' }
}
`)
    })

})
