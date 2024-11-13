import {Response} from "express";
import {pool} from "../client";
import {IPublicPeak, IPublicPost, IPublicUser, IResponsePeak, IResponsePost, IResponseUser, IRole} from "./types";

const getFromDatabase = async (table: string, res: Response, id?: string | number) => {
	const client = await pool.connect()

	if (client) {
		console.log('Connected to database');

		const results: (IRole | IResponseUser | IResponsePost | IResponsePeak)[] = await client.query(`SELECT * FROM ${table}`).then(response => {
			return response.rows;
		});
		if (results !== undefined) {
			let rows: (IRole | IPublicUser | IPublicPost | IPublicPeak)[] = [];

			if (table === 'roles') {
				rows = [...(results as IRole[])]

				if (id) {
					rows = rows.filter((row) => row.id === id);
				}
			}
			if (table === 'users') {
				const roles: IRole[] = await client.query('SELECT * FROM roles').then(response => {
					return response.rows
				});
				const posts: IResponsePost[] = await client.query('SELECT * FROM posts').then(response => {
					return response.rows;
				});
				const peaks: IResponsePeak[] = await client.query('SELECT * FROM peaks').then(response => {
					return response.rows;
				});

				rows = results.map((user: IResponseUser) => ({
					id: user.id,
					username: user.username,
					email: user.email,
					firstName: user.firstname,
					lastName: user.lastname,
					avatar: user.avatar,
					description: user.description,
					isBanned: user.is_banned,
					suspensionTimeout: new Date(Number(user.suspension_timeout)),
					totalSuspensions: user.total_suspensions,
					isConfirmed: user.is_confirmed,
					messages: user.messages ?? [],
					posts: posts.filter(post => post.author_id === user.id).map(post => ({
						id: post.id,
						createdAt: new Date(Number(post.created_at)),
						notes: post.notes,
						photo: post.photo,
						peak:	peaks.filter(peak => peak.id === post.peak_id).map(peak => ({
								id: peak.id,
								name: peak.name,
								height: peak.height,
								description: peak.description,
								trial: peak.trial,
								localizationLat: peak.localization_lat,
								localizationLng: peak.localization_lng,
								image: peak.image,
							}))[0],
						isHidden: post.is_hidden,
						author: {
							id: user.id,
							username: user.username,
							firstName: user.firstname,
							avatar: user.avatar,
							isSuspended: !!user.suspension_timeout && user.suspension_timeout > Date.now(),
							isBanned: user.is_banned,
							role: user.role_id,
						}
					})),
					registrationDate: new Date(Number(user.registration_date)),
					role: roles.filter(role => role.id === user.role_id)[0],
				}))

				if (id) {
					rows = rows.filter((row) => row.id === id);
				}
			}

			if ( table === 'posts' ) {
				const users: IResponseUser[] = await client.query('SELECT id, username, firstname, avatar, suspension_timeout, is_banned, role_id FROM users').then(response => {
					return response.rows;
				});
				const peaks: IResponsePeak[] = await client.query('SELECT * FROM peaks').then(response => {
					return response.rows;
				});

				rows = results.map((post: IResponsePost) => ({
					id: post.id,
					createdAt: new Date(Number(post.created_at)),
					notes: post.notes,
					photo: post.photo,
					peak:	peaks.filter(peak => peak.id === post.peak_id)[0],
					isHidden: post.is_hidden,
					author: users.filter(user => user.id === post.author_id).map(author => ({
						id: author.id,
						username: author.username,
						firstName: author.firstname,
						avatar: author.avatar,
						isSuspended: !!author.suspension_timeout && author.suspension_timeout > Date.now(),
						isBanned: author.is_banned,
						role: author.role_id,
					}))[0],
				}))

				if (id) {
					rows = rows.filter((row) => row.id === id);
				}
			}

			if ( table === 'peaks' ) {
				rows = results.map((peak: IResponsePeak) => ({
					id: peak.id,
					name: peak.name,
					height: peak.height,
					description: peak.description,
					trial: peak.trial,
					localizationLat: peak.localization_lat,
					localizationLng: peak.localization_lng,
					image: peak.image,
				}))

				if (id) {
					rows = rows.filter((row) => row.id === id);
				}
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