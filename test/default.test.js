'use strict';

const expect = require('chai').expect,
  sinon = require('sinon'),
  webpack = {
    cacheable: sinon.spy(),
    callback: sinon.spy(function() {
      if (webpack.next) {
        const args = Array.from(arguments);
        setTimeout(() => { webpack.next.apply(null, args); }, 0);
      }
    }),
    async: sinon.spy(() => webpack.callback)
  },
  loader = require('../');

function resetAll(context) {
  const DEFAULT_PROPS = {
    query: {},
    loaderIndex: 0,
    resourceQuery: null,
    next: null
  };
  Object.keys(DEFAULT_PROPS).forEach(propName => {
    webpack[propName] =
      context.hasOwnProperty(propName) ? context[propName] : DEFAULT_PROPS[propName];
  });

  webpack.cacheable.resetHistory();
  webpack.async.resetHistory();
  webpack.callback.resetHistory();
}

describe('flow for `procedure`', () => {

  describe('Synchronous mode', () => {

    it('should return edited string', () => {
      function procedure(content, options) {
        expect(options.sourceMap).to.equal('<MAP>');
        expect(options.meta).to.equal('<META>');
        return `${content}<procedure>`;
      }

      resetAll({query: {procedure}});
      expect(loader.call(webpack, 'INPUT', '<MAP>', '<META>')).to.equal('INPUT<procedure>');
      expect(webpack.async.notCalled).to.be.true;
      expect(webpack.callback.notCalled).to.be.true;

      resetAll({query: {procedure, toCode: true}});
      expect(loader.call(webpack, 'INPUT', '<MAP>', '<META>'))
        .to.equal('module.exports = "INPUT<procedure>";');
      expect(webpack.async.notCalled).to.be.true;
      expect(webpack.callback.notCalled).to.be.true;
    });

    it('should return a value even if it is not string (Array)', () => {
      const passedValue = [1, 2, 3];
      function procedure(content, options) {
        expect(options.sourceMap).to.equal('<MAP>');
        expect(options.meta).to.equal('<META>');
        return passedValue;
      }

      resetAll({query: {procedure}});
      expect(loader.call(webpack, 'INPUT', '<MAP>', '<META>')).to.equal(passedValue);
      expect(webpack.async.notCalled).to.be.true;
      expect(webpack.callback.notCalled).to.be.true;

      resetAll({query: {procedure, toCode: true}});
      expect(loader.call(webpack, 'INPUT', '<MAP>', '<META>'))
        .to.equal('module.exports = [1,2,3];');
      expect(webpack.async.notCalled).to.be.true;
      expect(webpack.callback.notCalled).to.be.true;
    });

    it('should return a value even if it is `null`', () => {
      function procedure(content, options) {
        expect(options.sourceMap).to.equal('<MAP>');
        expect(options.meta).to.equal('<META>');
        return null;
      }

      resetAll({query: {procedure}});
      expect(loader.call(webpack, 'INPUT', '<MAP>', '<META>')).to.be.null;
      expect(webpack.async.notCalled).to.be.true;
      expect(webpack.callback.notCalled).to.be.true;

      resetAll({query: {procedure, toCode: true}});
      expect(loader.call(webpack, 'INPUT', '<MAP>', '<META>'))
        .to.equal('module.exports = null;');
      expect(webpack.async.notCalled).to.be.true;
      expect(webpack.callback.notCalled).to.be.true;
    });

    it('should return a value even if it is `undefined`', () => {
      function procedure(content, options) {
        expect(options.sourceMap).to.equal('<MAP>');
        expect(options.meta).to.equal('<META>');
      }

      resetAll({query: {procedure}});
      expect(loader.call(webpack, 'INPUT', '<MAP>', '<META>')).to.be.undefined;
      expect(webpack.async.notCalled).to.be.true;
      expect(webpack.callback.notCalled).to.be.true;

      resetAll({query: {procedure, toCode: true}});
      expect(loader.call(webpack, 'INPUT', '<MAP>', '<META>'))
        .to.equal('module.exports = undefined;');
      expect(webpack.async.notCalled).to.be.true;
      expect(webpack.callback.notCalled).to.be.true;
    });

  });

  describe('Asynchronous mode', () => {

    it('should return edited string', done => {
      function procedureSync(content, options) {
        expect(options.sourceMap).to.equal('<MAP>');
        expect(options.meta).to.equal('<META>');
        return `${content}<procedure>`;
      }

      function procedure(content, options, procDone) {
        procDone(null, procedureSync(content, options), options.sourceMap, options.meta);
        return 'DUMMY'; // This is not returned by loader
      }

      resetAll({
        query: {procedure},
        next: (error, content, map, meta) => {
          expect(error).to.be.null;
          expect(map).to.equal('<MAP>');
          expect(meta).to.equal('<META>');
          expect(content).to.equal('INPUT<procedure>');
          expect(webpack.async.calledOnce).to.be.true;
          expect(webpack.callback.calledOnceWithExactly(
            null, 'INPUT<procedure>', '<MAP>', '<META>')).to.be.true;

          resetAll({
            query: {procedure, toCode: true},
            next: (error, content, map, meta) => {
              expect(error).to.be.null;
              expect(map).to.equal('<MAP>');
              expect(meta).to.equal('<META>');
              expect(content).to.equal('module.exports = "INPUT<procedure>";');
              expect(webpack.async.calledOnce).to.be.true;
              expect(webpack.callback.calledOnceWithExactly(
                null, 'module.exports = "INPUT<procedure>";', '<MAP>', '<META>')).to.be.true;

              done();
            }
          });
          expect(loader.call(webpack, 'INPUT', '<MAP>', '<META>')).to.be.undefined; // always undefined
        }
      });
      expect(loader.call(webpack, 'INPUT', '<MAP>', '<META>')).to.be.undefined; // always undefined
    });

    it('should return a value even if it is not string (Array)', done => {
      const passedValue = [1, 2, 3];
      function procedureSync(content, options) {
        expect(options.sourceMap).to.equal('<MAP>');
        expect(options.meta).to.equal('<META>');
        return passedValue;
      }

      function procedure(content, options, procDone) {
        procDone(null, procedureSync(content, options), options.sourceMap, options.meta);
        return 'DUMMY'; // This is not returned by loader
      }

      resetAll({
        query: {procedure},
        next: (error, content, map, meta) => {
          expect(error).to.be.null;
          expect(map).to.equal('<MAP>');
          expect(meta).to.equal('<META>');
          expect(content).to.equal(passedValue);
          expect(webpack.async.calledOnce).to.be.true;
          expect(webpack.callback.calledOnceWithExactly(
            null, passedValue, '<MAP>', '<META>')).to.be.true;

          resetAll({
            query: {procedure, toCode: true},
            next: (error, content, map, meta) => {
              expect(error).to.be.null;
              expect(map).to.equal('<MAP>');
              expect(meta).to.equal('<META>');
              expect(content).to.equal('module.exports = [1,2,3];');
              expect(webpack.async.calledOnce).to.be.true;
              expect(webpack.callback.calledOnceWithExactly(
                null, 'module.exports = [1,2,3];', '<MAP>', '<META>')).to.be.true;

              done();
            }
          });
          expect(loader.call(webpack, 'INPUT', '<MAP>', '<META>')).to.be.undefined; // always undefined
        }
      });
      expect(loader.call(webpack, 'INPUT', '<MAP>', '<META>')).to.be.undefined; // always undefined
    });

    it('should return a value even if it is `null`', done => {
      function procedureSync(content, options) {
        expect(options.sourceMap).to.equal('<MAP>');
        expect(options.meta).to.equal('<META>');
        return null;
      }

      function procedure(content, options, procDone) {
        procDone(null, procedureSync(content, options), options.sourceMap, options.meta);
        return 'DUMMY'; // This is not returned by loader
      }

      resetAll({
        query: {procedure},
        next: (error, content, map, meta) => {
          expect(error).to.be.null;
          expect(map).to.equal('<MAP>');
          expect(meta).to.equal('<META>');
          expect(content).to.be.null;
          expect(webpack.async.calledOnce).to.be.true;
          expect(webpack.callback.calledOnceWithExactly(
            null, null, '<MAP>', '<META>')).to.be.true;

          resetAll({
            query: {procedure, toCode: true},
            next: (error, content, map, meta) => {
              expect(error).to.be.null;
              expect(map).to.equal('<MAP>');
              expect(meta).to.equal('<META>');
              expect(content).to.equal('module.exports = null;');
              expect(webpack.async.calledOnce).to.be.true;
              expect(webpack.callback.calledOnceWithExactly(
                null, 'module.exports = null;', '<MAP>', '<META>')).to.be.true;

              done();
            }
          });
          expect(loader.call(webpack, 'INPUT', '<MAP>', '<META>')).to.be.undefined; // always undefined
        }
      });
      expect(loader.call(webpack, 'INPUT', '<MAP>', '<META>')).to.be.undefined; // always undefined
    });

    it('should return a value even if it is `undefined`', done => {
      function procedureSync(content, options) {
        expect(options.sourceMap).to.equal('<MAP>');
        expect(options.meta).to.equal('<META>');
      }

      function procedure(content, options, procDone) {
        procDone(null, procedureSync(content, options), options.sourceMap, options.meta);
        return 'DUMMY'; // This is not returned by loader
      }

      resetAll({
        query: {procedure},
        next: (error, content, map, meta) => {
          expect(error).to.be.null;
          expect(map).to.equal('<MAP>');
          expect(meta).to.equal('<META>');
          expect(content).to.be.undefined;
          expect(webpack.async.calledOnce).to.be.true;
          expect(webpack.callback.calledOnceWithExactly(
            null, void 0, '<MAP>', '<META>')).to.be.true;

          resetAll({
            query: {procedure, toCode: true},
            next: (error, content, map, meta) => {
              expect(error).to.be.null;
              expect(map).to.equal('<MAP>');
              expect(meta).to.equal('<META>');
              expect(content).to.equal('module.exports = undefined;');
              expect(webpack.async.calledOnce).to.be.true;
              expect(webpack.callback.calledOnceWithExactly(
                null, 'module.exports = undefined;', '<MAP>', '<META>')).to.be.true;

              done();
            }
          });
          expect(loader.call(webpack, 'INPUT', '<MAP>', '<META>')).to.be.undefined; // always undefined
        }
      });
      expect(loader.call(webpack, 'INPUT', '<MAP>', '<META>')).to.be.undefined; // always undefined
    });

    it('should pass an error that was passed by procedure', done => {
      const error1 = new Error('error1');
      resetAll({
        query: {procedure: (content, options, procDone) => {
          procDone(error1, `${content}<procedure>`);
          return 'DUMMY'; // This is not returned by loader
        }},
        next: error => {
          expect(error).to.equal(error1);
          expect(webpack.async.calledOnce).to.be.true;
          expect(webpack.callback.calledOnceWithExactly(error1)).to.be.true;

          done();
        }
      });
      expect(loader.call(webpack, 'INPUT')).to.be.undefined; // always undefined
    });

  });

});

describe('options.toCode', () => {
  const CONVERTED = 'module.exports = "INPUT<procedure>";',
    NOT_CONVERTED = 'INPUT<procedure>';

  function procedure(content) { return `${content}<procedure>`; }

  it('should not convert content when loaderIndex: 1 / toCode: false', () => {
    resetAll({loaderIndex: 1, query: {procedure, toCode: false}});
    expect(loader.call(webpack, 'INPUT')).to.equal(NOT_CONVERTED);
  });

  it('should not convert content when loaderIndex: 1 / toCode: true', () => {
    resetAll({loaderIndex: 1, query: {procedure, toCode: true}});
    expect(loader.call(webpack, 'INPUT')).to.equal(NOT_CONVERTED);
  });

  it('should not convert content when loaderIndex: 0 / toCode: false', () => {
    resetAll({loaderIndex: 0, query: {procedure, toCode: false}});
    expect(loader.call(webpack, 'INPUT')).to.equal(NOT_CONVERTED);
  });

  it('should convert content when loaderIndex: 0 / toCode: true', () => {
    resetAll({loaderIndex: 0, query: {procedure, toCode: true}});
    expect(loader.call(webpack, 'INPUT')).to.equal(CONVERTED);
  });

});

describe('options.resourceOptions', () => {

  it('should not set options.resourceOptions when resourceQuery is not given', () => {
    resetAll({query: {procedure: (content, options) => {
      expect(options.hasOwnProperty('resourceOptions')).to.be.false;
      return `${content}<procedure>`;
    }}});
    expect(loader.call(webpack, 'INPUT')).to.equal('INPUT<procedure>');
  });

  it('should parse resourceQuery and set options.resourceOptions', () => {
    resetAll({
      resourceQuery: '?p1=v1&p2=v2',
      query: {procedure: (content, options) => {
        expect(options.hasOwnProperty('resourceOptions')).to.be.true;
        expect(options.resourceOptions.p1).to.equal('v1');
        expect(options.resourceOptions.p2).to.equal('v2');
        return `${content}<procedure>`;
      }}
    });
    expect(loader.call(webpack, 'INPUT')).to.equal('INPUT<procedure>');
  });

});
