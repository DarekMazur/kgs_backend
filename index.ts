import express from 'express';
import dotenv from 'dotenv';
import path from 'path'
import api from './apis/api'

const app = express();
const port = process.env.PORT || 3000;

dotenv.config()

app.use(express.static(__dirname + '/src'));
app.use('/api', api);

app.get('/', (_req, res) => {
	res.sendFile(path.join(__dirname, '/src/index.html'));
});

app.listen(port, () => {
	console.log(`server started on port ${port}`);
});