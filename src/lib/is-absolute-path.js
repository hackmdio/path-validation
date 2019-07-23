// MIT License
//
// Copyright (c) 2018 Adrian
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
//   The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
//   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
// import * as path from './path'
'use strict'

import * as path from './path'

const ALLOWED_SEPARATORS = ['\\', '/']

// http://www.mtu.edu/umc/services/digital/writing/characters-avoid/
const restricted = /[[\]#%&{}<>*?\s\b\0$!'"@|‘“+^`]/
const startWithSlash = /^\//
const restrictedOnLinux = /[\\:]/
const startWithDriveLetter = /^[a-zA-Z]:\\/
const restrictedOnWindows = /[/]/
const numberOfColons = (str) => (str.match(/:/g) || []).length

function trimPath (str, dirSeparator) {
  const parsed = path.parse(str)
  const hasTrailingSlash = str.charAt(str.length - 1) === dirSeparator
  const endIndex = hasTrailingSlash ? str.length - 1 : str.length

  // trim leading root and trailing slash
  return str.substring(parsed.root.length, endIndex)
}

function isAbsolute (p, dirSeparator) {
  const resolved = trimPath(path.resolve(p), dirSeparator)
  const original = trimPath(p, dirSeparator)

  return resolved === original
}

export function isAbsolutePath (str, dirSeparator = '/') {
  if (ALLOWED_SEPARATORS.indexOf(dirSeparator) < 0) {
    throw new Error(`'${dirSeparator}' is not allowed as directory separator.`)
  }

  // is string
  // not empty
  // doesn't have disallowed characters
  // resolves to absolute path
  const isCorrectPath = !!((typeof str === 'string') && str.length && !restricted.test(str) && isAbsolute(str, dirSeparator))

  if (dirSeparator === '/') {
    // posix
    // + start with slash
    // + does not contain backslash
    return isCorrectPath && startWithSlash.test(str) && !restrictedOnLinux.test(str)
  } else {
    // windows
    // + start with drive letter
    // + does not contain forward slash
    return isCorrectPath && startWithDriveLetter.test(str) && !restrictedOnWindows.test(str) && numberOfColons(str) === 1
  }
}
