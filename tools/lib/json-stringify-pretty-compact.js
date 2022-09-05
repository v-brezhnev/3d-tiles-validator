/**
The MIT License (MIT)

Copyright (c) 2014, 2016, 2017, 2019, 2021, 2022 Simon Lydell

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 */

'use strict';

module.exports = stringify;

const stringOrChar = /("(?:[^\\"]|\\.)*")|[:,]/g;

function stringify(passedObj, options = {}) {
    const indent = JSON.stringify(
        [1],
        undefined,
        options.indent === undefined ? 2 : options.indent
    ).slice(2, -3);

    const maxLength =
        indent === ""
            ? Infinity
            : options.maxLength === undefined
                ? 80
                : options.maxLength;

    let { replacer } = options;

    return (function _stringify(obj, currentIndent, reserved) {
        if (obj && typeof obj.toJSON === "function") {
            obj = obj.toJSON();
        }

        const string = JSON.stringify(obj, replacer);

        if (string === undefined) {
            return string;
        }

        const length = maxLength - currentIndent.length - reserved;

        if (string.length <= length) {
            const prettified = string.replace(
                stringOrChar,
                (match, stringLiteral) => {
                    return stringLiteral || `${match} `;
                }
            );
            if (prettified.length <= length) {
                return prettified;
            }
        }

        if (replacer != null) {
            obj = JSON.parse(string);
            replacer = undefined;
        }

        if (typeof obj === "object" && obj !== null) {
            const nextIndent = currentIndent + indent;
            const items = [];
            let index = 0;
            let start;
            let end;

            if (Array.isArray(obj)) {
                start = "[";
                end = "]";
                const { length } = obj;
                for (; index < length; index++) {
                    items.push(
                        _stringify(obj[index], nextIndent, index === length - 1 ? 0 : 1) ||
                        "null"
                    );
                }
            } else {
                start = "{";
                end = "}";
                const keys = Object.keys(obj);
                const { length } = keys;
                for (; index < length; index++) {
                    const key = keys[index];
                    const keyPart = `${JSON.stringify(key)}: `;
                    const value = _stringify(
                        obj[key],
                        nextIndent,
                        keyPart.length + (index === length - 1 ? 0 : 1)
                    );
                    if (value !== undefined) {
                        items.push(keyPart + value);
                    }
                }
            }

            if (items.length > 0) {
                return [start, indent + items.join(`,\n${nextIndent}`), end].join(
                    `\n${currentIndent}`
                );
            }
        }

        return string;
    })(passedObj, "", 0);
}