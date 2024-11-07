import express from 'express';
import dotenv from 'dotenv';

const app = express();
const port = process.env.PORT || 3000;

dotenv.config()

app.get('/', (req, res) => {
	res.send('Hello World!');
});

app.listen(port, () => {
	console.log(`server started on port ${port}`);
});