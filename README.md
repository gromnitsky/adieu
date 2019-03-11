# adieu

A command line interface to [cheerio][] library; vaguely similar to
nokogiri; handy for shell scripts or makefiles.

    $ npm -g i adieu

~~~
$ adieu -h
Usage: adieu [options] [file.html | URL]

Options:
  -V, --version           output the version number
  -e, --eval <code>       JS
  -p, --print             automatically console.log the result form -e
  -r, --require <module>  preload a module (default: [])
  -h, --help              output usage information
~~~

Print all image urls from google's front page:

~~~
$ adieu -pe '$("img").map((_,v)=>$(v).attr("src")).get().join`\n`' http://google.com
/images/branding/googlelogo/1x/googlelogo_white_background_color_272x92dp.png
/textinputassistant/tia.png
~~~

Read html from the stdin:

~~~
$ curl -sL http://gnu.org | adieu -pe '$("h2").first().text()'
What is GNU?
~~~

Load html into a repl:

~~~
$ adieu http://gnu.org
Your document should be available via $
> $('a').length
107
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
