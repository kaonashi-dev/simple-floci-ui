import { beforeEach, describe, expect, it } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { AdminCreateUserCommand, AdminDeleteUserCommand, AdminDisableUserCommand, AdminEnableUserCommand, AdminResetUserPasswordCommand, AdminSetUserPasswordCommand, AdminUpdateUserAttributesCommand, CognitoIdentityProviderClient, CreateGroupCommand, CreateUserPoolCommand, DeleteGroupCommand, DeleteUserPoolCommand, DescribeUserPoolCommand, ListGroupsCommand, ListUserPoolsCommand, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';
import { createGroup, createUser, createUserPool, deleteGroup, deleteUser, deleteUserPool, describeUserPool, disableUser, enableUser, listGroups, listUserPools, listUsers, resetUserPassword, setUserPassword, updateUserAttributes } from '$lib/floci/cognito';

const cognitoMock = mockClient(CognitoIdentityProviderClient);

describe('cognito service', () => {
	beforeEach(() => cognitoMock.reset());

	it('lists and describes user pools', async () => {
		cognitoMock.on(ListUserPoolsCommand).resolves({ UserPools: [{ Id: 'pool', Name: 'Pool', CreationDate: new Date('2026-01-01T00:00:00Z') }] });
		cognitoMock.on(DescribeUserPoolCommand).resolves({ UserPool: { Id: 'pool', Name: 'Pool', EstimatedNumberOfUsers: 2, AutoVerifiedAttributes: ['email'] } });

		await expect(listUserPools()).resolves.toEqual([{ id: 'pool', name: 'Pool', creationDate: '2026-01-01T00:00:00.000Z', lastModifiedDate: undefined }]);
		await expect(describeUserPool('pool')).resolves.toEqual(expect.objectContaining({ id: 'pool', name: 'Pool', estimatedNumberOfUsers: 2, autoVerifiedAttributes: ['email'] }));
	});

	it('lists users and groups with pagination', async () => {
		cognitoMock.on(ListUsersCommand).resolves({ Users: [{ Username: 'alice', Enabled: false, Attributes: [{ Name: 'email', Value: 'a@example.test' }, { Name: 'custom:role', Value: 'admin' }] }] });
		cognitoMock.on(ListGroupsCommand).resolves({ Groups: [{ GroupName: 'admins', Description: 'Admins' }] });

		await expect(listUsers('pool', 'email ^= "a"')).resolves.toEqual([
			expect.objectContaining({ username: 'alice', enabled: false, email: 'a@example.test', attributes: { email: 'a@example.test', 'custom:role': 'admin' } })
		]);
		await expect(listGroups('pool')).resolves.toEqual([{ name: 'admins', description: 'Admins', creationDate: undefined, lastModifiedDate: undefined }]);
	});

	it('sends mutation command inputs', async () => {
		cognitoMock.on(CreateUserPoolCommand).resolves({});
		cognitoMock.on(AdminCreateUserCommand).resolves({});
		cognitoMock.on(AdminUpdateUserAttributesCommand).resolves({});
		cognitoMock.on(CreateGroupCommand).resolves({});

		await createUserPool('Pool');
		await createUser('pool', 'alice', 'a@example.test', 'TempPass123!');
		await updateUserAttributes('pool', 'alice', { email: 'next@example.test' });
		await createGroup('pool', 'admins', 'Admins');

		expect(cognitoMock.commandCalls(CreateUserPoolCommand)[0].args[0].input).toEqual({ PoolName: 'Pool' });
		expect(cognitoMock.commandCalls(AdminCreateUserCommand)[0].args[0].input).toEqual(expect.objectContaining({ UserPoolId: 'pool', Username: 'alice', MessageAction: 'SUPPRESS' }));
		expect(cognitoMock.commandCalls(AdminUpdateUserAttributesCommand)[0].args[0].input).toEqual({ UserPoolId: 'pool', Username: 'alice', UserAttributes: [{ Name: 'email', Value: 'next@example.test' }] });
		expect(cognitoMock.commandCalls(CreateGroupCommand)[0].args[0].input).toEqual({ UserPoolId: 'pool', GroupName: 'admins', Description: 'Admins' });
	});

	it('sends destructive and password mutation command inputs', async () => {
		cognitoMock.on(DeleteUserPoolCommand).resolves({});
		cognitoMock.on(AdminDeleteUserCommand).resolves({});
		cognitoMock.on(AdminEnableUserCommand).resolves({});
		cognitoMock.on(AdminDisableUserCommand).resolves({});
		cognitoMock.on(AdminResetUserPasswordCommand).resolves({});
		cognitoMock.on(AdminSetUserPasswordCommand).resolves({});
		cognitoMock.on(DeleteGroupCommand).resolves({});

		await deleteUserPool('pool');
		await deleteUser('pool', 'alice');
		await enableUser('pool', 'alice');
		await disableUser('pool', 'alice');
		await resetUserPassword('pool', 'alice');
		await setUserPassword('pool', 'alice', 'Secret123!', false);
		await deleteGroup('pool', 'admins');

		expect(cognitoMock.commandCalls(DeleteUserPoolCommand)[0].args[0].input).toEqual({ UserPoolId: 'pool' });
		expect(cognitoMock.commandCalls(AdminDeleteUserCommand)[0].args[0].input).toEqual({ UserPoolId: 'pool', Username: 'alice' });
		expect(cognitoMock.commandCalls(AdminEnableUserCommand)[0].args[0].input).toEqual({ UserPoolId: 'pool', Username: 'alice' });
		expect(cognitoMock.commandCalls(AdminDisableUserCommand)[0].args[0].input).toEqual({ UserPoolId: 'pool', Username: 'alice' });
		expect(cognitoMock.commandCalls(AdminResetUserPasswordCommand)[0].args[0].input).toEqual({ UserPoolId: 'pool', Username: 'alice' });
		expect(cognitoMock.commandCalls(AdminSetUserPasswordCommand)[0].args[0].input).toEqual({ UserPoolId: 'pool', Username: 'alice', Password: 'Secret123!', Permanent: false });
		expect(cognitoMock.commandCalls(DeleteGroupCommand)[0].args[0].input).toEqual({ UserPoolId: 'pool', GroupName: 'admins' });
	});
});
