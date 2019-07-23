// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.
/* eslint-disable */
'use strict'

// /
const CHAR_FORWARD_SLASH = 47
// .
const CHAR_DOT = 46

function validateString (value, name) {
  if (typeof value !== 'string') {
    throw new TypeError('path must be a string')
  }
}

function isPosixPathSeparator(code) {
  return code === CHAR_FORWARD_SLASH;
}

function normalizeString(path, allowAboveRoot, separator, isPathSeparator) {
  let res = '';
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let code = 0;
  for (var i = 0; i <= path.length; ++i) {
    if (i < path.length)
      code = path.charCodeAt(i);
    else if (isPathSeparator(code))
      break;
    else
      code = CHAR_FORWARD_SLASH;

    if (isPathSeparator(code)) {
      if (lastSlash === i - 1 || dots === 1) {
        // NOOP
      } else if (dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 ||
          res.charCodeAt(res.length - 1) !== CHAR_DOT ||
          res.charCodeAt(res.length - 2) !== CHAR_DOT) {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf(separator);
            if (lastSlashIndex === -1) {
              res = '';
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength = res.length - 1 - res.lastIndexOf(separator);
            }
            lastSlash = i;
            dots = 0;
            continue;
          } else if (res.length !== 0) {
            res = '';
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          res += res.length > 0 ? `${separator}..` : '..';
          lastSegmentLength = 2;
        }
      } else {
        res += (res.length > 0 ? separator : '') + path.slice(lastSlash + 1, i);
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (code === CHAR_DOT && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}

export function resolve (...args) {
  let resolvedPath = '';
  let resolvedAbsolute = false;

  for (var i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    const path = i >= 0 ? args[i] : process.cwd();

    validateString(path, 'path');

    // Skip empty entries
    if (path.length === 0) {
      continue;
    }

    resolvedPath = `${path}/${resolvedPath}`;
    resolvedAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH;
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute, '/',
    isPosixPathSeparator);

  if (resolvedAbsolute) {
    return `/${resolvedPath}`;
  }
  return resolvedPath.length > 0 ? resolvedPath : '.';
}

export function parse (path) {
  validateString(path, 'path')

  const parsedResult = {
    root: '',
    dir: '',
    base: '',
    name: '',
    ext: ''
  }
  if (path.length === 0) { return parsedResult }
  const isAbsolute = path.charCodeAt(0) === CHAR_FORWARD_SLASH
  var start
  if (isAbsolute) {
    parsedResult.root = '/'
    start = 1
  } else {
    start = 0
  }
  var startDot = -1
  var startPart = 0
  var end = -1
  var matchedSlash = true
  var i = path.length - 1

  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  var preDotState = 0

  // Get non-dir info
  for (; i >= start; --i) {
    const code = path.charCodeAt(i)
    if (code === CHAR_FORWARD_SLASH) {
      // If we reached a path separator that was not part of a set of path
      // separators at the end of the string, stop now
      if (!matchedSlash) {
        startPart = i + 1
        break
      }
      continue
    }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false
      end = i + 1
    }
    if (code === CHAR_DOT) {
      // If this is our first dot, mark it as the start of our extension
      if (startDot === -1) { startDot = i } else if (preDotState !== 1) { preDotState = 1 }
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1
    }
  }

  if (end !== -1) {
    const start = startPart === 0 && isAbsolute ? 1 : startPart
    if (startDot === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      (preDotState === 1 &&
        startDot === end - 1 &&
        startDot === startPart + 1)) {
      parsedResult.base = parsedResult.name = path.slice(start, end)
    } else {
      parsedResult.name = path.slice(start, startDot)
      parsedResult.base = path.slice(start, end)
      parsedResult.ext = path.slice(startDot, end)
    }
  }

  if (startPart > 0) { parsedResult.dir = path.slice(0, startPart - 1) } else if (isAbsolute) { parsedResult.dir = '/' }

  return parsedResult
}
