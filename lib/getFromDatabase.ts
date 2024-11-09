import {Response} from "express";
import {pool} from "../client";

const getFromDatabase = async (table: string, res: Response, id?: string | number) => {
	const client = await pool.connect()

	if (client) {
		console.log('Connected to database');
		const result = await client.query(`SELECT * FROM ${table}`);
		if (result !== undefined) {
			let rows = [...result.rows];
			if (id) {
				rows = rows.filter((row) => row.id === id);
			}
			res.status(200).send(rows);
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

export default getFromDatabase;