"use strict";
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const micromatch_1 = tslib_1.__importDefault(require("micromatch"));
const chalk_1 = tslib_1.__importDefault(require("chalk"));
const generator_1 = require("@coge/generator");
const which_1 = tslib_1.__importDefault(require("which"));
const pkg = require('../../package.json');
const appName = path_1.default.basename(process.cwd()).replace(/[\/@\s+%:.]+?/g, '-');
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
class AppTemplate extends generator_1.Template {
    async init() {
        this._pkg = this.fs.readJsonSync('./package.json', { throws: false });
    }
    async questions() {
        var _a, _b, _c;
        const hasYarn = !!(await (0, which_1.default)('yarn'));
        const q = [
            {
                type: 'input',
                name: 'name',
                message: 'Name of the module',
                default: ((_a = this._pkg) === null || _a === void 0 ? void 0 : _a.name) ? this._pkg.name : appName,
            },
            {
                type: 'input',
                name: 'description',
                message: 'Description of the module',
                default: ((_b = this._pkg) === null || _b === void 0 ? void 0 : _b.description) ? this._pkg.description : `${appName} library`,
            },
            {
                type: 'input',
                name: 'owner',
                message: 'Full name of package owner',
                default: this.user.git.name(),
            },
            {
                type: 'input',
                name: 'email',
                message: 'Email of the owner?' + chalk_1.default.gray(' (for setting package.json)'),
                default: this.user.git.email,
            },
            {
                type: 'list',
                name: 'license',
                message: 'Which license do you want to use?',
                choices: licenses,
                default: ((_c = this._pkg) === null || _c === void 0 ? void 0 : _c.license) ? this._pkg.license : 'MIT',
            },
        ];
        if (hasYarn) {
            q.push({
                type: 'confirm',
                name: 'yarn',
                message: 'Yarn is available. Do you prefer to use it by default?',
                default: true,
            });
        }
        return q;
    }
    async locals(locals) {
        var _a;
        locals.yarn = (_a = locals.yarn) !== null && _a !== void 0 ? _a : false;
        locals.author = locals.owner + (locals.email ? ` <${locals.email}>` : '');
        locals.year = locals.licenceYear || new Date().getFullYear().toString();
        locals.githubUsername = await this.user.github.username();
        locals.generatorVersion = pkg.version;
        this._locals = locals;
        return locals;
    }
    async filter(files, locals) {
        const license = locals.license || 'MIT';
        //               | +ALL | -../licenses/..                   | +../licenses/<license>.txt.ejs         |
        return (0, micromatch_1.default)(files, ['**', `!**/licenses${path_1.default.sep}*.*`, `**/licenses${path_1.default.sep}${license}.*`], {});
    }
    async install(opts) {
        var _a, _b;
        await this.spawn('git', ['init', '--quiet'], {
            cwd: this._cwd,
        });
        await this.installDependencies({
            npm: !((_a = this._locals) === null || _a === void 0 ? void 0 : _a.yarn),
            yarn: (_b = this._locals) === null || _b === void 0 ? void 0 : _b.yarn,
            ...opts,
        });
    }
}
module.exports = AppTemplate;
