import nodemailer from 'nodemailer'

const sendMail = ({email, text, html, subject}) => {
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
		from: `Korona Gór Świętokrzyskich <${process.env.CONFIRM_SENDER_EMAIL}>`,
		to: email,
		subject,
		text,
		html
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