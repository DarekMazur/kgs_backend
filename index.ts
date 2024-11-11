import express from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import path from 'path'
import api from './apis/api'
import activation from './apis/activation'
import recovery from './apis/reset-password'
import process from "node:process";

const app = express();
const port = process.env.PORT || 3000;

dotenv.config()

const corsOptions = {
	origin: process.env.ORIGIN || "*",
	optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.static(__dirname + '/src'));
app.use('/api', api);
app.use('/confirm', activation);
app.use('/reset-password', recovery);

app.get('/', (_req, res) => {
	res.sendFile(path.join(__dirname, '/src/index.html'));
});

app.listen(port, () => {
	console.log(`server started on port ${port}`);
});
