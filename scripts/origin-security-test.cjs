const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const output = ts.transpileModule(fs.readFileSync('src/lib/origins.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleExports = {};
vm.runInNewContext(output, { exports: moduleExports, URL });
const allow = moduleExports.allowedRequestOrigin;
const primary = 'https://divinewall.in', alias = 'https://www.divinewall.in';
let passed = 0;
function check(actual, expected, label) { assert.equal(actual, expected, label); passed++; }
check(allow(primary, 'http://internal', primary, alias), true, 'Canonical HTTPS origin works behind proxy');
check(allow(alias, 'http://internal', primary, alias), true, 'Explicit HTTPS www alias works');
check(allow(alias, 'http://internal', primary), false, 'Unconfigured www alias is rejected');
check(allow('http://divinewall.in', 'http://internal', primary, 'http://divinewall.in'), false, 'HTTP downgrade is rejected');
check(allow('https://attacker.invalid', 'http://internal', primary, alias), false, 'Unrelated origin is rejected');
check(allow('https://divinewall.in.attacker.invalid', 'http://internal', primary, alias), false, 'Lookalike domain is rejected');
check(allow(primary + ':444', 'http://internal', primary, alias), false, 'Unexpected port is rejected');
check(allow('null', 'http://internal', primary, alias), false, 'Opaque origin is rejected');
check(allow(primary + '/login', 'http://internal', primary, alias), false, 'Origin containing a path is rejected');
check(allow(primary, 'http://internal', primary + ', www.divinewall.in', alias), false, 'Malformed canonical setting fails closed');
check(allow(alias, 'http://internal', ' ' + primary + '/ ', ' ' + alias + '/ '), true, 'Whitespace and root slash in settings normalize');
check(allow('http://localhost:3100', 'http://localhost:3100'), true, 'Local development works without configured origin');
check(allow(null, 'http://internal', primary, alias), true, 'Non-browser clients remain supported');
check(allow('https://user:pass@divinewall.in', 'http://internal', primary), false, 'Credential-bearing origin is rejected');
check(allow(alias, 'http://internal', primary, 'www.divinewall.in'), false, 'Bare hostname is not silently trusted');
console.log(`${passed} origin security checks passed`);
