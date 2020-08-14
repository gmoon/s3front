/* eslint-env mocha, node, es6 */
const chai = require('chai');
const chaiHttp = require('chai-http');
const httpServer = require('./http.js');
const expressServer = require('./express-basic.js');

const { expect } = chai;

chai.use(chaiHttp);

describe('Examples', () => {
  describe('HTTP server', () => {
    it('should get index.html', (done) => {
      chai.request(httpServer).get('/index.html').end((error, res) => {
        expect(res).to.have.status(200);
        done();
      });
    });
  });

  describe('Express server', () => {
    it('should get index.html', (done) => {
      chai.request(expressServer).get('/index.html').end((error, res) => {
        expect(res).to.have.status(200);
        done(error);
      });
    });
    it('should respond with 404 Not Found for nonexistent key', (done) => {
      chai.request(expressServer).get('/nonexistent.file').end((error, res) => {
        expect(res).to.have.status(404);
        done();
      });
    });
    it('should respond with 403 Forbidden for unauthorized access request', (done) => {
      chai.request(expressServer).get('/unauthorized.html').end((error, res) => {
        expect(res).to.have.status(403);
        done();
      });
    });
    it('should respond to health check', (done) => {
      chai.request(expressServer).get('/health').end((error, res) => {
        expect(res).to.have.status(200);
        done(error);
      });
    });
  });
});
