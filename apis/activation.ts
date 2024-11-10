import express from 'express';
import jwt, {JwtPayload} from "jsonwebtoken";
import process from "node:process";
import {pool} from "../client";
const router = express.Router();

router.get('/:token', async (req, res) => {
	const token = req.params.token

	let decoded: string | JwtPayload

	try {
		decoded = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
	} catch (error) {
		res.status(403).send(`Authentication failed: ${error.message}`).end();
		return
	}

	if (!decoded) {
		res.status(403).send('Authentication failed').end();
	}

	const client = await pool.connect()

	if (!client) {
		res.status(500).send('Connection failed').end();
	}

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
	const user = await client.query(`SELECT * FROM users WHERE id=($1)`, [decoded.id])

	if (!user || user.rows.length === 0) {
		res.status(403).send('Authentication failed').end();
	}

	if (user.rows[0].is_confirmed) {
		res.status(403).json('User already activated').end();
	} else {
		try {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			await client.query(`UPDATE users SET is_confirmed=true WHERE id=($1)`, [decoded.id])
			res.status(200).send('User activated').end();
		} catch (error) {
			res.status(500).send(error.message);
		}
	}
})

export default router;