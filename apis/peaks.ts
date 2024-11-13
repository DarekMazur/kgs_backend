import express from 'express';
import getFromDatabase from "../lib/getFromDatabase";
import {pool} from "../client";
import {IPublicPeak, IResponsePeak} from "../lib/types";
const router = express.Router();

router.get('/', async (_req, res) => {
	await getFromDatabase('peaks', res)
})

router.get('/:itemId', async (req, res) => {
	if (req.params.itemId) {
		const client = await pool.connect();

		if (client) {
			const itemId = req.params.itemId

			const peak: IResponsePeak = await client.query(`SELECT * FROM peaks WHERE id=($1)`, [itemId]).then((result) => {
				return result.rows[0]
			}).catch((err) => {
				res.status(500).send(`Connection failed: ${err.message}`);
			})

			const peakTemplate: IPublicPeak = {
				id: peak.id,
				name: peak.name,
				height: peak.height,
				description: peak.description,
				trial: peak.trial,
				localizationLat: peak.localization_lat,
				localizationLng: peak.localization_lng,
				image: peak.image,
			}

			res.status(200).send(peakTemplate)
		} else {
			res.status(500).send('Connection failed');
		}
	} else {
		res.status(400).send('Request failed')
	}
	await getFromDatabase('peaks', res)
})

export default router;