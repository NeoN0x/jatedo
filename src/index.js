const { Command, flags } = require('@oclif/command')
const { cli } = require('cli-ux')
const fs = require('fs')
const path = require('path')
const { parse, tokenizers } = require('comment-parser/lib')

// Inspired from https://gist.github.com/kethinov/6658166#gistcomment-2037451
const walkSync = (dir) => fs.lstatSync(dir).isDirectory()
  ? fs.readdirSync(dir).map(f => {
    return walkSync(path.join(dir, f))
  })
  : dir

class JatedoCommand extends Command {
  async run () {
    const { flags } = this.parse(JatedoCommand)
    const srcPath = flags.input
    const dstPath = flags.output
    const extFilters = Array.isArray(flags.extFilter)
      ? flags.extFilter
      : [flags.extFilter]

    this.log(`JaTeDo - scanning ${srcPath} looking for test jsdoc blocs.\n`)

    cli.action.start('Generating documentation')

    // Check extFilters parameter
    for (const extFilter of extFilters) {
      if (extFilter[0] !== '.') return this.error(`Extension filter "${extFilter}" do not start with a point. Please append it. Ex: "-e .${extFilter}"`)
    }

    const files = walkSync(srcPath).flat().filter(p => extFilters.includes(path.extname(p)))

    if (files.length === 0) return this.error('No files matched the filters or the directory is empty. Please check the run command.')

    const data = {
      modules: {},
      generatedAt: (new Date().toISOString()),
      jatedoVersion: require('../package.json').version
    }

    for (const file of files) {
      if (flags.verbose) console.log(`Analyzing ${file}...`)

      // NOTE: these are the recognized tags
      const currentObject = {
        module: null,
        feature: null,
        case: null
      }

      const content = fs.readFileSync(file, 'utf8')
      const parsed = parse(content, {
        tokenizers: [tokenizers.tag(), tokenizers.description('preserve')]
      })

      for (const parsedObjects of parsed) {
        for (const tagObject of parsedObjects.tags) {
          const tagContent = tagObject.description

          switch (tagObject.tag) {
            case 'testModule':
              // Place current cursor in module and reset case
              currentObject.module = tagContent
              currentObject.case = null

              // Create tag if not exists
              if (data.modules[tagContent] === undefined) {
                data.modules[tagContent] = {
                  expectations: [],
                  features: {},
                  notes: [],
                  tags: []
                }
              }
              break
            case 'testFeature':
              if (currentObject.module === null) this.error(`Tag "testFeature" must be precedeed by a "testModule" tag, file ${file} line ${tagObject.source[0].number}`)

              currentObject.feature = tagContent

              // If feature do not exists, create it
              if (data.modules[currentObject.module].features[tagContent] === undefined) {
                data.modules[currentObject.module].features[tagContent] = {
                  cases: {},
                  expectations: [],
                  notes: [],
                  tags: []
                }
              }

              break
            case 'testNote':
              if (currentObject.module === null) this.error(`Tag "testNote" must be precedeed by a "testModule" tag, file ${file} line ${tagObject.source[0].number}`)

              if (currentObject.case === null) {
                data.modules[currentObject.module].notes.push(tagContent)
              } else {
                data.modules[currentObject.module].features[currentObject.feature].cases[currentObject.case].notes.push(tagContent)
              }
              break
            case 'testCase':
              if (currentObject.module === null) this.error(`Tag "testCase" must be precedeed by a "testModule" tag, file ${file} line ${tagObject.source[0].number}`)
              if (currentObject.feature === null) this.error(`Tag "testCase" must be precedeed by a "testFeature" tag, file ${file} line ${tagObject.source[0].number}`)

              currentObject.case = tagContent

              if (data.modules[currentObject.module].features[currentObject.feature].cases[tagContent] === undefined) {
                data.modules[currentObject.module].features[currentObject.feature].cases[tagContent] = {
                  result: null,
                  tags: [],
                  expectations: [],
                  notes: []
                }
              }

              break
            case 'testResult':
              if (currentObject.module === null) this.error(`Tag "testResult" must be precedeed by a "testModule" tag, file ${file} line ${tagObject.source[0].number}`)
              if (currentObject.feature === null) this.error(`Tag "testResult" must be precedeed by a "testFeature" tag, file ${file} line ${tagObject.source[0].number}`)
              if (currentObject.case === null) this.error(`Tag "testResult" must be precedeed by a "testCase" tag, file ${file} line ${tagObject.source[0].number}`)

              data.modules[currentObject.module].features[currentObject.feature].cases[currentObject.case].result = tagContent
              break
            case 'testExpectation':
              if (currentObject.module === null) this.error(`Tag "testExpectation" must be precedeed by a "testModule" tag, file ${file} line ${tagObject.source[0].number}`)

              if (currentObject.feature === null) {
                data.modules[currentObject.module].expectations.push(tagContent)
              } else if (currentObject.case === null) {
                data.modules[currentObject.module].features[currentObject.feature].expectations.push(tagContent)
              } else {
                data.modules[currentObject.module].features[currentObject.feature].cases[currentObject.case].expectations.push(tagContent)
              }
              break
            case 'testTag':
              if (currentObject.module === null) this.error(`Tag "testTag" must be precedeed by a "testModule" tag, file ${file} line ${tagObject.source[0].number}`)

              if (currentObject.feature === null) {
                data.modules[currentObject.module].tags.push(tagContent)
              } else if (currentObject.case === null) {
                data.modules[currentObject.module].features[currentObject.feature].tags.push(tagContent)
              } else {
                data.modules[currentObject.module].features[currentObject.feature].cases[currentObject.case].tags.push(tagContent)
              }
              break
            default:
              this.error(`Invalid JaTeDo tag "${tagObject.tag}" in file ${file} line ${tagObject.source[0].number}`)
          }
        }
      }
    }

    // Create output dest folder is needed
    if (!fs.existsSync(dstPath)) fs.mkdirSync(dstPath)

    // Create data
    const jsonData = JSON.stringify(data, null, 2)

    // Create data file
    fs.writeFileSync(path.join(dstPath, 'data.json'), jsonData)

    // Copy html template
    let templateContent = fs.readFileSync(path.join(__dirname, 'res', 'doc.html'), 'utf8')
    templateContent = templateContent.replace('%DATA%', jsonData)

    fs.writeFileSync(path.join(dstPath, 'doc.html'), templateContent)

    setTimeout(() => {
      cli.action.stop(`✔️\n\nDocumentation generated. Open ${dstPath}`)
    }, 1000)
  }
}

JatedoCommand.description = `Javascript Test Documentator - Lightweight and simple tool to generate documentation from jsdoc-like comments block. See README.md for detailed informations.

Usage :

$  jatedo -i ./srcDirToScan -o ./outputDir


Please note that input (-i or --in) and output (-o or --out) paths are required in order to proceed.

More information on README on the expected jsdoc-like format and output.
`

JatedoCommand.flags = {
  // add --version flag to show CLI version
  version: flags.version({ char: 'n' }),
  // add --help flag to show CLI version
  help: flags.help({ char: 'h' }),
  // input folder, required
  input: flags.string({
    char: 'i',
    description: 'Input folder',
    required: true
  }),
  // output folder, required
  output: flags.string({
    char: 'o',
    description: 'Output folder',
    required: true
  }),
  // extension filter, optional
  extFilter: flags.string({
    char: 'e',
    description: 'Extension to analyse. Will ignore all other files. Can be set multiple times to analyze multiple extensions',
    default: '.js',
    multiple: true
  }),
  // verbose output
  verbose: flags.boolean({
    char: 'v',
    description: 'Enable verbose output'
  })
}

module.exports = JatedoCommand
