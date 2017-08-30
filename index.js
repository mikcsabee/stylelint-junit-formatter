const fs = require('fs');
const xmlBuilder = require('xmlbuilder');

class JunitXmlFormatter {
  constructor(config) {
    if (config) {
      this.config = config;
    } else {
      this.config = {}
    }
  }

  get hidePassed() {
    if (typeof(this.config.hidePassed) === "boolean") {
      return this.config.hidePassed;
    }
    return false;
  }

  get hidePath() {
    if (typeof(this.config.hidePath) === "boolean") {
      return this.config.hidePath;
    }
    return false;
  }

  get output() {
    if (typeof(this.config.output) === "string") {
      return this.config.output;
    }
    return null;
  }

  format(stylelintResults) {
    const xmlRoot = xmlBuilder.create('testsuites', { encoding: 'utf-8' })
                              .att('package', 'stylelint.rules');

    const testSuites = stylelintResults.filter(testsuite => this.filter(testsuite))
                                       .map(testSuite    => this.parseSuite(testSuite));

    const xml = xmlRoot.element(testSuites)
                       .end({ pretty: true });

    if (this.output !== null) {
      fs.writeFileSync(this.output, xml);
    }

    return xml;
  }

  filter(testSuite) {
    return !(this.hidePassed && !testSuite.errored)
  }

  parseSuite(testSuite) {
    const suiteName     = this.hidePath ? testSuite.source.substring(testSuite.source.lastIndexOf("/")+1, testSuite.source.length) : testSuite.source;
    const failuresCount = testSuite.warnings.length;
    const testCases     = testSuite.errored
                        ? testSuite.warnings.map(testCase => this.parseFailedCase(testCase, suiteName))
                        : { '@name': 'stylelint.passed' };
  
    return {
      testsuite: {
        '@name':     suiteName,
        '@failures': failuresCount,
        '@errors':   failuresCount,
        '@tests':    failuresCount || '1',
        testcase:    testCases
      }
    };
  }

  parseFailedCase(testCase, source) {
    const {
      rule,
      severity,
      text,
      line,
      column
    } = testCase;
  
    return {
      '@name': rule,
      failure: {
        '@type':    severity,
        '@message': text,
        '#text':    `On line ${line}, column ${column} in ${source}`
      }
    };
  }
}

module.exports = (config) => {
  let formatter = new JunitXmlFormatter(config);

  return (stylelintResults) => {
    return formatter.format(stylelintResults);
  };
}
