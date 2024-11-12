import express from 'express';
import { v4 as uuidv4 } from "uuid";
import getFromDatabase from "../lib/getFromDatabase";
import {pool} from "../client";
const router = express.Router();

router.use(express.json());

router.get('/', async (_req, res) => {
	await getFromDatabase('posts', res)
})

router.get('/:itemId', async (req, res) => {
	const itemId = req.params.itemId

	const client = await pool.connect();

	const post = await client.query(`SELECT * FROM posts WHERE id=($1)`, [itemId]).then(response => {
		return response.rows[0]
	})

	const peak = await client.query(`SELECT * FROM peaks WHERE id=($1)`, [post.peak_id]).then(response => {
		return response.rows[0]
	})

	const user = await client.query(`SELECT * FROM users WHERE id=($1)`, [post.author_id]).then(response => {
		return response.rows[0]
	})

	const postTemplate = {
		id: post.id,
		createdAt: new Date(Number(post.created_at)),
		notes: post.notes,
		photo: post.photo,
		peak,
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

	res.status(200).send(postTemplate)
})

router.post('/', async (req, res) => {
	const now = Date.now()
	const id = uuidv4()

	if (req.body) {
		const {notes, photo, peakId, authorId} = req.body

		const client = await pool.connect();

		if (client) {
			const author = await client.query('SELECT id, username, firstname, avatar, suspension_timeout, is_banned, role_id FROM users WHERE id=($1)', [authorId]).then(response => {
				return response.rows[0]
			})

			const peak = await client.query(`SELECT * FROM peaks WHERE id = ($1)`, [peakId]).then(response => {
				return response.rows[0]
			})

			await client.query(`INSERT INTO posts (id, created_at, notes, photo, peak_id, is_hidden, author_id) VALUES ('${id}', '${now}', '${notes}', '${photo}', '${peak.id}', '${false}', '${author.id}') ON CONFLICT DO NOTHING;`).then(() => {
				const newPost = {
					id,
					createdAt: new Date(now),
					notes,
					photo,
					peak,
					isHidden: false,
					author,
				}

				res.status(200).send(newPost)
			})
		} else {
			res.status(500).send('Connection failed');
		}
	} else {
		res.status(400).send('Request failed')
	}
})

router.put('/:itemId', async (req, res) => {
	if (req.params.itemId && req.body) {
		const client = await pool.connect()

		if (client) {
			const itemId = req.params.itemId;
			const { notes, photo, isHidden } = req.body

			const post = await client.query(`SELECT * FROM posts WHERE id=($1)`, [itemId]).then(response => {
				return response.rows[0]
			})
			const author = await client.query(`SELECT * FROM users WHERE id=($1)`, [post.autor_id]).then(response => {
				return response.rows[0]
			})
			const peak = await client.query(`SELECT * FROM peaks WHERE id=($1)`, [post.peak_id]).then(response => {
				return response.rows[0]
			})

			const updatedPost = {
				id: itemId,
				createdAt: post.created_at,
				notes: notes ?? post.notes,
				photo: photo ?? post.photo,
				peak,
				isHidden: isHidden === undefined ? post.is_hidden : isHidden,
				author,
			}

			await client.query(`UPDATE posts SET notes='${updatedPost.notes}', photo='${updatedPost.photo}', is_hidden='${updatedPost.isHidden}' WHERE id=($1)`, [itemId]).then(() => {
				res.status(200).send(updatedPost);
			}).catch((err) => {
				res.status(500).send(`Connection failed: ${err.message}`);
			})


		} else {
			res.status(500).send('Connection failed');
		}
	} else {
		res.status(400).send('Request failed');
	}
})

router.delete('/:itemId', async (req, res) => {
	if (req.params.itemId) {
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
	} else {
		res.status(400).send('Request failed');
	}
})

export default router;
