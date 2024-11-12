import express from 'express';
import getFromDatabase from "../lib/getFromDatabase";
import {pool} from "../client";
const router = express.Router();

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
		createdAt: new Date(post.created_at),
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

export default router;
