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
	AdminSetUserPasswordCommand,
	AdminUpdateUserAttributesCommand,
	ListGroupsCommand,
	CreateGroupCommand,
	DeleteGroupCommand,
	DeliveryMediumType
} from '@aws-sdk/client-cognito-identity-provider';
import { makeClient, awsConfigNoPathStyle, paginateAll } from './aws';
import type {
	CognitoUserPoolSummary,
	CognitoUserPoolDetail,
	CognitoUser,
	CognitoGroup
} from '$lib/types/cognito';

const cognito = makeClient(CognitoIdentityProviderClient, awsConfigNoPathStyle);

export async function listUserPools(): Promise<CognitoUserPoolSummary[]> {
	return paginateAll((token) =>
		cognito
			.send(new ListUserPoolsCommand({ MaxResults: 60, NextToken: token }))
			.then((res) => ({
				items: (res.UserPools ?? []).map((p) => ({
					id: p.Id!,
					name: p.Name!,
					creationDate: p.CreationDate?.toISOString(),
					lastModifiedDate: p.LastModifiedDate?.toISOString()
				})),
				nextToken: res.NextToken
			}))
	);
}

export async function describeUserPool(poolId: string): Promise<CognitoUserPoolDetail> {
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
	await cognito.send(new CreateUserPoolCommand({ PoolName: name }));
}

export async function deleteUserPool(poolId: string): Promise<void> {
	await cognito.send(new DeleteUserPoolCommand({ UserPoolId: poolId }));
}

export async function listUsers(poolId: string, filter?: string): Promise<CognitoUser[]> {
	return paginateAll((token) =>
		cognito
			.send(
				new ListUsersCommand({
					UserPoolId: poolId,
					Limit: 60,
					PaginationToken: token,
					Filter: filter || undefined
				})
			)
			.then((res) => ({
				items: (res.Users ?? []).map((u) => {
					const attrs: Record<string, string> = {};
					for (const a of u.Attributes ?? []) {
						if (a.Name) attrs[a.Name] = a.Value ?? '';
					}
					return {
						username: u.Username!,
						status: u.UserStatus,
						enabled: u.Enabled ?? true,
						createdAt: u.UserCreateDate?.toISOString(),
						updatedAt: u.UserLastModifiedDate?.toISOString(),
						email: attrs['email'],
						attributes: attrs
					};
				}),
				nextToken: res.PaginationToken
			}))
	);
}

export async function createUser(
	poolId: string,
	username: string,
	email: string,
	tempPassword: string
): Promise<void> {
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

export async function updateUserAttributes(
	poolId: string,
	username: string,
	attributes: Record<string, string>
): Promise<void> {
	await cognito.send(
		new AdminUpdateUserAttributesCommand({
			UserPoolId: poolId,
			Username: username,
			UserAttributes: Object.entries(attributes).map(([Name, Value]) => ({ Name, Value }))
		})
	);
}

export async function deleteUser(poolId: string, username: string): Promise<void> {
	await cognito.send(new AdminDeleteUserCommand({ UserPoolId: poolId, Username: username }));
}

export async function enableUser(poolId: string, username: string): Promise<void> {
	await cognito.send(new AdminEnableUserCommand({ UserPoolId: poolId, Username: username }));
}

export async function disableUser(poolId: string, username: string): Promise<void> {
	await cognito.send(new AdminDisableUserCommand({ UserPoolId: poolId, Username: username }));
}

export async function resetUserPassword(poolId: string, username: string): Promise<void> {
	await cognito.send(
		new AdminResetUserPasswordCommand({ UserPoolId: poolId, Username: username })
	);
}

export async function setUserPassword(
	poolId: string,
	username: string,
	password: string,
	permanent = true
): Promise<void> {
	await cognito.send(
		new AdminSetUserPasswordCommand({
			UserPoolId: poolId,
			Username: username,
			Password: password,
			Permanent: permanent
		})
	);
}

export async function listGroups(poolId: string): Promise<CognitoGroup[]> {
	return paginateAll((token) =>
		cognito
			.send(new ListGroupsCommand({ UserPoolId: poolId, Limit: 60, NextToken: token }))
			.then((res) => ({
				items: (res.Groups ?? []).map((g) => ({
					name: g.GroupName!,
					description: g.Description,
					creationDate: g.CreationDate?.toISOString(),
					lastModifiedDate: g.LastModifiedDate?.toISOString()
				})),
				nextToken: res.NextToken
			}))
	);
}

export async function createGroup(
	poolId: string,
	name: string,
	description?: string
): Promise<void> {
	await cognito.send(
		new CreateGroupCommand({
			UserPoolId: poolId,
			GroupName: name,
			Description: description || undefined
		})
	);
}

export async function deleteGroup(poolId: string, name: string): Promise<void> {
	await cognito.send(new DeleteGroupCommand({ UserPoolId: poolId, GroupName: name }));
}
