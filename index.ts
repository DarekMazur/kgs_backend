import express from 'express';
import dotenv from 'dotenv';
import path from 'path'

const app = express();
const port = process.env.PORT || 3000;

dotenv.config()

app.use(express.static(__dirname + '/src'));

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '/src/index.html'));
});

app.listen(port, () => {
	console.log(`server started on port ${port}`);
});