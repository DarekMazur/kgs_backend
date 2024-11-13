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

			if ( table === 'posts' ) {
				const users = await client.query('SELECT id, username, firstname, avatar, suspension_timeout, is_banned, role_id FROM users');
				const peaks = await client.query('SELECT * FROM peaks');

				rows = rows.map(post => ({
					id: post.id,
					createdAt: new Date(Number(post.created_at)),
					notes: post.notes,
					photo: post.photo,
					peak:	peaks.rows.filter(peak => peak.id === post.peak_id)[0],
					isHidden: post.is_hidden,
					author: users.rows.filter(user => user.id === post.author_id).map(author => ({
						id: author.id,
						username: author.username,
						firstName: author.firstname,
						avatar: author.avatar,
						isSuspended: !!author.suspension_timeout && author.suspension_timeout > Date.now(),
						isBanned: author.is_banned,
						role: author.role_id,
					}))[0],
				}))
			}

			if ( table === 'peaks' ) {
				rows = rows.map(peak => ({
					id: peak.id,
					name: peak.name,
					height: peak.height,
					description: peak.description,
					trial: peak.trial,
					localizationLat: peak.localization_lat,
					localizationLng: peak.localization_lng,
					image: peak.image,
				}))
			}

			res.status(200).send(rows);
			console.log('Results sent')
			client.release()
			console.log('Client released');
		} else {
			res.status(400).json({"message": 'No such results'});
		}
	} else {
		res.status(500).json({"message": 'Connection failed'});
	}
}

export default getFromDatabase;