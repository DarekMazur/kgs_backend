import bcrypt from 'bcrypt';
import {pool} from "./client";
import { faker } from '@faker-js/faker';

const hashedPassword = (pass: string, salt: string) =>  bcrypt.hash(pass, salt);

const addToDB = async (array, action) => {
	await Promise.all(
		array.map((item) => {
			action(item);
		})
	)
}

const createDatabase = async () => {

	const createRoles = async () => {
		const client = await pool.connect()

		const roles = [
			{id: 0, name: 'Super Administrator', type: 'superAdmin'},
			{id: 1, name: 'Administrator', type: 'admin'},
			{id: 2, name: 'Moderator', type: 'mod'},
			{id: 3, name: 'Użytkownik', type: 'user'}
		]

		const addRole = async (role) => {
			await client.query(`INSERT INTO roles (id, name, type)
                          VALUES ('${role.id}', '${role.name}', '${role.type}')
                          ON CONFLICT DO NOTHING;`)
		}

		await addToDB(roles, addRole)
	};

	const createPeaks = async () => {
		const client = await pool.connect()

		const length = faker.number.int({min: 25, max: 40})
		const peaks = []

		for (let i = 0; i < length; i += 1) {
			const peak = {
				id: faker.string.uuid(),
				name: faker.lorem.words({min: 1, max: 3}),
				height: faker.number.int({min: 400, max: 700}),
				description: faker.lorem.words({min: 10, max: 50}),
				trial: faker.lorem.words({min: 2, max: 5}),
				localizationLat: faker.location.latitude({max: 51.9194, min: 19.1451}),
				localizationLng: faker.location.longitude({min: 14.24712, max: 23.89251}),
				image: faker.image.urlLoremFlickr({category: 'mountains'}),
			}

			peaks.push(peak)
		}

		const addPeak = async (peak) => {
			await client.query(`INSERT INTO peaks (id, name, height, description, trial, localization_lat, localization_lng,
                                             image)
                          VALUES ('${peak.id}', '${peak.name}', '${peak.height}', '${peak.description}', '${peak.trial}
                                  ', '${peak.localizationLat}', '${peak.localizationLng}', '${peak.image}')
                          ON CONFLICT DO NOTHING;`)
		}

		await addToDB(peaks, addPeak)
	}

	await createRoles()
	await createPeaks()

	const createUsers = async () => {
		const client = await pool.connect()

		const users = []
		const length = faker.number.int({min: 55, max: 70})

		for (let i = 0; i < length; i += 1) {
			const roleId = faker.number.int({min: 0, max: 3})

			const registration = faker.datatype.boolean({probability: 0.3})
				? faker.date.recent().getTime()
				: faker.date.past().getTime()

			const salt = await bcrypt.genSalt();
			const pass = await hashedPassword(faker.internet.password() + registration.toString(), salt);

			const user = {
				id: faker.string.uuid(),
				username: faker.internet.username().toString().replace("'", "&#39;"),
				email: faker.internet.email().toString(),
				password: pass,
				firstname: faker.datatype.boolean({probability: 0.6})
					? faker.person.firstName().toString().replace("'", "&#39;")
					: "",
				lastname: faker.datatype.boolean({probability: 0.4})
					? faker.person.lastName().toString().replace("'", "&#39;")
					: "",
				avatar: faker.datatype.boolean({probability: 0.7})
					? faker.image.avatar().toString()
					: "",
				description: faker.datatype.boolean({probability: 0.5})
					? faker.person.bio().toString()
					: "",
				registration_date: registration,
				is_banned: faker.datatype.boolean({probability: 0.06}),
				total_suspensions: 0,
				is_confirmed: faker.datatype.boolean({probability: 0.7}),
				role_id: roleId,
			}

			users.push(user)
		}

		const addUser = async (user) => {
			await client.query(`INSERT INTO users (id, username, email, password, firstname, lastname, avatar, description,
                                             registration_date, is_banned, total_suspensions, is_confirmed, role_id)
                          VALUES ('${user.id}', '${user.username}', '${user.email}', '${user.password}',
                                  '${user.firstname}', '${user.lastname}', '${user.avatar}', '${user.description}',
                                  '${user.registration_date}', '${user.is_banned}', '${user.total_suspensions}',
                                  '${user.is_confirmed}', '${user.role_id}')
                          ON CONFLICT DO NOTHING;`)
		}

		await addToDB(users, addUser)
	}

	await createUsers()

	const createPosts = async () => {
		const client = await pool.connect()

		const posts = []
		const length = faker.number.int({min: 100, max: 500})

		for (let i = 0; i < length; i += 1) {
			const peaks = await client.query(`SELECT *
                                        FROM peaks`)
			const users = await client.query(`SELECT *
                                        FROM users`)

			const userId = users.rows[faker.number.int({min: 0, max: users.rows.length - 1})].id
			const peakId = peaks.rows[faker.number.int({min: 0, max: peaks.rows.length - 1})].id

			const post = {
				id: faker.string.uuid(),
				author_id: userId,
				created_at: faker.date.past().getTime(),
				notes: faker.lorem.paragraph(),
				photo: faker.image.urlLoremFlickr({category: 'mountains'}),
				peak_id: peakId,
				is_hidden: faker.datatype.boolean({probability: 0.05}),
			}

			posts.push(post)
		}

		const addPost = async (post) => {
			await client.query(`INSERT INTO posts (id, notes, photo, created_at, is_hidden, author_id, peak_id)
                          VALUES ('${post.id}', '${post.notes}', '${post.photo}', '${post.created_at}',
                                  '${post.is_hidden}', '${post.author_id}', '${post.peak_id}')
                          ON CONFLICT DO NOTHING;`)
		}

		await addToDB(posts, addPost)
	}

	await createPosts()
}

createDatabase().then(() => {
	console.log("Database created")})