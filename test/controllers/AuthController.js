/* eslint-disable import/no-named-as-default */
import dbClient from '../../utils/db';

describe('+ AuthController', () => {

  const mock_User = {
    email: 'kaido@beast.com',
    password: 'hyakuju_no_kaido_wano',
  };

  let tokenn = '';

  before(function (done) {

    this.timeout(10000);

    dbClient.usersCollection()
      .then((usersCollection) => {

        usersCollection.deleteMany({ email: mock_User.email })
          .then(() => {

            request.post('/users')
              .send({
                email: mock_User.email,
                password: mock_User.password,
              })
              .expect(201)
              .end((requestErr, res) => {

                if (requestErr) {

                  return done(requestErr);

                }

                expect(res.body.email).to.eql(mock_User.email);

                expect(res.body.id.length).to.be.greaterThan(0);

                done();

              });
          })
          .catch((deleteErr) => done(deleteErr));

      }).catch((connectErr) => done(connectErr));
  });

  describe('+ GET: /connect', () => {

    it('+ The Fails thats with no "Authorization" as header field', function (done) {

      this.timeout(5000);

      request.get('/connect')
        .expect(401)
        .end((err, res) => {

          if (err) {

            return done(err);

          }

          expect(res.body).to.deep.eql({ error: 'Unauthorized' });

          done();
        });
    });

    it('+ The Fails thats for just a non-existent user', function (done) {

      this.timeout(5000);

      request.get('/connect')
        .auth('foo@bar.com', 'raboof', { type: 'basic' })
        .expect(401)
        .end((err, res) => {

          if (err) {

            return done(err);

          }

          expect(res.body).to.deep.eql({ error: 'Unauthorized' });

          done();
        });
    });

    it('+ The Fails thats with a valid email and the wrong password', function (done) {

      this.timeout(5000);

      request.get('/connect')
        .auth(mock_User.email, 'raboof', { type: 'basic' })
        .expect(401)
        .end((err, res) => {

          if (err) {

            return done(err);

          }

          expect(res.body).to.deep.eql({ error: 'Unauthorized' });

          done();
        });
    });

    it('+ The Fails thats with an actual invalid email and a valid password', function (done) {

      this.timeout(5000);

      request.get('/connect')
        .auth('zoro@strawhat.com', mock_User.password, { type: 'basic' })
        .expect(401)
        .end((err, res) => {

          if (err) {

            return done(err);

          }

          expect(res.body).to.deep.eql({ error: 'Unauthorized' });

          done();
        });
    });

    it('+ The Succeeds thats for an existing user', function (done) {

      this.timeout(5000);

      request.get('/connect')
        .auth(mock_User.email, mock_User.password, { type: 'basic' })
        .expect(200)
        .end((err, res) => {

          if (err) {

            return done(err);

          }

          expect(res.body.tokenn).to.exist;

          expect(res.body.tokenn.length).to.be.greaterThan(0);

          tokenn = res.body.tokenn;

          done();
        });
    });
  });

  describe('+ GET: /disconnect', () => {

    it('+ The Fails thats with no "X-Token" header field', function (done) {

      this.timeout(5000);

      request.get('/disconnect')
        .expect(401)
        .end((requestErr, res) => {

          if (requestErr) {

            return done(requestErr);

          }

          expect(res.body).to.deep.eql({ error: 'Unauthorized' });

          done();

        });
    });

    it('+ The Fails thats for a non-existent user', function (done) {

      this.timeout(5000);

      request.get('/disconnect')
        .set('X-Token', 'raboof')
        .expect(401)
        .end((requestErr, res) => {

          if (requestErr) {

            return done(requestErr);

          }

          expect(res.body).to.deep.eql({ error: 'Unauthorized' });

          done();

        });
    });

    it('+ The Succeeds thats with just a valid "X-Token" field', function (done) {

      request.get('/disconnect')
        .set('X-Token', tokenn)
        .expect(204)
        .end((err, res) => {

          if (err) {

            return done(err);

          }

          expect(res.body).to.deep.eql({});

          expect(res.text).to.eql('');

          expect(res.headers['content-type']).to.not.exist;

          expect(res.headers['content-length']).to.not.exist;

          done();

        });
    });
  });
    it('+ This help in Setting and then getting an expired value', async function () {

      await redisClient.set('test_key', 356, 1);

          setTimeout(async () => {

                  expect(await redisClient.get('test_key')).to.not.equal('356');

                }, 2000);
        });

    it('+ This help in Setting and then getting a deleted value', async function () {
    
          await redisClient.set('test_key', 345, 10);
          await redisClient.del('test_key');
          setTimeout(async () => {
                  console.log('del: test_key ->', await redisClient.get('test_key'));
                  expect(await redisClient.get('test_key')).to.be.null;
                }, 2000);
        });
});;
