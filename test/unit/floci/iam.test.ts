import { beforeEach, describe, expect, it } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { IAMClient, ListAttachedUserPoliciesCommand, ListGroupsForUserCommand, ListPoliciesCommand, ListRolesCommand, ListUsersCommand } from '@aws-sdk/client-iam';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import { getCallerIdentity, getUserDetail, listLocalPolicies, listRoles, listUsers } from '$lib/floci/iam';

const iamMock = mockClient(IAMClient);
const stsMock = mockClient(STSClient);

describe('iam service', () => {
	beforeEach(() => {
		iamMock.reset();
		stsMock.reset();
	});

	it('gets caller identity', async () => {
		stsMock.on(GetCallerIdentityCommand).resolves({ Account: '123', UserId: 'user', Arn: 'arn' });

		await expect(getCallerIdentity()).resolves.toEqual({ accountId: '123', userId: 'user', arn: 'arn' });
	});

	it('lists users, roles, and local policies', async () => {
		iamMock.on(ListUsersCommand).resolves({ Users: [{ Path: '/', UserName: 'alice', Arn: 'arn:u', UserId: 'u1', CreateDate: new Date('2026-01-01T00:00:00Z') }] });
		iamMock.on(ListRolesCommand).resolves({ Roles: [{ Path: '/', RoleName: 'role', Arn: 'arn:r', RoleId: 'r1', CreateDate: new Date('2026-01-01T00:00:00Z') }] });
		iamMock.on(ListPoliciesCommand).resolves({ Policies: [{ PolicyName: 'policy', Arn: 'arn:p', PolicyId: 'p1', AttachmentCount: 2 }] });

		await expect(listUsers()).resolves.toEqual([{ username: 'alice', arn: 'arn:u', userId: 'u1', createdDate: '2026-01-01T00:00:00.000Z', passwordLastUsed: undefined }]);
		await expect(listRoles()).resolves.toEqual([{ roleName: 'role', arn: 'arn:r', roleId: 'r1', createdDate: '2026-01-01T00:00:00.000Z', description: undefined }]);
		await expect(listLocalPolicies()).resolves.toEqual([{ policyName: 'policy', arn: 'arn:p', policyId: 'p1', attachmentCount: 2, createdDate: undefined, isAwsManaged: false }]);
		expect(iamMock.commandCalls(ListPoliciesCommand)[0].args[0].input).toEqual({ Scope: 'Local', Marker: undefined });
	});

	it('loads user details with groups and attached policies', async () => {
		iamMock.on(ListGroupsForUserCommand).resolves({ Groups: [{ Path: '/', GroupName: 'admins', GroupId: 'g1', Arn: 'arn:g', CreateDate: new Date('2026-01-01T00:00:00Z') }] });
		iamMock.on(ListAttachedUserPoliciesCommand).resolves({ AttachedPolicies: [{ PolicyName: 'ReadOnly', PolicyArn: 'arn:p' }] });
		iamMock.on(ListUsersCommand).resolves({ Users: [{ Path: '/', UserName: 'alice', Arn: 'arn:u', UserId: 'u1', CreateDate: new Date('2026-01-01T00:00:00Z') }] });

		await expect(getUserDetail('alice')).resolves.toEqual({
			username: 'alice',
			arn: 'arn:u',
			userId: 'u1',
			createdDate: '2026-01-01T00:00:00.000Z',
			passwordLastUsed: undefined,
			groups: ['admins'],
			attachedPolicies: [{ policyName: 'ReadOnly', policyArn: 'arn:p' }]
		});
	});
});
