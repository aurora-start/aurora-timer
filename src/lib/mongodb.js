import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error("Please add MONGODB_URI to your .env.local");
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client
      .connect()
      .then(() => {
        console.log("Conectado correctamente a la base de datos");
        return client;
      })
      .catch((err) => {
        console.error("Error al conectar con la base de datos:", err);
        throw err;
      });
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client
    .connect()
    .then(() => {
      console.log("Conectado correctamente a la base de datos");
      return client;
    })
    .catch((err) => {
      console.error("Error al conectar con la base de datos:", err);
      throw err;
    });
}

export default clientPromise;
