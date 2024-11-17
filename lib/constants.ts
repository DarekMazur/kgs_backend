export const emailVerification = (email: string) => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

	return emailRegex.test(email)
}

export const entropy = (string: string) => {
	const uppercase = /[^A-Z]/;
	const lowercase = /[^a-z]/;
	const numbers = /[^0-9]/;
	const specials = /[!@#$%^&*()\-+={}[\]:;"'<>,.?\/|\\]/;

	const length = string.length
	let r = 0

	if (uppercase.test(string)) {
		r += 26
	}

	if (lowercase.test(string)) {
		r += 26
	}

	if (numbers.test(string)) {
		r += 10
	}

	if (specials.test(string)) {
		r += 33
	}

	return length * Math.log2(r)
}

export const acceptedEntropy = 70