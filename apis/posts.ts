import express from 'express';
import getFromDatabase from "../lib/getFromDatabase";
const router = express.Router();

router.get('/', async (_req, res) => {
	await getFromDatabase('posts', res)
})

export default router;