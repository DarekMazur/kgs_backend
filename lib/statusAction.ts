import jwt, {JwtPayload} from "jsonwebtoken";
import process from "node:process";
import {pool} from "../client";

const statusAction = async (token, res) => {
	let decoded: string | JwtPayload

	try {
		decoded = jwt.verify(token, process.env.AUTH_SECRET_KEY);
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

	return user.rows[0];
}

export default statusAction;