import express from 'express';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import statusAction from "../lib/statusAction";
import {pool} from "../client";
const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));


const recoveryView = (id) => {
	return (
		`<body style="width: 100%; height: 100%; background-color: #272724; color: #eef7eb; padding: 2rem">
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
		`<body style="max-width: 100vw; background-color: #272724; color: #eef7eb; padding: 2rem">
			<div style="background: url(https://res.cloudinary.com/ddyqnp7pp/image/upload/v1731279976/logoFullW_lylrnm.png) center/contain no-repeat; margin: 2rem; max-width: 100vw; height: 200px;"></div>
			<h3 style="font-weight: bold; margin-bottom: 2rem; text-align: center">Hasło zmienione poprawnie</h3>
		</body>`
	)
}

const view404 = () => {
	return(
		`<body style="max-width: 100vw; background-color: #272724; color: #eef7eb; padding: 2rem">
			<div style="background: url(https://res.cloudinary.com/ddyqnp7pp/image/upload/v1731279976/logoFullW_lylrnm.png) center/contain no-repeat; margin: 2rem; max-width: 100vw; height: 200px;"></div>
			<h3 style="font-weight: bold; margin-bottom: 2rem; text-align: center">Nie znaleziono</h3>
		</body>`
	)
}

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
