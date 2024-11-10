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
			if (table === 'users') {
				const roles = await client.query('SELECT * FROM roles');
				const posts = await client.query('SELECT * FROM posts');

				rows = rows.map(user => ({
					id: user.id,
					username: user.username,
					email: user.email,
					firstName: user.firstname,
					lastName: user.lastname,
					avatar: user.avatar,
					description: user.description,
					isBanned: user.is_banned,
					suspensionTimeout: user.suspension_timeout,
					totalSuspensions: user.total_suspensions,
					isConfirmed: user.is_confirmed,
					messages: user.messages ?? [],
					posts: posts.rows.filter(post => post.author_id === user.id),
					registrationDate: new Date(Number(user.registration_date)),
					role: roles.rows.filter(role => role.id === user.role_id)[0],
				}))
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