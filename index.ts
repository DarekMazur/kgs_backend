import express from 'express';
import dotenv from 'dotenv';

const index = express();
const port = process.env.PORT || 3000;

dotenv.config()

index.get('/', (req, res) => {
	res.send('Hello World!');
});

index.listen(port, () => {
	console.log(`server started on port ${port}`);
});