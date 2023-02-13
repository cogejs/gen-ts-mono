"use strict";
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const micromatch_1 = tslib_1.__importDefault(require("micromatch"));
const generator_1 = require("@coge/generator");
const startsWith_1 = tslib_1.__importDefault(require("tily/string/startsWith"));
const parseNpmName = require('parse-packagejson-name');
const licenses = [
    { name: 'Apache 2.0', value: 'Apache-2.0' },
    { name: 'MIT', value: 'MIT' },
    { name: 'Mozilla Public License 2.0', value: 'MPL-2.0' },
    { name: 'BSD 2-Clause (FreeBSD) License', value: 'BSD-2-Clause-FreeBSD' },
    { name: 'BSD 3-Clause (NewBSD) License', value: 'BSD-3-Clause' },
    { name: 'Internet Systems Consortium (ISC) License', value: 'ISC' },
    { name: 'GNU AGPL 3.0', value: 'AGPL-3.0' },
    { name: 'GNU GPL 3.0', value: 'GPL-3.0' },
    { name: 'GNU LGPL 3.0', value: 'LGPL-3.0' },
    { name: 'Unlicense', value: 'unlicense' },
    { name: 'No License (Copyrighted)', value: 'UNLICENSED' },
];
class PackageTemplate extends generator_1.Template {
    async init() {
        var _a;
        this._pkg = this.fs.readJsonSync('./package.json', { throws: false });
        this._yarn = (0, startsWith_1.default)('yarn', (_a = this._pkg) === null || _a === void 0 ? void 0 : _a.packageManager);
    }
    async questions() {
        return [
            {
                type: 'input',
                name: 'name',
                message: 'Name of the package',
            },
            {
                type: 'input',
                name: 'description',
                message: 'Description of the package',
            },
            {
                type: 'list',
                name: 'license',
                message: 'Which license do you want to use?',
                choices: licenses,
                default: 'MIT',
            },
            {
                type: 'confirm',
                name: 'flat',
                message: 'Expose submodules to root',
                default: false,
            },
        ];
    }
    async locals(locals) {
        var _a, _b;
        const parsed = parseNpmName(locals.name);
        locals.yarn = this._yarn;
        locals.scopeName = parsed.scope;
        locals.projectName = parsed.fullName;
        locals.archiveName = parsed.scope ? `${parsed.scope}-${parsed.fullName}` : parsed.fullName;
        locals.author = (_b = (_a = this._pkg) === null || _a === void 0 ? void 0 : _a.author) !== null && _b !== void 0 ? _b : '';
        return locals;
    }
    async filter(files, locals) {
        const license = locals.license || 'MIT';
        //                       | +ALL | -../licenses/..             | +../licenses/<license>.txt.ejs         |
        return (0, micromatch_1.default)(files, ['**', `!**/licenses${path_1.default.sep}*.*`, `**/licenses${path_1.default.sep}${license}.*`], {});
    }
    async install(opts) {
        await this.spawn('git', ['init', '--quiet'], {
            cwd: this._cwd,
        });
        await this.installDependencies({
            npm: !this._yarn,
            yarn: this._yarn,
            ...opts,
        });
    }
}
module.exports = PackageTemplate;
