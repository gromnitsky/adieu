#!/usr/bin/env node
'use strict'

let fs = require('fs')
let path = require('path')
let util = require('util')
let meta = require('./package.json')
let cheerio = require('cheerio/slim') // use htmlparser2

// (1) if no args, print usage
// (2) if no -e, start repl
// (3) if -e, load a file or stdin
async function main() {
    let options = {
        e: { type: 'string' },
        p: { type: 'boolean' },
        r: { type: 'string', multiple: true, default: [] },
        R: { type: 'boolean' },
        V: { type: 'boolean' },
    }
    let params; try {
        params = util.parseArgs({ options, allowPositionals: true })
    } catch (e) {
        console.error(e.message)
        await usage()
    }

    if (params.values.V) { console.log(meta.version); process.exit(0) }

    let load = () => {
        return load_html(params.positionals[0]).then( html => {
            return cheerio.load(html, {xml: {xmlMode: false}})
        }).then( $ => {
            if (!params.values.R) simplify($)
            return $
        })
    }

    let sandbox = $ => {
        return Object.assign({
            p: console.log.bind(console),
            puts, $, cheerio
        }, preload(params.values.r))
    }

    if (params.values.e == null) {
        if (!params.positionals.length) await usage()      // (1)
        load().then( $ => { irb(sandbox($)) }).catch(errx) // (2)

    } else {
        load().then( $ => {                                // (3)
            let r = evaluate(params.values.e, sandbox($))
            if (params.values.p) console.log(r)
        }).catch(errx)
    }
}

async function usage() {
    console.error((await read(__dirname + '/usage.txt')).toString().trim())
    process.exit(1)
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

function load_html(file) {
    if (/^https?:\/\//.test((file||'').trim())) return fetch_text(file)
    return read(file)
}

function errx(...s) {
    if (!process.env.V) s = s.map( v => v instanceof Error ? v.message : v)
    console.error(meta.name, 'error:', ...s)
    process.exit(1)
}

function preload(list) {
    let varname = s => s.replace(/[^\w]/g, '_')
    return list.reduce( (a, c) => (a[varname(c)] = require(c), a), {})
}

function puts(str) { process.stdout.write(String(str) + "\n"); }

function simplify($) {
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
    console.error('Your document is stored in $')
    let r = repl.start()
    Object.assign(r.context, sandbox)
    if (r.setupHistory) {	// since node 11.10.0
	let xdg = require('xdg-basedir')
        let file = path.join(xdg.xdgCache, meta.name, 'history')
	fs.mkdirSync(path.dirname(file), {recursive: true})
	r.setupHistory(file, () => {})
    }
}

function fetch_text(url, opt) {
    let fetcherr = r => { if (r.ok) return r; throw new Error(r.status) }
    return fetch(url, opt).then(fetcherr).then( r => r.text())
}

function obj_filter(obj, keys) {
    return keys.reduce( (a, c) => { if (obj[c]) a[c] = obj[c]; return a }, {})
}

function obj_zip(keys, values) {
    return keys.reduce( (a, c) => (a[c] = values[c], a), {})
}

main()
