import express from 'express';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import statusAction from "../lib/statusAction";
import {pool} from "../client";
import jwt from "jsonwebtoken";
import process from "node:process";
import sendMail from "../lib/sendMail";
const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));

const recoveryView = (id: string) => {
	return (
		`<!doctype html>
		<html lang="pl">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1">
				<title>Korona Gór Śwętokrzyskich | Reset</title>
		</head>
		<body style="width: 100%; height: 100%; background-color: #272724; color: #eef7eb; padding: 2rem">
			<div style="background: url(https://res.cloudinary.com/ddyqnp7pp/image/upload/v1731279976/logoFullW_lylrnm.png) center/contain no-repeat; margin: 2rem; width: 100vw; height: 200px;"></div>
			<h3 style="font-weight: bold; margin-bottom: 2rem; text-align: center">Podaj nowe hasło</h3>
			<form method="POST" action="/reset-password">
				<input type="password" name="password" id="password" placeholder="Nowe hasło" required />
				<input type="hidden" name="id" value="${id}" />
				<input type="submit" value="Zatwierdź">
			</form>
		</body>`
	)
}

const resetView = () => {
	return(
		`<!doctype html>
		<html lang="pl">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1">
				<title>Korona Gór Śwętokrzyskich | Reset</title>
		</head>
		<body style="max-width: 100vw; background-color: #272724; color: #eef7eb; padding: 2rem">
			<div style="background: url(https://res.cloudinary.com/ddyqnp7pp/image/upload/v1731279976/logoFullW_lylrnm.png) center/contain no-repeat; margin: 2rem; max-width: 100vw; height: 200px;"></div>
			<h3 style="font-weight: bold; margin-bottom: 2rem; text-align: center">Hasło zmienione poprawnie</h3>
		</body>`
	)
}

const view404 = () => {
	return(
		`<!doctype html>
		<html lang="pl">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1">
				<title>Korona Gór Śwętokrzyskich | 404</title>
		</head>
		<body style="max-width: 100vw; background-color: #272724; color: #eef7eb; padding: 2rem">
			<div style="background: url(https://res.cloudinary.com/ddyqnp7pp/image/upload/v1731279976/logoFullW_lylrnm.png) center/contain no-repeat; margin: 2rem; max-width: 100vw; height: 200px;"></div>
			<h3 style="font-weight: bold; margin-bottom: 2rem; text-align: center">Nie znaleziono</h3>
		</body>`
	)
}

router.post('/forgot/:email', async (req, res) => {
	const userEmail = req.params.email.toLowerCase()

	const client = await pool.connect()

	const response = await client.query(`SELECT * FROM users WHERE email=($1)`, [userEmail])
	const user = await response.rows[0]

	console.log(response.rows[0])

	const {id, username} = user

	const token = jwt.sign({
		id
	}, process.env.AUTH_SECRET_KEY as string, { expiresIn: process.env.CONFIRMATION_TOKEN_EXPIRATION_TIME })

	const text = `Prośba o reset hasła Użytkownika ${username}.
Wysłano żądanie resetu hasła Użytkownika ${username}. Jeśli to nie Ty, to zignoruj tę wiadomość.
Aby ustalić nowe hasło prszejdź pod link: ${process.env.API_HOST}/reset-password/${token}
Link jest ważny przez 24 godziny.`

	const html = `
				<body style="width: 100%; height: 100%; background-color: #272724; color: #eef7eb; padding: 2rem">
					<div style="background: url(https://res.cloudinary.com/ddyqnp7pp/image/upload/v1731279976/logoFullW_lylrnm.png) center/contain no-repeat; margin: 2rem; width: 100vw; height: 200px;"></div>
					<h1 style="font-weight: bold; margin-bottom: 2rem">Prośba o reset hasła Użytkownika <span style="color: #d99e1a">${username}</span>.</h1>
					<p style="overflow-wrap: break-word">Wysłano żądanie resetu hasła Użytkownika ${username}. Jeśli to nie Ty, to zignoruj tę wiadomość.</p>
					<p style="overflow-wrap: break-word">Konto aktywujesz pod linkiem: <a href="${process.env.API_HOST}/reset-password/${token}">${process.env.API_HOST}/reset-password/${token}</a></p>
					<p>Link jest ważny przez 24 godziny.</p>
					<div style="margin-top: 3rem">
						<p>Pozdrawiamy</p>
						<p style="font-weight: bold">Zespół Korony Gór Świętokrzyskich</p>
					</div>
				</body>`

	const subject = `Korona Gór Świętokrzyskich - reset hasła Użytkownika ${username}`

	const options = {
		email: userEmail,
		text,
		html,
		subject,
		token,
	}

	sendMail(options)

	res.status(200).send('Wysłano email')

})

router.get('/:token', async (req, res) => {
	if (req.params.token) {
		await statusAction(req.params.token, res).then((response) => {
			res.send(recoveryView(response.id))
		})
	} else {
		res.status(404).send('Invalid or expired token');
	}
})

router.post('/', async (req, res) => {
	const { id, password } = req.body;

	if (id && password) {
		const client = await pool.connect()

		const hashedPassword = (pass: string, salt: string) =>  bcrypt.hash(pass, salt);
		const salt = await bcrypt.genSalt();
		const registrationDate = await client.query(`SELECT registration_date FROM users WHERE id=($1)::uuid`, [id]);

		const hashed = await hashedPassword(password.toString() + registrationDate.rows[0].registration_date.toString(), salt)

		await client.query(`UPDATE users SET password='${hashed}' WHERE id=($1)::uuid`, [id])

		res.status(200).send(resetView());
	} else {
		res.status(404).send(view404());
	}
})

router.get('/', async (_req, res) => {
	res.status(404).send(view404());
})

export default router;
