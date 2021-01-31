/**
 * jshiyou (https://github.com/exom-dev/jshiyou)
 * Simple testing tool for Node.js
 *
 * This project is licensed under the MIT license.
 * Copyright (c) 2021 The Exom Developers (https://github.com/exom-dev)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
 * LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var tests = {};
var isSilent = false;

// These are used for pretty-printing.
var maxCategoryLen = 0;
var maxNameLen = 0;

module.exports = {
    test: (category, name, handler) => {
        if(!(category && (typeof category === 'string' && !(category instanceof String))))
            throw "Invalid argument 'category' (expected String)";
        if(!(name && (typeof name === 'string' && !(name instanceof String))))
            throw "Invalid argument 'name' (expected String)";
        if(!(handler && (typeof handler === 'function')))
            throw "Invalid argument 'handler' (expected Function)";

        // Reserved for storing the max name length in the category.
        if(name === '$')
            throw "Test name cannot be '$'"

        if(!tests[category]) {
            tests[category] = {};

            if(maxCategoryLen < category.length)
                maxCategoryLen = category.length;
        } else if(tests[category][name] !== undefined) {
            throw `A test with the name '${name}' already exists in the '${category}' category`
        }

        tests[category][name] = handler;

        // Store the max name length for pretty-printing.
        if((tests[category]['$'] || -1) < name.length) {
            // Longest name in this category.
            tests[category]['$'] = name.length;

            // Longest name in all categories.
            if(maxNameLen < name.length)
                maxNameLen = name.length;
        }
    },
    run: (category) => {
        if(category) {
            if(!tests[category])
                throw `Category '${category}' does not exist`;

            print(`\n[shiyou] Running ${category} tests\n\n${'='.repeat(22 + category.length + tests[category]['$'])}\n\n`);

            let entries = Object.entries(tests[category]);
            let failCount = runCategory(category, entries);

            print(`${'='.repeat(22 + category.length + tests[category]['$'])}\n\n`)

            if(failCount > 0) {
                print(`[FAILED] ${failCount}/${entries.length - 1} tests failed (${parseFloat((100 - (failCount / (entries.length - 1)) * 100).toFixed(2))}% passed)\n`);
                return false;
            } else {
                print('[PASSED] All tests passed\n\n');
                return true;
            }
        } else {
            let testEntries = Object.entries(tests);

            print(`\n[shiyou] Running all tests\n\n${'='.repeat(22 + maxCategoryLen + maxNameLen)}\n\n`);

            let failCount = 0;
            let totalCount = 0;

            for(let i = 0; i < testEntries.length; ++i) {
                let entries = Object.entries(testEntries[i][1]);

                failCount += runCategory(testEntries[i][0], entries, maxCategoryLen, maxNameLen);
                totalCount += entries.length - 1;
            }

            print(`${'='.repeat(22 + maxCategoryLen + maxNameLen)}\n\n`)

            if(failCount > 0) {
                print(`[FAILED] ${failCount}/${totalCount} tests failed (${parseFloat((100 - (failCount / (totalCount)) * 100).toFixed(2))}% passed)\n\n`);
                return false;
            } else {
                print('[PASSED] All tests passed\n\n');
                return true;
            }
        }
    },
    silent: (value) => {
        isSilent = (value !== false);
    },
    reset: () => {
        tests = {};
        isSilent = false;
        maxCategoryLen = 0;
        maxNameLen = 0;
    }
}

function print(message) {
    if(!isSilent)
        process.stdout.write(message);
}

function runCategory(category, entries, categorySpacing, nameSpacing) {
    let failCount = 0;

    if(!categorySpacing)
        categorySpacing = category.length;
    if(!nameSpacing)
        nameSpacing = tests[category]['$'];

    for(let i = 0; i < entries.length; ++i) {
        // Reserved.
        if(entries[i][0] === '$')
            continue;

        print(`Test    ${category + ' '.repeat(4 + categorySpacing - category.length)}${entries[i][0]}`);

        let passed;

        try { passed = entries[i][1](); } catch { passed = false; }

        print(' '.repeat(4 + nameSpacing - entries[i][0].length));

        if(passed) {
            print('passed\n');
        } else {
            print('FAILED\n');
            ++failCount;
        }
    }

    print('\n');

    return failCount;
}