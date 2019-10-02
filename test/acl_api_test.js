const mongoose = require('mongoose');
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const TestUtils = require('./test_utils');
const AccessModel = require('../acl/property_access');

const expect = chai.expect;
const should = chai.should();
chai.use(chaiHttp);

describe('To test initialize AccessModel', () => {
  it('successfully initialized the system with access rows or users', (done) => {
    AccessModel.init("user1", (err, value) => {
      expect(err).to.be.null;
      AccessModel.AccessModelInternal.findOne({
        propertyType: 'user',
        group: 'group_user_admin',
        role: 'admin'
      }).exec()
      .then(result => {
        result.group.should.be.eql('group_user_admin');
        done();
      })
      .catch(err => {
        expect(err).to.be.null;
        done();
      });
    });
  });
});