export interface IRole {
	id: number,
	name: string,
	type: string
}

export interface IMessage {
	id: string;
	priority: number;
	header: string;
	message: string;
	sendTime: Date;
	openedTime?: Date;
}

interface IPeak {
	id: string,
	name: string,
	height: string,
	description: string,
	trial: string,
	image: string,
}

interface IPost {
	id: string,
	notes: string,
	photo: string,
}

interface IUser {
	id: string,
	username: string,
	email: string,
	avatar: string,
	description?: string,
	messages: IMessage[],
}

export interface IPublicPeak extends IPeak {
	localizationLat: string,
	localizationLng: string,
}

export interface IResponsePeak extends IPeak {
	localization_lat: string,
	localization_lng: string,
}

export interface IPublicPost extends IPost {
	peak: IPeak;
	isHidden: boolean;
	createdAt: Date;
	author: {
		id: string,
		username: string,
		firstName?: string,
		avatar: string,
		isSuspended: boolean,
		isBanned: boolean,
		role: number
	}
}

export interface IResponsePost extends IPost {
	peak_id: string;
	is_hidden: boolean;
	created_at: number;
	author_id: string;
}

export interface IPublicUser extends IUser {
	firstName?: string,
	lastName?: string,
	isBanned: boolean,
	suspensionTimeout?: Date,
	totalSuspensions: number,
	isConfirmed: boolean,
	posts: IPublicPost[],
	registrationDate: Date,
	role: IRole,
}

export interface IResponseUser extends IUser {
	firstname?: string,
	lastname?: string,
	is_banned: boolean,
	suspension_timeout?: number,
	total_suspensions: number,
	is_confirmed: boolean,
	registration_date: number,
	role_id: number,
}

export interface IOptions {
	email: string,
	text: string,
	html: string,
	subject: string
}