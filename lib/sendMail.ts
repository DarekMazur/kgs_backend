import nodemailer from 'nodemailer'

const sendMail = ({email, username, token}) => {
	if (!email) {
		throw new Error('email is required');
	}

	const transporter = nodemailer.createTransport({
		host: process.env.SMPT_HOST,
		port: process.env.SMPT_PORT,
		service: process.env.SMPT_SERVICE,
		auth: {
			user: process.env.SMPT_MAIL,
			pass: process.env.SMPT_APP_PASS,
		},
	});

	const mailOptions = {
		from: 'Korona Gór Świętokrzyskich <kontakt@nerdistry.pl>',
		to: email,
		subject: `Korona Gór Świętokrzyskich - utworzono konto Użytkownika ${username}`,
		text: `Konto Użytkownika ${username} zostało utworzone!
Konto aktywujesz pod linkiem: ${process.env.API_HOST}/api/users/activation/${token}
Link aktywacyjny jest ważny przez 24 godziny.`,
		html: `<body style="width: 100%; height: 100%; background-color: #272724; color: #eef7eb; padding: 2rem">
		<div style="background: url(https://res.cloudinary.com/ddyqnp7pp/image/upload/v1731279976/logoFullW_lylrnm.png) center/contain no-repeat; margin: 2rem; width: 100vw; height: 200px;"></div>
		<h1 style="font-weight: bold; margin-bottom: 2rem">Konto Użytkownika ${username} zostało utworzone!</h1>
		<p style="overflow-wrap: break-word">Konto aktywujesz pod linkiem: <a href="${process.env.API_HOST}/api/users/activation/${token}">${process.env.API_HOST}/api/users/activation/${token}</a></p>
		<p>Link aktywacyjny jest ważny przez 24 godziny.</p>
		<div style="margin-top: 3rem">
			<p>Pozdrawiamy</p>
			<p style="font-weight: bold">Zespół Korony Gór Świętokrzyskich</p>
		</div>
		</body>`
	};

	transporter.sendMail(mailOptions, (err) => {
		if (err) {
			console.log("Error " + err);
		} else {
			console.log("Email sent successfully");
		}
	});
}
export default sendMail;