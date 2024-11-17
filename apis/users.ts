import express from "express";
import { v4 as uuidv4 } from "uuid";
import getFromDatabase from "../lib/getFromDatabase";
import {pool} from "../client";
import deleteFromDatabase from "../lib/deleteFromDatabase";
const router = express.Router();
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
import {acceptedEntropy, emailVerification, entropy} from "../lib/constants";
import process from "node:process";
import sendMail from "../lib/sendMail";
import authorisation from "../lib/authorisation";
import { v2 as cloudinary } from 'cloudinary'
import {IOptions, IPublicUser, IResponsePeak, IResponseUser} from "../lib/types";

router.use(express.json());

cloudinary.config({
	cloud_name: process.env.CLOUDIANRY_NAME,
	api_key: process.env.CLOUDINARY_KEY,
	api_secret: process.env.CLOUDINARY_SECRET,
})

const hashedPassword = (pass: string, salt: string) =>  bcrypt.hash(pass, salt);

router.get('/', async (req, res) => {
	const token = (req.header('Authorization' as string)?.split(' ')[1])

	if (authorisation(token, res)) {
		await getFromDatabase('users', res)
	}
})

router.get('/login', async (req, res) => {
	if (req.body.email && emailVerification(req.body.email)) {
		const client = await pool.connect()
		const loggedUser = await client.query(`SELECT * FROM users WHERE email = '${req.body.email.toLowerCase()}'`).then(response => {
			return response.rows[0]
		});

		if (loggedUser) {
			if (await bcrypt.compare(req.body.password + loggedUser.registration_date, loggedUser.password)) {
				const role = await client.query(`SELECT * FROM roles WHERE id='${loggedUser.role_id}'`).then(response => {
					return response.rows[0]
				});
				const posts = await client.query(`SELECT * FROM posts WHERE author_id='${loggedUser.id}'`).then(response => {
					return response.rows
				});
				const peaks: IResponsePeak[] = await client.query('SELECT * FROM peaks').then(response => {
					return response.rows
				});
				const token = jwt.sign({
					id: loggedUser.id,
					role_id: role.id
				}, process.env.TOKEN_SECRET_KEY as string, { expiresIn: process.env.TOKEN_EXPIRATION_TIME })

				const response: { data: IPublicUser, token: string } = {
					data: {
						id: loggedUser.id,
						username: loggedUser.username,
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
						posts: posts.map(post => ({
							id: post.id,
							createdAt: new Date(Number(post.created_at)),
							notes: post.notes,
							photo: post.photo,
							peak: peaks.filter(peak => peak.id === post.peak_id).map(peak => ({
								id: peak.id,
								name: peak.name,
								height: peak.height,
								description: peak.description,
								trial: peak.trial,
								localizationLat: peak.localization_lat,
								localizationLng: peak.localization_lng,
								image: peak.image,
							}))[0],
							isHidden: post.is_hidden,
							author: {
								id: loggedUser.id,
								username: loggedUser.username,
								firstName: loggedUser.firstname,
								avatar: loggedUser.avatar,
								isSuspended: !!loggedUser.suspension_timeout && loggedUser.suspension_timeout > Date.now(),
								isBanned: loggedUser.is_banned,
								role: loggedUser.role_id,
							}
						})),
						registrationDate: new Date(Number(loggedUser.registration_date)),
						role: role,
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
		res.status(400).send('Request failed').end();
	}

	const token = (req.header('Authorization') as string).split(' ')[1]

	if (authorisation(token, res, req.body.id)) {
		await getFromDatabase('users', res, req.body.id)
	}
})

router.get("/:itemId", async (req, res) => {
	const itemId = req.params.itemId;

	const token = (req.header('Authorization' as string)?.split(' ')[1])

	if (authorisation(token, res)) {
		await getFromDatabase('users', res, itemId)
	}
});

router.post("/", async (req, res) => {
	const timestamp = Date.now();
	const salt = await bcrypt.genSalt();

	const token = (req.header('Authorization' as string)?.split(' ')[1])

	if (authorisation(token, res)) {
		const client = await pool.connect()

		const checkEmail = await client.query(`SELECT * FROM users WHERE email='${req.body.email.toLowerCase()}'`)

		if (checkEmail && checkEmail.rows.length > 0) {
			res.status(403).json({"message": 'Email already registered'});
			return
		}

		if (req.body.password && (entropy(req.body.password) < acceptedEntropy)) {
			res.status(503).json({"message": "Weak password"}).end();
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
				}, process.env.AUTH_SECRET_KEY as string, { expiresIn: process.env.CONFIRMATION_TOKEN_EXPIRATION_TIME })

				const text = `Konto Użytkownika ${newUser.username} zostało utworzone!
Konto aktywujesz pod linkiem: ${process.env.API_HOST}/confirm/${token}
Link aktywacyjny jest ważny przez 24 godziny.`

				const html = `
					<body style="width: 100%; height: 100%; background-color: #272724; color: #eef7eb; padding: 2rem">
						<div style="background: url(https://res.cloudinary.com/ddyqnp7pp/image/upload/v1731279976/logoFullW_lylrnm.png) center/contain no-repeat; margin: 2rem; width: 100vw; height: 200px;"></div>
						<h1 style="font-weight: bold; margin-bottom: 2rem">Konto Użytkownika <span style="color: #d99e1a">${newUser.username}</span> zostało utworzone!</h1>
						<p style="overflow-wrap: break-word">Konto aktywujesz pod linkiem: <a href="${process.env.API_HOST}/confirm/${token}">${process.env.API_HOST}/confirm/${token}</a></p>
						<p>Link aktywacyjny jest ważny przez 24 godziny.</p>
						<div style="margin-top: 3rem">
							<p>Pozdrawiamy</p>
							<p style="font-weight: bold">Zespół Korony Gór Świętokrzyskich</p>
						</div>
					</body>`

				const subject = `Korona Gór Świętokrzyskich - utworzono konto Użytkownika ${newUser.username}`

				const options: IOptions = {
					email: newUser.email.toLowerCase(),
					text,
					html,
					subject
				}

				sendMail(options)
			} catch (error) {
				res.status(500).send(error.message);
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
	}
});

router.put("/:itemId", async (req, res) => {
	const itemId = req.params.itemId;

	const token = (req.header('Authorization' as string)?.split(' ')[1])

	if (authorisation(token, res, itemId, 1)) {
		const client = await pool.connect()

		if (client) {
			const user = await client.query(`SELECT *
																							 FROM users
																							 WHERE id = ($1)::uuid`, [itemId]).then(response => {
																								 return response.rows[0]
			});

			const role = await client.query(`SELECT * FROM roles WHERE id=($1)`, [user.role_id]).then(response => {
				return response.rows[0]
			});
			const posts = await client.query(`SELECT * FROM posts WHERE author_id='${user.id}'`).then(response => {
				return response.rows
			});
			const peaks: IResponsePeak[] = await client.query('SELECT * FROM peaks').then(response => {
				return response.rows
			});
			const salt = await bcrypt.genSalt();

			interface IUpdate extends IResponseUser {
				password: string;
			}

			const image = await req.body.avatar ? cloudinary.uploader.upload(req.body.avatar).then(results => {
				return results
			}) : null

			if (req.body.password && (entropy(req.body.password) < acceptedEntropy)) {
				res.status(503).json({"message": "Weak password"}).end();
				return
			}

			const updatedUser: IUpdate = {
				id: user.id,
				username: req.body.username ?? user.username,
				email: user.email,
				password: await hashedPassword(req.body.password + user.registration_date, salt) ?? user.password,
				firstname: req.body.firstName ?? user.firstname,
				lastname: req.body.lastName ?? user.lastname,
				avatar: (await image).secure_url ?? user.avatar,
				description: req.body.description ?? user.description,
				is_banned: req.body.isBanned === undefined ? user.is_banned : req.body.is_banned,
				suspension_timeout: req.body.suspensionTimeout ?? user.suspension_timeout,
				total_suspensions: req.body.totalSuspensions ?? user.total_suspensions,
				is_confirmed: req.body.isConfirmed === undefined ? user.is_confirmed : req.body.isConfirmed,
				messages: req.body.messages ?? user.messages ?? [],
				role_id: role.id,
				registration_date: user.registration_date
			}

			const responseUser: IPublicUser = {
				id: updatedUser.id,
				username: updatedUser.username,
				email: updatedUser.email,
				firstName: updatedUser.firstname,
				lastName: updatedUser.lastname,
				avatar: updatedUser.avatar,
				description: updatedUser.description,
				isBanned: updatedUser.is_banned,
				suspensionTimeout: new Date(Number(updatedUser.suspension_timeout)),
				totalSuspensions: updatedUser.total_suspensions,
				isConfirmed: updatedUser.is_confirmed,
				messages: updatedUser.messages ?? [],
				posts: posts.map(post => ({
					id: post.id,
					createdAt: new Date(Number(post.created_at)),
					notes: post.notes,
					photo: post.photo,
					peak: peaks.filter(peak => peak.id === post.peak_id).map(peak => ({
						id: peak.id,
						name: peak.name,
						height: peak.height,
						description: peak.description,
						trial: peak.trial,
						localizationLat: peak.localization_lat,
						localizationLng: peak.localization_lng,
						image: peak.image,
					}))[0],
					isHidden: post.is_hidden,
					author: {
						id: updatedUser.id,
						username: updatedUser.username,
						firstName: updatedUser.firstname,
						avatar: updatedUser.avatar,
						isSuspended: !!updatedUser.suspension_timeout && updatedUser.suspension_timeout > Date.now(),
						isBanned: updatedUser.is_banned,
						role: updatedUser.role_id,
					}
				})),
				registrationDate: new Date(Number(updatedUser.registration_date)),
				role,
			}

			try {
				if (updatedUser.suspension_timeout) {
					await client.query(`UPDATE users
															SET suspension_timeout='${updatedUser.suspension_timeout}'
															WHERE id = ($1)::uuid`, [user.id])
				}

				if (updatedUser.messages && updatedUser.messages.length > 0) {
					await client.query(`UPDATE users
															SET messages='${updatedUser.messages}'
															WHERE id = ($1)::uuid`, [user.id])
				}
				await client.query(`UPDATE users
														SET username='${updatedUser.username}',
																email='${updatedUser.email}',
																password='${updatedUser.password}',
																firstname='${updatedUser.firstname}',
																lastname='${updatedUser.lastname}',
																avatar='${updatedUser.avatar}',
																description='${updatedUser.description}',
																is_banned='${updatedUser.is_banned}',
																total_suspensions='${updatedUser.total_suspensions}',
																is_confirmed='${updatedUser.is_confirmed}',
																role_id='${updatedUser.role_id}'
														WHERE id = ($1)::uuid`, [user.id]);
				res.status(200).send(responseUser);
			} catch (error) {
				res.status(500).send(error.message);
			}
		}
	} else {
		res.status(500).send('Connection failed');
	}
})

router.put("/messages/:itemId/", async (req, res) => {
	const itemId = req.params.itemId;

	if (itemId) {
		const token = (req.header('Authorization' as string)?.split(' ')[1])

		if (authorisation(token, res, itemId)) {
			const client = await pool.connect()

			if (client) {
				const { message, header, priority } = req.body;

				const user = await client.query(`SELECT * FROM users WHERE id=($1)`, [itemId]).then(async response => {
					return response.rows[0];
				})

				const messageBody = {
					id: uuidv4(),
					priority: priority,
					header: header,
					message: message,
					sendTime: Date.now(),
					openedTime: null
				}

				if (user) {
					const role = await client.query(`SELECT * FROM roles WHERE id='${user.role_id}'`).then((response) => {
						return response.rows[0];
					});
					const posts = await client.query(`SELECT * FROM posts WHERE author_id='${user.id}'`).then(response => {
						return response.rows;
					});

					const updatedUser = {
						id: user.id,
						username: user.username,
						email: user.email,
						firstName: user.firstname,
						lastName: user.lastname,
						avatar: user.avatar,
						description: user.description,
						isBanned: user.is_banned,
						suspensionTimeout: user.suspension_timeout,
						totalSuspensions: user.total_suspensions,
						isConfirmed: user.is_confirmed,
						messages: [...(user.messages || []), messageBody],
						posts,
						registrationDate: new Date(Number(user.registration_date)),
						role,
					}

					await client.query(`UPDATE users SET messages='${JSON.stringify(updatedUser.messages)}' WHERE id=($1)`, [itemId]);

					res.status(200).send(updatedUser)
				} else {
					res.status(404).json({"message": 'User not found'});
				}
			} else {
				res.status(500).json({"message": 'Connection failed'});
			}
		} else {
			res.status(403).json({"message": 'Authentication failed'});
		}
	} else {
		res.status(400).json({"message": 'Request failed'})
	}
})

router.delete("/:itemId", async (req, res) => {
	const itemId = req.params.itemId;

	const token = (req.header('Authorization' as string)?.split(' ')[1])

	if (authorisation(token, res, itemId, 1)) {
		await deleteFromDatabase('users', res, itemId)
	}
})

export default router;