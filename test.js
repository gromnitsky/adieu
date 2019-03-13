#!/opt/bin/mocha --ui=tdd
'use strict';

let assert = require('assert')
let sh = require('child_process').spawnSync

let adieu = __dirname + '/adieu'

suite('smoke', function() {
    test('h1', function() {
	let input = '<p>text</p><h1><b>big</b> title</h1>'
	let r = sh(adieu, ['-pe', '$("h1").text()'], {input})
	assert.equal(r.stdout, "big title\n")
    })

    test('404', function() {
    	let r = sh(adieu, ['http://127.0.0.1/4d5a5d3e'])
	assert.strictEqual(r.status, 1)
    })

    test('ENOENT', function() {
    	let r = sh(adieu, ['no-such-file'])
	assert(r.stderr.toString().match(/ENOENT/))
    })

    test('invalid repl invocation', function() {
    	let r = sh(adieu, [], { input: 'foo'})
	assert(r.stderr.toString().match(/repl/))
    })
})
