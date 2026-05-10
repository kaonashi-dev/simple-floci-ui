import {
  IAMClient,
  ListUsersCommand,
  ListRolesCommand,
  ListPoliciesCommand,
  ListGroupsForUserCommand,
  ListAttachedUserPoliciesCommand
} from '@aws-sdk/client-iam';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { makeClient, paginateAll } from './aws';
import type { StsIdentity, IamUserSummary, IamRoleSummary, IamPolicySummary, IamUserDetail } from '$lib/types/iam';

const iam = makeClient(IAMClient);
const sts = makeClient(STSClient);

export async function getCallerIdentity(): Promise<StsIdentity> {
  const res = await sts.send(new GetCallerIdentityCommand({}));
  return { accountId: res.Account!, userId: res.UserId!, arn: res.Arn! };
}

export async function listUsers(): Promise<IamUserSummary[]> {
  const users = await paginateAll((token) =>
    iam.send(new ListUsersCommand({ Marker: token })).then((res) => ({
      items: res.Users ?? [],
      nextToken: res.Marker
    }))
  );
  return users.map((u) => ({
    username: u.UserName!,
    arn: u.Arn!,
    userId: u.UserId!,
    createdDate: u.CreateDate?.toISOString(),
    passwordLastUsed: u.PasswordLastUsed?.toISOString()
  }));
}

export async function listRoles(): Promise<IamRoleSummary[]> {
  const roles = await paginateAll((token) =>
    iam.send(new ListRolesCommand({ Marker: token })).then((res) => ({
      items: res.Roles ?? [],
      nextToken: res.Marker
    }))
  );
  return roles.map((r) => ({
    roleName: r.RoleName!,
    arn: r.Arn!,
    roleId: r.RoleId!,
    createdDate: r.CreateDate?.toISOString(),
    description: r.Description
  }));
}

export async function listLocalPolicies(): Promise<IamPolicySummary[]> {
  const policies = await paginateAll((token) =>
    iam.send(new ListPoliciesCommand({ Scope: 'Local', Marker: token })).then((res) => ({
      items: res.Policies ?? [],
      nextToken: res.Marker
    }))
  );
  return policies.map((p) => ({
    policyName: p.PolicyName!,
    arn: p.Arn!,
    policyId: p.PolicyId!,
    attachmentCount: p.AttachmentCount,
    createdDate: p.CreateDate?.toISOString(),
    isAwsManaged: false
  }));
}

export async function getUserDetail(username: string): Promise<IamUserDetail> {
  const [groupsRes, policiesRes] = await Promise.all([
    iam.send(new ListGroupsForUserCommand({ UserName: username })),
    iam.send(new ListAttachedUserPoliciesCommand({ UserName: username }))
  ]);
  const users = await listUsers();
  const user = users.find((u) => u.username === username)!;
  return {
    ...user,
    groups: (groupsRes.Groups ?? []).map((g) => g.GroupName!),
    attachedPolicies: (policiesRes.AttachedPolicies ?? []).map((p) => ({
      policyName: p.PolicyName!,
      policyArn: p.PolicyArn!
    }))
  };
}
