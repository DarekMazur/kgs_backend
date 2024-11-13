import jwt from "jsonwebtoken";
import process from "node:process";
import {Response} from "express";

const authorisation = (token: string, res: Response, id?: string) => {
	if (!token) {
		res.status(403).json({"message": 'Invalid or expired token'})
		return false
	}

	const decoded = () => {
		try {
			return jwt.verify(token, process.env.TOKEN_SECRET_KEY)
		} catch (error) {
			res.status(403).json({"message": error.message})
			return false
		}
	}


	if (!decoded()) {
		res.status(403).json({"message": 'Invalid or expired token'})
		return false
	}

	if (id) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		if (decoded().id !== id) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			if (decoded().role_id < 3) {
				return true
			} else {
				res.status(403).json({"message": 'Authentication failed'})
				return false
			}
		}
	}

	return true
}

export default authorisation