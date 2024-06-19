import { MongoClient } from 'mongodb';

const HOST = process.env.DB_HOST || 'localhost';
const PORT = process.env.DB_PORT || 27017;
const DATABASE = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${HOST}:${PORT}`;

class DBClient {
  constructor() {
    this.client = new MongoClient(url, { useUnifiedTopology: true, useNewUrlParser: true });

    this.client.connect().then(() => {
      this.db = this.client.db(DATABASE);
    }).catch((err) => {
      console.log(err);
    });
  }

  isAlive() {
    return this.client && this.client.topology && this.client.topology.isConnected();
  }

  async nbUsers() {
    const userrs = this.db.collection('users');
    const userrsNumb = await userrs.countDocuments();
    return userrsNumb;
  }

  async nbFiles() {
    const filles = this.db.collection('files');
    const fillesNumb = await filles.countDocuments();
    return fillesNumb;
  }
}

const dbClient = new DBClient();
export default dbClient;

