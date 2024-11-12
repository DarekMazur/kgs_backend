import jwt from "jsonwebtoken";
import process from "node:process";
import {Response} from "express";

const authorisation = (token: string, res: Response, id?: string) => {
	if (!token) {
		res.status(500).send('Connection failed').end();
		return false
	}

	const decoded = jwt.verify(token, process.env.TOKEN_SECRET_KEY);

	if (!decoded) {
		res.status(403).send('Authentication failed').end();
		return false
	}

	if (id) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		if (decoded.id !== id) {
			res.status(403).send('Authentication failed').end();
			return false
		}
	}

	return true
}

export default authorisation