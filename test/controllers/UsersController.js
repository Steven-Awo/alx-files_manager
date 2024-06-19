/* eslint-disable import/no-named-as-default */
import dbClient from '../../utils/db';

describe('+ UserController', () => {

  const mock_User = {

    email: 'beloxxi@blues.com',
    password: 'melody1982',
  };

  before(function (done) {

    this.timeout(10000);

    dbClient.usersCollection()
      .then((usersCollection) => {

        usersCollection.deleteMany({ email: mock_User.email })
          .then(() => done())
          .catch((deleteErr) => done(deleteErr));

      }).catch((connectErr) => done(connectErr));

    setTimeout(done, 5000);

  });

  describe('+ POST: /users', () => {

    it('+ Fails occured when there is no actual email and there is a password', function (done) {

      this.timeout(5000);

      request.post('/users')
        .send({

          password: mock_User.password,
        })
        .expect(400)
        .end((err, res) => {

          if (err) {
            return done(err);

          }
          expect(res.body).to.deep.eql({ error: 'Missing email' });

          done();

        });
    });

    it('+ Fails occurs when there is actually an email and there is any password', function (done) {

      this.timeout(5000);

      request.post('/users')
        .send({

          email: mock_User.email,
        })
        .expect(400)
        .end((err, res) => {

          if (err) {

            return done(err);

          }
          expect(res.body).to.deep.eql({ error: 'Missing password' });

          done();

        });
    });

    it('+ Succeeds occurs when the a new user and it has a password and an email', function (done) {

      this.timeout(5000);

      request.post('/users')
        .send({

          email: mock_User.email,
          password: mock_User.password,
        })
        .expect(201)
        .end((err, res) => {

          if (err) {

            return done(err);

          }
          expect(res.body.email).to.eql(mock_User.email);

          expect(res.body.id.length).to.be.greaterThan(0);

          done();

        });
    });

    it('+ Failure occurs when the user actually already exists', function (done) {

      this.timeout(5000);

      request.post('/users')
        .send({
          email: mock_User.email,
          password: mock_User.password,
        })
        .expect(400)
        .end((err, res) => {

          if (err) {

            return done(err);

          }

          expect(res.body).to.deep.eql({ error: 'Already exist' });

          done();

        });
    });
  });

});
