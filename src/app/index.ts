import path from 'path';
import mm from 'micromatch';
import chalk from 'chalk';
import {InstallOptions, Template} from '@coge/generator';
import which from 'which';

const pkg = require('../../package.json');

const appName = path.basename(process.cwd()).replace(/[\/@\s+%:.]+?/g, '-');

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

class AppTemplate extends Template {
  _pkg?: Record<string, any>;
  _locals?: Record<string, any>;

  async init() {
    this._pkg = this.fs.readJsonSync('./package.json', {throws: false});
  }

  async questions() {
    const hasYarn = !!(await which('yarn'));

    const q = [
      {
        type: 'input',
        name: 'name',
        message: 'Name of the module',
        default: this._pkg?.name ? this._pkg.name : appName,
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description of the module',
        default: this._pkg?.description ? this._pkg.description : `${appName} library`,
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
        message: 'Email of the owner?' + chalk.gray(' (for setting package.json)'),
        default: this.user.git.email,
      },
      {
        type: 'list',
        name: 'license',
        message: 'Which license do you want to use?',
        choices: licenses,
        default: this._pkg?.license ? this._pkg.license : 'MIT',
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

  async locals(locals: Record<string, any>) {
    locals.yarn = locals.yarn ?? false;
    locals.author = locals.owner + (locals.email ? ` <${locals.email}>` : '');
    locals.year = locals.licenceYear || new Date().getFullYear().toString();
    locals.githubUsername = await this.user.github.username();
    locals.generatorVersion = pkg.version;
    this._locals = locals;
    return locals;
  }

  async filter(files: string[], locals: {license: string}) {
    const license = locals.license || 'MIT';
    //               | +ALL | -../licenses/..                   | +../licenses/<license>.txt.ejs         |
    return mm(files, ['**', `!**/licenses${path.sep}*.*`, `**/licenses${path.sep}${license}.*`], {});
  }

  async install(opts?: InstallOptions) {
    await this.spawn('git', ['init', '--quiet'], {
      cwd: this._cwd,
    });

    await this.installDependencies({
      npm: !this._locals?.yarn,
      yarn: this._locals?.yarn,
      ...opts,
    });
  }
}

export = AppTemplate;
