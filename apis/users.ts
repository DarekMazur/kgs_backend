import express from "express";
import { v4 as uuidv4 } from "uuid";
import getFromDatabase from "../lib/getFromDatabase";
const router = express.Router();

router.use(express.json());

router.get('/', async (_req, res) => {
	await getFromDatabase('users', res)
})

router.get("/:itemId", async (req, res) => {
	const itemId = req.params.itemId;

	await getFromDatabase('users', res, itemId)
});

router.post("/", (req, res) => {
	const newUser = {
		id: uuidv4(),
		username: req.body.username,
		email: req.body.email,
		password: req.body.password,
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		avatar: req.body.avatar,
		description: req.body.description,
		registrationDate: req.body.registrationDate,
		isBanned: false,
		suspensionTimeout: null,
		totalSuspensions: 0,
		isConfirmed: false,
		messages: [],
		role_id: req.body.role.id,
	}

	res.status(200).send(newUser);
});

export default router;