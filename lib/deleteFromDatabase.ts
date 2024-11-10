import {Response} from "express";
import {pool} from "../client";

const deleteFromDatabase = async (table: string, res: Response, id: string) => {
	const client = await pool.connect()

	if (client) {
		try {
			await client.query(`DELETE FROM ${table} WHERE id=($1)::uuid`, [id]);
			res.status(200).send('Deleted')
		} catch (error) {
			res.status(500).send(error.message);
		}
	} else {
		res.status(500).send('Connection failed');
	}
}

export default deleteFromDatabase;
