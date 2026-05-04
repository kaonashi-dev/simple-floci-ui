export type CognitoUserPoolSummary = {
	id: string;
	name: string;
	creationDate?: string;
	lastModifiedDate?: string;
	userCount?: number;
};

export type CognitoUserPoolDetail = {
	id: string;
	name: string;
	status?: string;
	creationDate?: string;
	lastModifiedDate?: string;
	estimatedNumberOfUsers?: number;
	policies?: Record<string, unknown>;
	autoVerifiedAttributes?: string[];
	usernameAttributes?: string[];
};

export type CognitoUser = {
	username: string;
	status?: string;
	enabled: boolean;
	createdAt?: string;
	updatedAt?: string;
	email?: string;
	attributes: Record<string, string>;
};

export type CognitoGroup = {
	name: string;
	description?: string;
	creationDate?: string;
	lastModifiedDate?: string;
	userCount?: number;
};
