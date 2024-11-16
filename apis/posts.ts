import express from 'express';
import { v4 as uuidv4 } from "uuid";
import getFromDatabase from "../lib/getFromDatabase";
import { pool } from "../client";
import authorisation from "../lib/authorisation";
import {IPublicPost, IResponsePeak, IResponsePost, IResponseUser} from "../lib/types";
const router = express.Router();
import { v2 as cloudinary } from 'cloudinary'

router.use(express.json());

router.get('/', async (req, res) => {
	const token = (req.header('Authorization' as string)?.split(' ')[1])

	if (authorisation(token, res)) {
		await getFromDatabase('posts', res)
	}
})

router.get('/:itemId', async (req, res) => {
	const itemId = req.params.itemId
	const token = (req.header('Authorization' as string)?.split(' ')[1])

	if (authorisation(token, res)) {


	const client = await pool.connect();

	const post: IResponsePost = await client.query(`SELECT * FROM posts WHERE id=($1)`, [itemId]).then(response => {
		return response.rows[0]
	})

	const peaks: IResponsePeak[] = await client.query(`SELECT * FROM peaks WHERE id=($1)`, [post.peak_id]).then(response => {
		return response.rows
	})

	const user: IResponseUser = await client.query(`SELECT * FROM users WHERE id=($1)`, [post.author_id]).then(response => {
		return response.rows[0]
	})

	const postResponse: IPublicPost = {
		id: post.id,
		createdAt: new Date(Number(post.created_at)),
		notes: post.notes,
		photo: post.photo,
		peak: peaks.map(peak => ({
			id: peak.id,
			name: peak.name,
			height: peak.height,
			description: peak.description,
			trial: peak.trial,
			image: peak.image,
			localizationLat: peak.localization_lat,
			localizationLng: peak.localization_lng,
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
		},
	}

	res.status(200).send(postResponse)
	}
})

router.post('/', async (req, res) => {
	const now = Date.now()
	const id = uuidv4()

	if (req.body) {
		const token = (req.header('Authorization' as string)?.split(' ')[1])

		const {notes, photo, peakId, authorId} = req.body

		if (authorisation(token, res, authorId)) {
			const client = await pool.connect();

			if (client) {
				const author: IResponseUser = await client.query('SELECT id, username, firstname, avatar, suspension_timeout, is_banned, role_id FROM users WHERE id=($1)', [authorId]).then(response => {
					return response.rows[0]
				})

				const peak: IResponsePeak[] = await client.query(`SELECT * FROM peaks WHERE id = ($1)`, [peakId]).then(response => {
					return response.rows
				})

				const image = await cloudinary.uploader.upload(photo).then(results => {
					return results.url
				})

				await client.query(`INSERT INTO posts (id, created_at, notes, photo, peak_id, is_hidden, author_id) VALUES ('${id}', '${now}', '${notes}', '${photo}', '${peak[0].id}', '${false}', '${author.id}') ON CONFLICT DO NOTHING;`).then(() => {
					const newPost: IPublicPost = {
						id,
						createdAt: new Date(now),
						notes,
						photo: image,
						peak: peak.map(peak => ({
							id: peak.id,
							name: peak.name,
							height: peak.height,
							description: peak.description,
							trial: peak.trial,
							image: peak.image,
							localizationLat: peak.localization_lat,
							localizationLng: peak.localization_lng,
						}))[0],
						isHidden: false,
						author: {
							id: author.id,
							username: author.username,
							firstName: author.firstname,
							avatar: author.avatar,
							isSuspended: !!author.suspension_timeout && author.suspension_timeout > Date.now(),
							isBanned: author.is_banned,
							role: author.role_id
						},
					}

					res.status(200).send(newPost)
				})
			} else {
				res.status(500).send('Connection failed');
			}
		}
	} else {
		res.status(400).send('Request failed')
	}
})

router.put('/:itemId', async (req, res) => {
	if (req.params.itemId && req.body) {
		const token = (req.header('Authorization' as string)?.split(' ')[1])

		const client = await pool.connect()

		if (client) {
			const itemId = req.params.itemId;
			const { notes, photo, isHidden } = req.body

			const post: IResponsePost = await client.query(`SELECT * FROM posts WHERE id=($1)`, [itemId]).then(response => {
				return response.rows[0]
			})
			const author: IResponseUser = await client.query(`SELECT * FROM users WHERE id=($1)`, [post.author_id]).then(response => {
				return response.rows[0]
			})
			const peaks: IResponsePeak[] = await client.query(`SELECT * FROM peaks WHERE id=($1)`, [post.peak_id]).then(response => {
				return response.rows
			})

			if (authorisation(token, res, author.id)) {
				const updatedPost: IPublicPost = {
					id: itemId,
					createdAt: new Date(Number(post.created_at)),
					notes: notes ?? post.notes,
					photo: photo ?? post.photo,
					peak: peaks.map(peak => ({
						id: peak.id,
						name: peak.name,
						height: peak.height,
						description: peak.description,
						trial: peak.trial,
						image: peak.image,
						localizationLat: peak.localization_lat,
						localizationLng: peak.localization_lng,
					}))[0],
					isHidden: isHidden === undefined ? post.is_hidden : isHidden,
					author: {
						id: author.id,
						username: author.username,
						firstName: author.firstname,
						avatar: author.avatar,
						isSuspended: !!author.suspension_timeout && author.suspension_timeout > Date.now(),
						isBanned: author.is_banned,
						role: author.role_id
					},
				}

				await client.query(`UPDATE posts SET notes='${updatedPost.notes}', photo='${updatedPost.photo}', is_hidden='${updatedPost.isHidden}' WHERE id=($1)`, [itemId]).then(() => {
					res.status(200).send(updatedPost);
				}).catch((err) => {
					res.status(500).send(`Connection failed: ${err.message}`);
				})
			}
		} else {
			res.status(500).send('Connection failed');
		}
	} else {
		res.status(400).send('Request failed');
	}
})

router.delete('/:itemId', async (req, res) => {
	if (req.params.itemId) {
		const token = (req.header('Authorization' as string)?.split(' ')[1])

		if (authorisation(token, res)) {
			const client = await pool.connect();

			if (client) {
				const itemId = req.params.itemId

				await client.query(`DELETE FROM posts WHERE id=($1)`, [itemId]).then(() => {
					res.status(200).send('Item deleted');
				}).catch((err) => {
					res.status(500).send(`Connection failed: ${err.message}`);
				})
			} else {
				res.status(500).send('Connection failed');
			}
		}
	} else {
		res.status(400).send('Request failed');
	}
})

export default router;
