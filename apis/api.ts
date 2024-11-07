import express from 'express';
import users from './users'
import posts from './posts'
import peaks from './peaks'
import roles from './roles'

const router = express.Router();

router.use('/users', users);
router.use('/posts', posts);
router.use('/peaks', peaks);
router.use('/roles', roles);

router.get('/', (_req, res) => {
	res.send('main API patch');
});

export default router;