#!/usr/bin/env node
'use strict'

let fs = require('fs')
let path = require('path')
let meta = require('./package.json')
let cmd = require('commander')
let cheerio = require('cheerio')

function main() {
    let collect = (val, memo) => (memo.push(val), memo)
    cmd.version(meta.version)
	.usage('[options] [file.html | URL]')
	.option('-e, --eval <code>', 'JavaScript')
	.option('-p, --print', 'automatically console.log results from -e')
	.option('-r, --require <module>', 'preload a module', collect, [])
	.option('-R, --raw', "don't simplify cheerio objects printouts")
	.parse(process.argv)

    let src = cmd.args[0]
    parse(src).then( $ => {
	return Object.assign({	// a sandbox w/ modules
	    p: console.log.bind(console),
	    puts, $, cheerio, process, require
	}, preload(cmd.require))

    }).then( sandbox => {
	if (!cmd.raw) simplify(sandbox.$)

	if (cmd.eval) {
	    let r = evaluate(cmd.eval, sandbox)
	    if (cmd.print) console.log(r)
	} else {
	    if (!src) throw new Error('repl mode requires a file/url argument')
	    irb(sandbox)
	}
    }).catch(err)
}

async function parse(input) {
    let fetch = async input => (new URL(input), fetch_text(input))
    let html = fetch(input).catch( e => {
	if (e instanceof TypeError) return read(input)
	throw e
    })
    // use htmlparser2 as in cheerio 1.0.0-rc.3
    return cheerio.load(await html, {xml: {xmlMode: false}})
}

function read(file) {
    let stream = file ? fs.createReadStream(file) : process.stdin
    let data = []
    return new Promise( (resolve, reject) => {
	stream.on('error', reject)
	stream.on('data', chunk => data.push(chunk))
        stream.on('end', () => resolve(Buffer.concat(data)))
    })
}

function err(s) {
    console.error(progname(), 'error:', s instanceof Error ? s.message : s)
    process.exit(1)
}

function preload(list) {
    let varname = s => s.replace(/[^\w]/g, '_')
    return list.reduce( (a, c) => (a[varname(c)] = require(c), a), {})
}

function puts(str) { process.stdout.write(String(str) + "\n"); }

function simplify($) {
    let util = require('util')
    let html = nodes => {
	let r = $(nodes).toString().replace(/\s+/g, ' ').trim()
	let max = process.stdout.isTTY ? process.stdout.columns-25 : 55
	return r.length <= max ? r : r.slice(0, max) + '…'
    }

    let tag = (o, name, ctx) => Object.defineProperty(o, Symbol.toStringTag, {
        get() { return ctx.stylize(name, 'special') }
    })

    let klass_element = function(_, ctx) {
	let compact = n => n ? obj_filter(n, ['type', 'name']) : null
	let r = Object.assign(compact(this), {
	    attribs: Object.assign({}, this.attribs),
	    '[inner_html]': html(this.children),
	    parent: compact(this.parent),
	    prev: compact(this.prev),
	    next: compact(this.next),
	})
	return tag(r, 'Element', ctx)
    }

    let domhandler = require('domhandler')
    domhandler.Element.prototype[util.inspect.custom] = klass_element

    let klass_loadedcheerio = function(_, ctx) {
        let number = n => !isNaN(Number(n))
	let keys = Object.keys(this).filter( k => k === 'length' || number(k))
        keys.forEach( k => {
            if (number(k)) this[k][util.inspect.custom] = klass_element
        })
	return tag(obj_zip(keys, this), 'LoadedCheerio', ctx)
    }

    $.prototype[util.inspect.custom] = klass_loadedcheerio
}

function evaluate(str, sandbox) {
    let vm = require('vm')
    vm.createContext(sandbox)
    return vm.runInContext(str, sandbox)
}

function irb(sandbox) {
    let repl = require('repl')
    console.error('Your document should be available via $')
    let r = repl.start()
    Object.assign(r.context, sandbox)
    if (r.setupHistory) {	// since node 11.10.0
	let xdg = require('xdg-basedir')
	let file = path.join(xdg.cache, progname(), 'history')
	fs.mkdirSync(path.dirname(file), {recursive: true})
	r.setupHistory(file, () => {})
    }
}

function fetch_text(url, opt) {
    let fetcherr = r => { if (r.ok) return r; throw new Error(r.status) }
    return fetch(url, opt).then(fetcherr).then( r => r.text())
}

function progname() { return path.basename(process.argv[1]); }

function obj_filter(obj, keys) {
    return keys.reduce( (a, c) => { if (obj[c]) a[c] = obj[c]; return a }, {})
}

function obj_zip(keys, values) {
    return keys.reduce( (a, c) => (a[c] = values[c], a), {})
}

main()
