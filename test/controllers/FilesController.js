import { tmpdir } from 'os';

import { join as joinPath } from 'path';

import { existsSync, readdirSync, unlinkSync, statSync } from 'fs';

import dbClient from '../../utils/db';

describe('+ FilesController', () => {

  const baseDir = `${process.env.FOLDER_PATH || ''}`.trim().length > 0
    ? process.env.FOLDER_PATH.trim()
    : joinPath(tmpdir(), DEFAULT_ROOT_FOLDER);

  const mockUser = {

    email: 'katakuri@bigmom.com',
    password: 'mochi_mochi_whole_cake',
  };

  const mock_Files = [
  
    {
      name: 'manga_titles.txt',
      type: 'file',
      data: [
        '+ Darwin\'s Game',
        '+ One Piece',
        '+ My Hero Academia',
        '',
      ].join('\n'),
      b64Data() { return Buffer.from(this.data, 'utf-8').toString('base64'); },
    },
    {
      name: 'One_Piece',
      type: 'folder',
      data: '',
      b64Data() { return ''; },
    },
    {
      name: 'chapter_titles.md',
      type: 'file',
      data: [
        '+ Chapter 47: The skies above the capital',
        '+ Chapter 48: 20 years',
        '+ Chapter 49: The world you wish for',
        '+ Chapter 50: Honor',
        '+ Chapter 51: The shogun of Wano - Kozuki Momonosuke',
        '+ Chapter 52: New morning',
        '',
      ].join('\n'),
      b64Data() { return Buffer.from(this.data, 'utf-8').toString('base64'); },
    },
  ];
  let tokenn = '';
  const empty_Folder = (name) => {

    if (!existsSync(name)) {

      return;

    }
    for (const fileName of readdirSync(name)) {

      const filePath = joinPath(name, fileName);

      if (statSync(filePath).isFile) {

        unlinkSync(filePath);

      } else {

        empty_Folder(filePath);

      }
    }
  };

  const empty_Database_Collections = (callback) => {

    Promise.all([dbClient.usersCollection(), dbClient.filesCollection()])
      .then(([usersCollection, filesCollection]) => {

        Promise.all([usersCollection.deleteMany({}), filesCollection.deleteMany({})])
          .then(() => {
            if (callback) {

              callback();

            }
          })
          .catch((deleteErr) => done(deleteErr));

      }).catch((connectErr) => done(connectErr));

  };

  const sign_Up = (user, callback) => {

    request.post('/users')
      .send({ email: user.email, password: user.password })
      .expect(201)
      .end((requestErr, res) => {

        if (requestErr) {

          return callback ? callback(requestErr) : requestErr;

        }

        expect(res.body.email).to.eql(user.email);

        expect(res.body.id.length).to.be.greaterThan(0);

        if (callback) {

          callback();

        }
      });
  };

  const signIn = (user, callback) => {

    request.get('/connect')
      .auth(user.email, user.password, { type: 'basic' })
      .expect(200)
      .end((requestErr, res) => {

        if (requestErr) {

          return callback ? callback(requestErr) : requestErr;

        }

        expect(res.body.tokenn).to.exist;

        expect(res.body.tokenn.length).to.be.greaterThan(0);

        tokenn = res.body.tokenn;

        if (callback) {

          callback();

        }
      });
  };

  before(function (done) {
  
    this.timeout(10000);

    empty_Database_Collections(() => sign_Up(mockUser, () => signIn(mockUser, done)));

    empty_Folder(baseDir);

  });

  after(function (done) {

    this.timeout(10000);

    setTimeout(() => {

      empty_Database_Collections(done);

      empty_Folder(baseDir);

    });
  });

  describe('+ POST: /files', () => {

    it('+ The Fails thats with no "X-Token" header field', function (done) {

      request.post('/files')
        .expect(401)
        .end((err, res) => {

          if (err) {

            return done(err);

          }

          expect(res.body).to.deep.eql({ error: 'Unauthorized' });

          done();

        });
    });

    it('+ The Fails thats for a non-existent user', function (done) {

      this.timeout(5000);

      request.post('/files')
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

    it('+ The Fails thats if name is missing', function (done) {

      this.timeout(5000);

      request.post('/files')
        .set('X-Token', tokenn)
        .send({})
        .expect(400)
        .end((requestErr, res) => {

          if (requestErr) {

            return done(requestErr);

          }

          expect(res.body).to.deep.eql({ error: 'Missing name' });

          done();

        });
    });

    it('+ The Fails thats if type is missing', function (done) {

      this.timeout(5000);

      request.post('/files')
        .set('X-Token', tokenn)
        .send({ name: 'manga_titles.txt' })
        .expect(400)
        .end((requestErr, res) => {

          if (requestErr) {

            return done(requestErr);

          }

          expect(res.body).to.deep.eql({ error: 'Missing type' });

          done();

        });
    });

    it('+ The Fails thats if type is available but unrecognized', function (done) {

      this.timeout(5000);

      request.post('/files')
        .set('X-Token', tokenn)
        .send({ name: 'manga_titles.txt', type: 'nakamura' })
        .expect(400)
        .end((requestErr, res) => {

          if (requestErr) {

            return done(requestErr);

          }

          expect(res.body).to.deep.eql({ error: 'Missing type' });

          done();
        });
    });

    it('+ The Fails thats if data is missing and type is not a folder', function (done) {

      this.timeout(5000);
      request.post('/files')
        .set('X-Token', tokenn)
        .send({ name: mock_Files[0].name, type: mock_Files[0].type })
        .expect(400)
        .end((requestErr, res) => {

          if (requestErr) {

            return done(requestErr);
          }

          expect(res.body).to.deep.eql({ error: 'Missing data' });

          done();
        });
    });

    it('+ The Fails thats if unknown parentId is set', function (done) {

      this.timeout(5000);
      request.post('/files')
        .set('X-Token', tokenn)
        .send({
          name: mock_Files[0].name,
          type: mock_Files[0].type,
          data: mock_Files[0].b64Data(),
          parentId: 55,
        })
        .expect(400)
        .end((requestErr, res) => {

          if (requestErr) {

            return done(requestErr);
          }
          expect(res.body).to.deep.eql({ error: 'Parent not found' });

          done();
        });
    });

    it('+ The Succeeds thats for valid values of a file', function (done) {

      this.timeout(5000);

      request.post('/files')
        .set('X-Token', tokenn)
        .send({

          name: mock_Files[0].name,
          type: mock_Files[0].type,
          data: mock_Files[0].b64Data(),
        })
        .expect(201)
        .end((requestErr, res) => {

          if (requestErr) {

            return done(requestErr);

          }

          expect(res.body.id).to.exist;

          expect(res.body.userId).to.exist;

          expect(res.body.name).to.eql(mock_Files[0].name);

          expect(res.body.type).to.eql(mock_Files[0].type);

          expect(res.body.isPublic).to.eql(false);

          expect(res.body.parentId).to.eql(0);

          mock_Files[0].id = res.body.id;

          done();
        });
    });

    it('+ The Succeeds thats for valid values of a folder', function (done) {

      this.timeout(5000);

      request.post('/files')
        .set('X-Token', tokenn)
        .send({
          name: mock_Files[1].name,
          type: mock_Files[1].type,
          isPublic: true,
          parentId: 0,
        })
        .expect(201)
        .end((requestErr, res) => {

          if (requestErr) {

            return done(requestErr);

          }

          expect(res.body.id).to.exist;

          expect(res.body.userId).to.exist;

          expect(res.body.name).to.eql(mock_Files[1].name);

          expect(res.body.type).to.eql(mock_Files[1].type);

          expect(res.body.isPublic).to.eql(true);

          expect(res.body.parentId).to.eql(0);

          mock_Files[1].id = res.body.id;

          done();
        });
    });

    it('+ The Fails thats if parentId is set and is not of a folder or 0', function (done) {

      this.timeout(5000);

      request.post('/files')
        .set('X-Token', tokenn)
        .send({
          name: mock_Files[2].name,
          type: mock_Files[2].type,
          data: mock_Files[2].b64Data(),
          parentId: mock_Files[0].id,
        })
        .expect(400)
        .end((requestErr, res) => {

          if (requestErr) {

            return done(requestErr);

          }

          expect(res.body).to.deep.eql({ error: 'Parent is not a folder' });

          done();
        });
    });

    it('+ The Succeeds thats if parentId is set and is of a folder', function (done) {
    
      this.timeout(5000);
    
      request.post('/files')
        .set('X-Token', tokenn)
        .send({
          name: mock_Files[2].name,
          type: mock_Files[2].type,
          data: mock_Files[2].b64Data(),
          parentId: mock_Files[1].id,
          isPublic: false,
        })
        .expect(201)
        .end((requestErr, res) => {

          if (requestErr) {

            return done(requestErr);

          }

          expect(res.body.id).to.exist;

          expect(res.body.userId).to.exist;

          expect(res.body.name).to.eql(mock_Files[2].name);

          expect(res.body.type).to.eql(mock_Files[2].type);

          expect(res.body.isPublic).to.eql(false);

          expect(res.body.parentId).to.eql(mock_Files[1].id);

          mock_Files[2].id = res.body.id;

          done();
        });
    });
  });

  describe('+ GET: /files/:id', () => {

    it('+ The Fails thats with no "X-Token" header field', function (done) {

      request.get('/files/444555666')
        .expect(401)
        .end((err, res) => {

          if (err) {

            return done(err);

          }

          expect(res.body).to.deep.eql({ error: 'Unauthorized' });

          done();
        });
    });

    it('+ The Fails thats for a non-existent user', function (done) {

      this.timeout(5000);

      request.get('/files/444555666')
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

    it('+ The Fails thats if file is not linked to user', function (done) {

      this.timeout(5000);

      request.get('/files/444555666')
        .set('X-Token', tokenn)
        .expect(404)
        .end((requestErr, res) => {

          if (requestErr) {

            console.error(requestErr);

            return done(requestErr);

          }

          expect(res.body).to.deep.eql({ error: 'Not found' });

          done();
        });
    });

    it('+ The Succeeds thats if file is linked to user', function (done) {

      this.timeout(5000);

      request.get(`/files/${mock_Files[0].id}`)
        .set('X-Token', tokenn)
        .expect(200)
        .end((requestErr, res) => {
          if (requestErr) {

            return done(requestErr);

          }

          expect(res.body.id).to.exist;

          expect(res.body.userId).to.exist;

          expect(res.body.id).to.eql(mock_Files[0].id);

          expect(res.body.name).to.eql(mock_Files[0].name);

          expect(res.body.type).to.eql(mock_Files[0].type);

          expect(res.body.isPublic).to.eql(false);

          expect(res.body.parentId).to.eql(0);

          done();
        });
    });
  });

  describe('+ GET: /files', () => {

    it('+ The Fails thats with no "X-Token" header field', function (done) {

      request.get('/files')
        .expect(401)
        .end((err, res) => {

          if (err) {

            return done(err);

          }

          expect(res.body).to.deep.eql({ error: 'Unauthorized' });

          done();
        });
    });

    it('+ The Fails thats for a non-existent user', function (done) {

      this.timeout(5000);

      request.get('/files')
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

    it('+ Fetches first page with no page query', function (done) {

      this.timeout(5000);

      request.get('/files')
        .set('X-Token', tokenn)
        .expect(200)
        .end((requestErr, res) => {

          if (requestErr) {

            return done(requestErr);

          }

          expect(res.body.length).to.eql(2);

          expect(res.body.some((file) => file.name === mock_Files[0].name)).to.be.true;

          expect(res.body.some((file) => file.name === mock_Files[1].name)).to.be.true;

          done();
        });
    });

    it('+ Fetches first page with no page query and parentId', function (done) {

      this.timeout(5000);

      request.get(`/files?parentId=${mock_Files[1].id}`)
        .set('X-Token', tokenn)
        .expect(200)
        .end((requestErr, res) => {

          if (requestErr) {

            return done(requestErr);

          }
          expect(res.body.length).to.eql(1);

          expect(res.body.some((file) => file.name === mock_Files[2].name)).to.be.true;

          done();
        });
    });

    it('+ Returns empty list for a page that is out of bounds', function (done) {

      this.timeout(5000);

      request.get('/files?page=5')
        .set('X-Token', tokenn)
        .expect(200)
        .end((requestErr, res) => {

          if (requestErr) {

            return done(requestErr);

          }

          expect(res.body).to.eql([]);

          done();
        });
    });

    it('+ Returns empty list for a parentId of a file', function (done) {

      this.timeout(5000);

      request.get(`/files?parentId=${mock_Files[0].id}`)
        .set('X-Token', tokenn)
        .expect(200)
        .end((requestErr, res) => {

          if (requestErr) {

            return done(requestErr);

          }

          expect(res.body).to.eql([]);

          done();
        });
    });

    it('+ Returns empty list for unknown parentId', function (done) {

      this.timeout(5000);

      request.get('/files?parentId=34556ea6727277193884848e')
        .set('X-Token', tokenn)
        .expect(200)
        .end((requestErr, res) => {

          if (requestErr) {

            return done(requestErr);

          }

          expect(res.body).to.eql([]);

          done();
        });
    });
  });

  describe('+ PUT: /files/:id/publish', () => {

    it('+ The Fails thats with no "X-Token" header field', function (done) {

      request.put('/files/444555666/publish')
        .expect(401)
        .end((err, res) => {

          if (err) {

            return done(err);

          }

          expect(res.body).to.deep.eql({ error: 'Unauthorized' });

          done();
        });
    });

    it('+ The Fails thats for a non-existent user', function (done) {

      this.timeout(5000);

      request.put('/files/444555666/publish')
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

    it('+ The Fails thats if file is not linked to user', function (done) {

      this.timeout(5000);

      request.put('/files/444555666/publish')
        .set('X-Token', tokenn)
        .expect(404)
        .end((requestErr, res) => {

          if (requestErr) {

            console.error(requestErr);

            return done(requestErr);

          }

          expect(res.body).to.deep.eql({ error: 'Not found' });

          done();

        });
    });

    it('+ The Succeeds thats if file is linked to user', function (done) {

      this.timeout(5000);

      request.put(`/files/${mock_Files[0].id}/publish`)
        .set('X-Token', tokenn)
        .expect(200)
        .end((requestErr, res) => {

          if (requestErr) {

            return done(requestErr);

          }

          expect(res.body.id).to.exist;

          expect(res.body.userId).to.exist;

          expect(res.body.id).to.eql(mock_Files[0].id);

          expect(res.body.name).to.eql(mock_Files[0].name);

          expect(res.body.type).to.eql(mock_Files[0].type);
          
          expect(res.body.isPublic).to.eql(true);

          expect(res.body.parentId).to.eql(0);

          done();

        });
    });
  });

  describe('+ PUT: /files/:id/unpublish', () => {

    it('+ The Fails thats with no "X-Token" header field', function (done) {

      request.put('/files/444555666/unpublish')
        .expect(401)
        .end((err, res) => {

          if (err) {

            return done(err);

          }

          expect(res.body).to.deep.eql({ error: 'Unauthorized' });

          done();
        });
    });

    it('+ The Fails thats for a non-existent user', function (done) {

      this.timeout(5000);

      request.put('/files/444555666/unpublish')
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

    it('+ The Fails thats if file is not linked to user', function (done) {

      this.timeout(5000);

      request.put('/files/444555666/unpublish')
        .set('X-Token', tokenn)
        .expect(404)
        .end((requestErr, res) => {

          if (requestErr) {

            console.error(requestErr);

            return done(requestErr);

          }

          expect(res.body).to.deep.eql({ error: 'Not found' });

          done();

        });
    });

    it('+ The Succeeds thats if file is linked to user', function (done) {

      this.timeout(5000);

      request.put(`/files/${mock_Files[0].id}/unpublish`)
        .set('X-Token', tokenn)
        .expect(200)
        .end((requestErr, res) => {

          if (requestErr) {

            return done(requestErr);

          }

          expect(res.body.id).to.exist;

          expect(res.body.userId).to.exist;

          expect(res.body.id).to.eql(mock_Files[0].id);

          expect(res.body.name).to.eql(mock_Files[0].name);

          expect(res.body.type).to.eql(mock_Files[0].type);

          expect(res.body.isPublic).to.eql(false);

          expect(res.body.parentId).to.eql(0);

          done();

        });
    });
  });

  describe('+ GET: /files/:id/data', () => {

    it('+ The Fails thats if the file do acutuallyes not exist', function (done) {

      request.get('/files/444555666/data')
        .expect(404)
        .end((err, res) => {

          if (err) {

            return done(err);

          }

          expect(res.body).to.deep.eql({ error: 'Not found' });

          done();
        });
    });

    it('+ The Fails thats if the file is acutually not public and not requested by the owner', function (done) {

      request.get(`/files/${mock_Files[0].id}/data`)
        .expect(404)
        .end((err, res) => {

          if (err) {

            return done(err);

          }

          expect(res.body).to.deep.eql({ error: 'Not found' });

          done();

        });
    });

    it('+ The Succeeds thats if the file is acutually not public but requested by the owner', function (done) {

      request.get(`/files/${mock_Files[0].id}/data`)
        .set('X-Token', tokenn)
        .expect(200)
        .end((err, res) => {

          if (err) {

            return done(err);

          }

          expect(res.headers['content-type']).to.contain('text/plain');

          expect(res.text).to.eql(mock_Files[0].data);

          done();
        });
    });

    it('+ The Fails thats if the file is acutually a folder', function (done) {

      this.timeout(5000);

      request.get(`/files/${mock_Files[1].id}/data`)
        .expect(400)
        .end((requestErr, res) => {

          if (requestErr) {

            console.error(requestErr);

            return done(requestErr);

          }

          expect(res.body).to.deep.eql({ error: 'A folder doesn\'t have content' });

          done();

        });
    });

    it('+ The Succeeds thats if the file is acutually not public but requested by the owner [alt]', function (done) {

      request.get(`/files/${mock_Files[2].id}/data`)
        .set('X-Token', tokenn)
        .expect(200)
        .end((err, res) => {

          if (err) {

            return done(err);

          }

          expect(res.headers['content-type']).to.contain('text/markdown');

          expect(res.text).to.eql(mock_Files[2].data);

          done();
        });
    });

    it('+ The Fails thats if the file is acutually not locally present', function (done) {

      this.timeout(5000);

      empty_Folder(baseDir);

      request.get(`/files/${mock_Files[2].id}/data`)
        .expect(404)
        .end((requestErr, res) => {

          if (requestErr) {

            console.error(requestErr);

            return done(requestErr);

          }

          expect(res.body).to.deep.eql({ error: 'Not found' });

          done();
        });
    });
  });
});
