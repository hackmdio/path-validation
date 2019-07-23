/* eslint-env node, mocha */
import { isAbsolutePath } from '../'

import * as assert from 'assert'

describe('isAbsolutePath', function () {
  it('should run', function () {
    assert.ok(isAbsolutePath('/.../as/.../df/test/asdfasdf.md', '/'))
  })
})
