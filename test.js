const fs = require('fs');
const tape = require('tape');
const xml2js = require('xml2js');
const stylelinitJunitFormatter = require('./index');

const mockPassingTest = [
  {
    source: 'path/to/fileA.css',
    errored: false,
    warnings: [],
    deprecations: [],
    invalidOptionWarnings: [],
    ignored: false
  },
  {
    source: 'path/to/fileB.css',
    errored: false,
    warnings: [],
    deprecations: [],
    invalidOptionWarnings: [],
    ignored: false
  },
  {
    source: 'path/to/fileC.css',
    errored: false,
    warnings: [],
    deprecations: [],
    invalidOptionWarnings: [],
    ignored: false
  }
];

const expectedPassingXml = `<?xml version="1.0" encoding="utf-8"?>
<testsuites package="stylelint.rules">
  <testsuite name="path/to/fileA.css" failures="0" errors="0" tests="1">
    <testcase name="stylelint.passed"/>
  </testsuite>
  <testsuite name="path/to/fileB.css" failures="0" errors="0" tests="1">
    <testcase name="stylelint.passed"/>
  </testsuite>
  <testsuite name="path/to/fileC.css" failures="0" errors="0" tests="1">
    <testcase name="stylelint.passed"/>
  </testsuite>
</testsuites>`;

const mockFailingTest = [
  {
    source: 'path/to/fileA.css',
    errored: false,
    warnings: [],
    deprecations: [],
    invalidOptionWarnings: [],
    ignored: false
  },
  {
    source: 'path/to/fileB.css',
    errored: true,
    warnings: [
      {
        line: 7,
        column: 3,
        rule: 'declaration-block-properties-order',
        severity: 'error',
        text: 'Expected quot;colorquot; to come before quot;font-weightquot; (declaration-block-properties-order)'
      },
      {
        line: 8,
        column: 3,
        rule: 'shorthand-property-no-redundant-values',
        severity: 'error',
        text: 'Unexpected longhand value #39;0 2rem 1.5rem 2rem#39; instead of #39;0 2rem 1.5rem#39; (shorthand-property-no-redundant-values)'
      },
    ],
    deprecations: [],
    invalidOptionWarnings: [],
    ignored: false
  },
  {
    source: 'path/to/fileC.css',
    errored: false,
    warnings: [],
    deprecations: [],
    invalidOptionWarnings: [],
    ignored: false
  }
];

const expectedFailingXmlShowPassed = `<?xml version="1.0" encoding="utf-8"?>
<testsuites package="stylelint.rules">
  <testsuite name="fileA.css" failures="0" errors="0" tests="1">
    <testcase name="stylelint.passed"/>
  </testsuite>
  <testsuite name="fileB.css" failures="2" errors="2" tests="2">
    <testcase name="declaration-block-properties-order">
      <failure type="error" message="Expected quot;colorquot; to come before quot;font-weightquot; (declaration-block-properties-order)">On line 7, column 3 in fileB.css</failure>
    </testcase>
    <testcase name="shorthand-property-no-redundant-values">
      <failure type="error" message="Unexpected longhand value #39;0 2rem 1.5rem 2rem#39; instead of #39;0 2rem 1.5rem#39; (shorthand-property-no-redundant-values)">On line 8, column 3 in fileB.css</failure>
    </testcase>
  </testsuite>
  <testsuite name="fileC.css" failures="0" errors="0" tests="1">
    <testcase name="stylelint.passed"/>
  </testsuite>
</testsuites>`;

const expectedFailingXmlHidePassed = `<?xml version="1.0" encoding="utf-8"?>
<testsuites package="stylelint.rules">
  <testsuite name="path/to/fileB.css" failures="2" errors="2" tests="2">
    <testcase name="declaration-block-properties-order">
      <failure type="error" message="Expected quot;colorquot; to come before quot;font-weightquot; (declaration-block-properties-order)">On line 7, column 3 in path/to/fileB.css</failure>
    </testcase>
    <testcase name="shorthand-property-no-redundant-values">
      <failure type="error" message="Unexpected longhand value #39;0 2rem 1.5rem 2rem#39; instead of #39;0 2rem 1.5rem#39; (shorthand-property-no-redundant-values)">On line 8, column 3 in path/to/fileB.css</failure>
    </testcase>
  </testsuite>
</testsuites>`;

tape('It outputs a correct .xml for passing testsuites', (test) => {
  const output = stylelinitJunitFormatter()(mockPassingTest);
  test.equal(output, expectedPassingXml, 'It matches expectation');
  test.doesNotThrow(() => {
    xml2js.parseString(output, (error) => {
      if (error) throw error;
    });
  }, 'It outputs valid xml');
  test.end();
});

tape('It outputs a correct .xml for failing testsuites - show passed + hide path', (test) => {
  const config = {
    hidePassed:false,
    hidePath:true
  };
  const output = stylelinitJunitFormatter(config)(mockFailingTest);
  test.equal(output, expectedFailingXmlShowPassed, 'It matches expectation');
  test.doesNotThrow(() => {
    xml2js.parseString(output, (error) => {
      if (error) throw error;
    });
  }, 'It outputs valid xml');
  test.end();
});

tape('It outputs a correct .xml for failing testsuites - hide passed', (test) => {
  const output = stylelinitJunitFormatter({hidePassed:true})(mockFailingTest);
  test.equal(output, expectedFailingXmlHidePassed, 'It matches expectation');
  test.doesNotThrow(() => {
    xml2js.parseString(output, (error) => {
      if (error) throw error;
    });
  }, 'It outputs valid xml');
  test.end();
});

tape('It writes outputs into a file', (test) => {
  let output = "test.xml";
  const config = {
    hidePassed:true,
    hidePath:false,
    output: output
  };
  if (fs.existsSync(output)) {
    fs.unlinkSync(output);
  }
  stylelinitJunitFormatter(config)(mockFailingTest);

  let contents = fs.readFileSync(output, "UTF-8");
  test.equal(contents, expectedFailingXmlHidePassed, 'It matches expectation');

  fs.unlinkSync(output);
  test.end();
});