const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')

// Compile the real source in memory; do not generate build files or load .env.
module.exports = function loadTs(relative, mocks = {}) {
  const filename = path.resolve(__dirname, '..', relative)
  const source = fs.readFileSync(filename, 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText
  const loaded = new Module(filename, module)
  loaded.filename = filename
  loaded.paths = Module._nodeModulePaths(path.dirname(filename))
  const originalRequire = loaded.require.bind(loaded)
  loaded.require = name => Object.hasOwn(mocks, name) ? mocks[name] : originalRequire(name)
  loaded._compile(code, filename)
  return loaded.exports
}
