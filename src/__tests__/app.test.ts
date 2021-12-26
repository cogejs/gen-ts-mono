import {Template} from '@coge/generator';
import AppTemplate = require('../app');

describe('ts-lerna/app', () => {
  it('should be a template', () => {
    expect(new AppTemplate({})).toBeInstanceOf( Template);
  });
});
