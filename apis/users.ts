import express from "express";
import getFromDatabase from "../lib/getFromDatabase";
const router = express.Router();

router.get('/', async (_req, res) => {
	await getFromDatabase('users', res)
})

router.get("/:itemId", async (req, res) => {
	const itemId = req.params.itemId;

	await getFromDatabase('users', res, itemId)
});

export default router;