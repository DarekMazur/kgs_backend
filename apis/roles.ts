import express from 'express';
import getFromDatabase from "../lib/getFromDatabase";
import authorisation from "../lib/authorisation";
const router = express.Router();

router.get('/', async (req, res) => {
	const token = (req.header('Authorization' as string)?.split(' ')[1])

	if (authorisation(token, res)) {
		await getFromDatabase('roles', res)
	}
})

export default router;
