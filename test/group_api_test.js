const mongoose = require('mongoose');
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const TestUtils = require('./test_utils');
const GroupModule = require('../acl/group');

const expect = chai.expect;
const should = chai.should();
chai.use(chaiHttp);

describe('To test initialize groups', () => {
  it('successfully initialized the system with all groups', (done) => {
    GroupModule.init("user1", (err, value) => {
      expect(err).to.be.null;
      GroupModule.GroupModelInternal.findOne({ name: 'GROUP_SYSTEM_ADMIN'}).exec()
      .then(result => {
        result.name.should.be.eql('GROUP_SYSTEM_ADMIN');
        return GroupModule.GroupModelInternal.findOne({ name: 'group_user_admin'}).exec();
      })
      .catch(err => {
        throw err;
      })
      .then(result => {
        result.name.should.be.eql('group_user_admin');
        done();
      })
      .catch(err => {
        expect(err).to.be.null;
        done();
      });
    });
  });
  /*
  it('failed to initialize twice.', (done) => {
    chai.request(server)
        .post('/api/v1/group/init')
        .set('authorization', TestUtils.getToken("user1"))
        .then(res => {
          expect(res).to.have.status(200);
          return chai.request(server)
                     .post('/api/v1/group/init')
                     .set('authorization', TestUtils.getToken("user2"));
        })
        .catch(err => {
          throw err;
        })
        .then(res => {
          expect(res).to.have.status(500);
          done();
        })
        .catch(err => {
          expect(err).to.be.null;
          done();
        });
  });
  */
});