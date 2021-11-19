const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.1gsip.mongodb.net/tavelio?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

const verifyToken = async (req, res, next) => {
	if (req.headers?.authorization?.startsWith('Bearer ')) {
		const token = req.headers.authorization.split(' ')[1];

		try {
			const user = await admin.auth().verifyIdToken(token);
			if (!user) {
				return res
					.status(401)
					.json({ message: 'You are not authorized' });
			} else {
				req.user = user.email;
			}
		} catch {}
	}
	next();
};

async function run() {
	try {
		const connect = await client.connect();
		console.log('db connection established');
		const db = client.db('tavelio');

		app.get('/deals', async (req, res) => {
			const data = await db.collection('deals').find().toArray();
			res.status(200).send(data);
		});

		app.post('/deals', async (req, res) => {
			const data = await db.collection('deals').insertOne(req.body);
			res.status(201).json(data);
		});

		app.get('/blogs', async (req, res) => {
			const data = await db.collection('blogs').find().toArray();
			res.status(200).json(data);
		});

		app.post('/orders', async (req, res) => {
			const { ship, product, user, status } = req.body;
			const result = await db
				.collection('orders')
				.insertOne({ ship, product, user, status });
			res.status(201).json(result);
		});

		app.get('/orders', async (req, res) => {
			const result = await db.collection('orders').find().toArray();
			res.status(200).json(result);
		});

		app.get('/orders/:user', async (req, res) => {
			const result = await db
				.collection('orders')
				.find({ user: req.params.user })
				.toArray();

			res.status(200).json(result);
		});

		app.delete('/orders/:id', async (req, res) => {
			const result = await await db
				.collection('orders')
				.deleteOne({ _id: ObjectId(req.params.id) });
			res.status(201).json(result);
		});

		app.put('/orders/:id', async (req, res) => {
			const query = { _id: ObjectId(req.params.id) };
			const data = { status: req.body.status };
			const options = { upsert: true };
			const result = await db
				.collection('orders')
				.updateOne(query, { $set: data }, options);
			res.status(203).json(result);
		});
	} finally {
		// await client.close();
	}
}

run().catch(console.dir);

app.get('/', (req, res) => {
	res.json({ message: 'Hello world!' });
});

app.listen(PORT, () => console.log('Server Running On Port ' + PORT));
