import express from "express";
import { v4 as uuidv4 } from "uuid";
import getFromDatabase from "../lib/getFromDatabase";
import {pool} from "../client";
const router = express.Router();

router.use(express.json());

router.get('/', async (_req, res) => {
	await getFromDatabase('users', res)
})

router.get("/:itemId", async (req, res) => {
	const itemId = req.params.itemId;

	await getFromDatabase('users', res, itemId)
});

router.post("/", async (req, res) => {
	const newUser = {
		id: uuidv4(),
		username: req.body.username,
		email: req.body.email,
		password: req.body.password,
		registrationDate: Date.now(),
		messages: [],
		role_id: req.body.role.id,
	}

	const publicUser = {
		username: newUser.username,
		email: newUser.email,
		registrationDate: new Date(newUser.registrationDate),
		role_id: newUser.role_id,
	}

	const client = await pool.connect()

	if (client) {
		console.log('Connected to database');

		await client.query(`INSERT INTO users (id, username, email, password, messages, registration_date, role_id) VALUES ('${newUser.id}', '${newUser.username}', '${newUser.email}', '${newUser.password}', '${newUser.messages}', '${newUser.registrationDate}', '${newUser.role_id}') ON CONFLICT DO NOTHING;`)
			.then(() => {
				res.status(200).send(publicUser).end();
				console.log('New user sent to database');
				client.release()
				console.log('Client released');
			})
			.catch((err) => {
				res.status(500).send('Sending error');
				console.error('Sending ' + err);
			})
	} else {
		res.status(500).send('Connection failed');
	}
});

export default router;