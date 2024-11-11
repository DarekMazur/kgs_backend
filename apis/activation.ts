import express from 'express';
import {pool} from "../client";
import statusAction from "../lib/statusAction";
const router = express.Router();

const activationView = (user: string) => {
	return (`<body style="width: 100%; height: 100%; background-color: #272724; color: #eef7eb; padding: 2rem">
	<div style="background: url(https://res.cloudinary.com/ddyqnp7pp/image/upload/v1731279976/logoFullW_lylrnm.png) center/contain no-repeat; margin: 2rem; width: 100vw; height: 200px;"></div>
	<h1 style="font-weight: bold; margin-bottom: 2rem; text-align: center">Konto Użytkownika <span style="color: #d99e1a">${user}</span> zostało aktywowane!</h1>
	<p style="text-align: center">Możesz się już zalogować do aplikacji.</p>
</body>`)
}

router.get('/:token', async (req, res) => {
	await statusAction(req.params.token, res).then(async response => {
		if (response.is_confirmed) {
			res.status(403).json('User already activated').end();
		} else {
			const client = await pool.connect()
			try {
				await client.query(`UPDATE users SET is_confirmed=true WHERE id=($1)`, [response.id])
				res.status(200).send(activationView(response.username)).end();
			} catch (error) {
				res.status(500).send(`Error: ${error.message}`);
			} finally {
				client.release()
			}
		}
	})
})

export default router;