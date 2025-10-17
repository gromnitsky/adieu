A command line interface to [cheerio][] library; vaguely similar to
nokogiri; handy for shell scripts or makefiles.

    $ npm -g i adieu

~~~
$ adieu -h
Usage: adieu [options] [file.html | URL]

Options:
  -V, --version           output the version number
  -e, --eval <code>       JavaScript
  -p, --print             automatically console.log results from -e
  -r, --require <module>  preload a module (default: [])
  -R, --raw               don't simplify cheerio objects printouts
  -h, --help              output usage information
~~~

Print all image urls from google's front page:

~~~
$ adieu -pe '$("img").map((_,v)=>$(v).attr("src")).get().join`\n`' https://google.com
/images/branding/googlelogo/1x/googlelogo_white_background_color_272x92dp.png
/textinputassistant/tia.png
~~~

Read html from the stdin:

~~~
$ curl -sL https://www.gnu.org | adieu -pe '$("h2").first().text()'
What is GNU?
~~~

Load html into a repl:

~~~
$ adieu https://google.com
Your document should be available via $
> $('div').length
11
> $('div')[0]
Object [Element] {
  type: 'tag',
  name: 'div',
  attribs: { id: 'mngb' },
  '[inner_html]': '<div id="gbar"><nobr><b class="gb1">&#x41f;&#x43e;&#x44…',
  parent: { type: 'tag', name: 'body' },
  prev: { type: 'script', name: 'script' },
  next: { type: 'tag', name: 'center' }
}
~~~

## Helpers

| name      | desc                                                        |
| --------- | ----------------------------------------------------------- |
| `cheerio` |                                                             |
| `$`       | a cheerio instance w/ the loaded document                   |
| `p`       | alias to `console.log`                                      |
| `puts`    | convert an arg to a string & write the result to the stdout |


## License

MIT

[cheerio]: https://github.com/cheeriojs/cheerio
