import nodemailer from 'nodemailer'

const sendMail = ({email, text, html, subject}) => {
	if (!email) {
		throw new Error('email is required');
	}

	const transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: process.env.SMTP_PORT,
		service: process.env.SMTP_SERVICE,
		auth: {
			user: process.env.SMTP_MAIL,
			pass: process.env.SMTP_APP_PASS,
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