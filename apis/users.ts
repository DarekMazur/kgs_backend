import express from "express";
import { v4 as uuidv4 } from "uuid";
import getFromDatabase from "../lib/getFromDatabase";
import {pool} from "../client";
import deleteFromDatabase from "../lib/deleteFromDatabase";
const router = express.Router();
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
import {emailVerification} from "../lib/constants";
import process from "node:process";
import sendMail from "../lib/sendMail";

router.use(express.json());

const hashedPassword = (pass: string, salt: string) =>  bcrypt.hash(pass, salt);

router.get('/', async (_req, res) => {
	await getFromDatabase('users', res)
})

router.get('/login', async (req, res) => {
	if (req.body.email && emailVerification(req.body.email)) {
		const client = await pool.connect()
		const user = await client.query(`SELECT * FROM users WHERE email = '${req.body.email.toLowerCase()}'`);
		const loggedUser = user.rows[0]

		if (loggedUser) {
			if (await bcrypt.compare(req.body.password + loggedUser.registration_date, loggedUser.password)) {
				const role = await client.query(`SELECT * FROM roles WHERE id='${loggedUser.role_id}'`);
				const posts = await client.query(`SELECT * FROM posts WHERE author_id='${loggedUser.id}'`);
				const token = jwt.sign({
					id: loggedUser.id,
					role_id: role.rows[0].id
				}, process.env.TOKEN_SECRET_KEY as string, { expiresIn: process.env.TOKEN_EXPIRATION_TIME })

				const response = {
					data: {
						id: loggedUser.id,
						loggedUsername: loggedUser.loggedUsername,
						email: loggedUser.email,
						firstName: loggedUser.firstname,
						lastName: loggedUser.lastname,
						avatar: loggedUser.avatar,
						description: loggedUser.description,
						isBanned: loggedUser.is_banned,
						suspensionTimeout: loggedUser.suspension_timeout,
						totalSuspensions: loggedUser.total_suspensions,
						isConfirmed: loggedUser.is_confirmed,
						messages: loggedUser.messages ?? [],
						posts: posts.rows,
						registrationDate: new Date(Number(loggedUser.registration_date)),
						role: role.rows[0],
					},
					token,
				}
				res.status(200).send(response).end();
			} else {
				res.status(403).send('Authentication failed').end();
			}
		} else {
			res.status(403).send('User not found').end();
		}
	}
})

router.get("/current", async (req, res) => {
	if (!req.header('Authorization') || !req.body.id) {
		res.status(500).send('Connection failed').end();
	}

	const token = (req.header('Authorization') as string).split(' ')[1]

	const decoded = jwt.verify(token, process.env.TOKEN_SECRET_KEY);

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
	if (decoded.id !== req.body.id) {
		res.status(403).send('Authentication failed').end();
	}

	await getFromDatabase('users', res, req.body.id)
})

router.get("/:itemId", async (req, res) => {
	const itemId = req.params.itemId;

	await getFromDatabase('users', res, itemId)
});

router.post("/", async (req, res) => {
	const timestamp = Date.now();
	const salt = await bcrypt.genSalt();

	const client = await pool.connect()

	const checkEmail = await client.query(`SELECT * FROM users WHERE email='${req.body.email.toLowerCase()}'`)

	if (checkEmail && checkEmail.rows.length > 0) {
		res.status(403).send('Email already registered').end();
		return
	}

	const newUser = {
		id: uuidv4(),
		username: req.body.username,
		email: req.body.email.toLowerCase(),
		password: await hashedPassword(req.body.password + timestamp.toString(), salt),
		registrationDate: timestamp,
		role_id: req.body.role.id,
	}

	const publicUser = {
		id: newUser.id,
		username: newUser.username,
		email: newUser.email,
		registrationDate: new Date(newUser.registrationDate),
		role_id: newUser.role_id,
	}

	if (client) {
		console.log('Connected to database');

		try {
			const token = jwt.sign({
				id: newUser.id
			}, process.env.TOKEN_SECRET_KEY as string, { expiresIn: process.env.CONFIRMATION_TOKEN_EXPIRATION_TIME })

			const options = {
				email: newUser.email.toLowerCase(),
				username: newUser.username,
				token,
			}

			sendMail(options)
		} catch (error) {
			res.status(500).send(error.message).end();
			return
		}

		await client.query(`INSERT INTO users (id, username, email, password, registration_date, role_id) VALUES ('${newUser.id}', '${newUser.username}', '${newUser.email.toLowerCase()}', '${newUser.password}', '${newUser.registrationDate}', '${newUser.role_id}') ON CONFLICT DO NOTHING;`)
			.then(async () => {
				console.log('New user sent to database');
				client.release()
				res.status(200).send(publicUser);
				console.log('Client released');
			})
			.catch((err) => {
				res.status(500).send('Sending error');
				console.error('Sending ' + err);
			})
	} else {
		res.status(500).send('Connection failed');
	}
});

router.put("/:itemId", async (req, res) => {
	const itemId = req.params.itemId;

	const client = await pool.connect()

	if (client) {
		const responseUser = await client.query(`SELECT * FROM users WHERE id=($1)::uuid`, [itemId]);
		const roles = await client.query('SELECT * FROM roles');
		const salt = await bcrypt.genSalt();

		const user = responseUser.rows[0];

		const updatedUser = {
			username: req.body.username ?? user.username,
			email: user.email,
			password: await hashedPassword(req.body.password + user.registration_date, salt) ?? user.password,
			firstname: req.body.firstName ?? user.firstname,
			lastname: req.body.lastName ?? user.lastname,
			avatar: req.body.avatar ?? user.avatar,
			description: req.body.description ?? user.description,
			is_banned: req.body.isBanned === undefined ? user.is_banned : req.body.is_banned,
			suspension_timeout: req.body.suspensionTimeout ?? user.suspension_timeout,
			total_suspensions: req.body.totalSuspensions ?? user.total_suspensions,
			is_confirmed: req.body.isConfirmed === undefined ? user.is_confirmed : req.body.isConfirmed,
			messages: req.body.messages ?? user.messages ?? [],
			role_id: roles.rows.filter(role => role.id === (req.body.role?.id ?? user.role_id))[0].id,
		}

		try {
			if (updatedUser.suspension_timeout) {
				await client.query(`UPDATE users SET suspension_timeout='${updatedUser.suspension_timeout}' WHERE id=($1)::uuid`, [user.id])
			}

			if (updatedUser.messages && updatedUser.messages.length > 0) {
				await client.query(`UPDATE users SET messages='${updatedUser.messages}' WHERE id=($1)::uuid`, [user.id])
			}
			await client.query(`UPDATE users SET username='${updatedUser.username}', email='${updatedUser.email}', password='${updatedUser.password}', firstname='${updatedUser.firstname}', lastname='${updatedUser.lastname}', avatar='${updatedUser.avatar}', description='${updatedUser.description}', is_banned='${updatedUser.is_banned}', total_suspensions='${updatedUser.total_suspensions}', is_confirmed='${updatedUser.is_confirmed}', role_id='${updatedUser.role_id}' WHERE id=($1)::uuid`, [user.id]);
			res.status(200).send(updatedUser).end();
		} catch (error) {
			res.status(500).send(error.message);
		}
	} else {
		res.status(500).send('Connection failed');
	}
})

router.delete("/:itemId", async (req, res) => {
	const itemId = req.params.itemId;

	await deleteFromDatabase('users', res, itemId)
})

export default router;