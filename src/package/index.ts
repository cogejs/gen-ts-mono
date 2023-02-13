import path from 'path';
import mm from 'micromatch';
import {InstallOptions, Template} from '@coge/generator';
import startsWith from 'tily/string/startsWith';

const parseNpmName = require('parse-packagejson-name');

const licenses = [
  {name: 'Apache 2.0', value: 'Apache-2.0'},
  {name: 'MIT', value: 'MIT'},
  {name: 'Mozilla Public License 2.0', value: 'MPL-2.0'},
  {name: 'BSD 2-Clause (FreeBSD) License', value: 'BSD-2-Clause-FreeBSD'},
  {name: 'BSD 3-Clause (NewBSD) License', value: 'BSD-3-Clause'},
  {name: 'Internet Systems Consortium (ISC) License', value: 'ISC'},
  {name: 'GNU AGPL 3.0', value: 'AGPL-3.0'},
  {name: 'GNU GPL 3.0', value: 'GPL-3.0'},
  {name: 'GNU LGPL 3.0', value: 'LGPL-3.0'},
  {name: 'Unlicense', value: 'unlicense'},
  {name: 'No License (Copyrighted)', value: 'UNLICENSED'},
];

class PackageTemplate extends Template {
  _pkg?: Record<string, any>;

  _yarn: boolean;

  async init() {
    this._pkg = this.fs.readJsonSync('./package.json', {throws: false});
    this._yarn = startsWith('yarn', this._pkg?.packageManager);
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

  async locals(locals: Record<string, any>) {
    const parsed = parseNpmName(locals.name);
    locals.yarn = this._yarn;
    locals.scopeName = parsed.scope;
    locals.projectName = parsed.fullName;
    locals.archiveName = parsed.scope ? `${parsed.scope}-${parsed.fullName}` : parsed.fullName;
    locals.author = this._pkg?.author ?? '';
    return locals;
  }

  async filter(files: string[], locals: Record<string, any>) {
    const license = locals.license || 'MIT';
    //                       | +ALL | -../licenses/..             | +../licenses/<license>.txt.ejs         |
    return mm(files, ['**', `!**/licenses${path.sep}*.*`, `**/licenses${path.sep}${license}.*`], {});
  }

  async install(opts?: InstallOptions) {
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

export = PackageTemplate;
