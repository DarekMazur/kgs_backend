import express from 'express';
const router = express.Router();

router.get('/', (_req, res) => {
	res.send('roles API patch');
});

export default router;