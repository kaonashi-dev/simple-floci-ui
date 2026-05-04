import {
	CognitoIdentityProviderClient,
	ListUserPoolsCommand,
	DescribeUserPoolCommand,
	CreateUserPoolCommand,
	DeleteUserPoolCommand,
	ListUsersCommand,
	AdminCreateUserCommand,
	AdminDeleteUserCommand,
	AdminEnableUserCommand,
	AdminDisableUserCommand,
	AdminResetUserPasswordCommand,
	ListGroupsCommand,
	CreateGroupCommand,
	DeleteGroupCommand,
	DeliveryMediumType
} from '@aws-sdk/client-cognito-identity-provider';
import { awsConfig } from './aws';
import type {
	CognitoUserPoolSummary,
	CognitoUserPoolDetail,
	CognitoUser,
	CognitoGroup
} from '$lib/types/cognito';

function client() {
	return new CognitoIdentityProviderClient({
		region: awsConfig.region,
		endpoint: awsConfig.endpoint,
		credentials: awsConfig.credentials
	});
}

export async function listUserPools(): Promise<CognitoUserPoolSummary[]> {
	const cognito = client();
	const pools: CognitoUserPoolSummary[] = [];
	let nextToken: string | undefined;

	do {
		const res = await cognito.send(new ListUserPoolsCommand({ MaxResults: 60, NextToken: nextToken }));
		for (const p of res.UserPools ?? []) {
			pools.push({
				id: p.Id!,
				name: p.Name!,
				creationDate: p.CreationDate?.toISOString(),
				lastModifiedDate: p.LastModifiedDate?.toISOString()
			});
		}
		nextToken = res.NextToken;
	} while (nextToken);

	return pools;
}

export async function describeUserPool(poolId: string): Promise<CognitoUserPoolDetail> {
	const cognito = client();
	const res = await cognito.send(new DescribeUserPoolCommand({ UserPoolId: poolId }));
	const p = res.UserPool!;
	return {
		id: p.Id!,
		name: p.Name!,
		status: p.Status,
		creationDate: p.CreationDate?.toISOString(),
		lastModifiedDate: p.LastModifiedDate?.toISOString(),
		estimatedNumberOfUsers: p.EstimatedNumberOfUsers,
		autoVerifiedAttributes: p.AutoVerifiedAttributes,
		usernameAttributes: p.UsernameAttributes
	};
}

export async function createUserPool(name: string): Promise<void> {
	const cognito = client();
	await cognito.send(new CreateUserPoolCommand({ PoolName: name }));
}

export async function deleteUserPool(poolId: string): Promise<void> {
	const cognito = client();
	await cognito.send(new DeleteUserPoolCommand({ UserPoolId: poolId }));
}

export async function listUsers(poolId: string, filter?: string): Promise<CognitoUser[]> {
	const cognito = client();
	const users: CognitoUser[] = [];
	let paginationToken: string | undefined;

	do {
		const res = await cognito.send(
			new ListUsersCommand({
				UserPoolId: poolId,
				Limit: 60,
				PaginationToken: paginationToken,
				Filter: filter || undefined
			})
		);

		for (const u of res.Users ?? []) {
			const attrs: Record<string, string> = {};
			for (const a of u.Attributes ?? []) {
				if (a.Name) attrs[a.Name] = a.Value ?? '';
			}
			users.push({
				username: u.Username!,
				status: u.UserStatus,
				enabled: u.Enabled ?? true,
				createdAt: u.UserCreateDate?.toISOString(),
				updatedAt: u.UserLastModifiedDate?.toISOString(),
				email: attrs['email'],
				attributes: attrs
			});
		}
		paginationToken = res.PaginationToken;
	} while (paginationToken);

	return users;
}

export async function createUser(
	poolId: string,
	username: string,
	email: string,
	tempPassword: string
): Promise<void> {
	const cognito = client();
	await cognito.send(
		new AdminCreateUserCommand({
			UserPoolId: poolId,
			Username: username,
			TemporaryPassword: tempPassword,
			UserAttributes: [{ Name: 'email', Value: email }],
			DesiredDeliveryMediums: [DeliveryMediumType.EMAIL],
			MessageAction: 'SUPPRESS'
		})
	);
}

export async function deleteUser(poolId: string, username: string): Promise<void> {
	const cognito = client();
	await cognito.send(new AdminDeleteUserCommand({ UserPoolId: poolId, Username: username }));
}

export async function enableUser(poolId: string, username: string): Promise<void> {
	const cognito = client();
	await cognito.send(new AdminEnableUserCommand({ UserPoolId: poolId, Username: username }));
}

export async function disableUser(poolId: string, username: string): Promise<void> {
	const cognito = client();
	await cognito.send(new AdminDisableUserCommand({ UserPoolId: poolId, Username: username }));
}

export async function resetUserPassword(poolId: string, username: string): Promise<void> {
	const cognito = client();
	await cognito.send(
		new AdminResetUserPasswordCommand({ UserPoolId: poolId, Username: username })
	);
}

export async function listGroups(poolId: string): Promise<CognitoGroup[]> {
	const cognito = client();
	const groups: CognitoGroup[] = [];
	let nextToken: string | undefined;

	do {
		const res = await cognito.send(
			new ListGroupsCommand({ UserPoolId: poolId, Limit: 60, NextToken: nextToken })
		);
		for (const g of res.Groups ?? []) {
			groups.push({
				name: g.GroupName!,
				description: g.Description,
				creationDate: g.CreationDate?.toISOString(),
				lastModifiedDate: g.LastModifiedDate?.toISOString()
			});
		}
		nextToken = res.NextToken;
	} while (nextToken);

	return groups;
}

export async function createGroup(
	poolId: string,
	name: string,
	description?: string
): Promise<void> {
	const cognito = client();
	await cognito.send(
		new CreateGroupCommand({
			UserPoolId: poolId,
			GroupName: name,
			Description: description || undefined
		})
	);
}

export async function deleteGroup(poolId: string, name: string): Promise<void> {
	const cognito = client();
	await cognito.send(new DeleteGroupCommand({ UserPoolId: poolId, GroupName: name }));
}
