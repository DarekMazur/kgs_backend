import express, {Response} from "express";
const router = express.Router();

import {pool} from "../client";

const getFromDatabase = async (table: string, res: Response) => {
	const client = await pool.connect()

	if (client) {
		console.log('Connected to database');
		const result = await client.query(`SELECT * FROM ${table}`);
		if (result !== undefined) {
			res.status(200).send(result.rows);
			console.log('Results sent')
			client.release()
			console.log('Client released');
		} else {
			res.status(400).send('No such results');
		}
	} else {
		res.status(500).send('Connection failed');
	}
}

router.get('/', async (_req, res) => {
	await getFromDatabase('users', res)
})

export default router;