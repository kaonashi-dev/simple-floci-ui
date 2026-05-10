import {
  IAMClient,
  ListUsersCommand,
  ListRolesCommand,
  ListPoliciesCommand,
  ListGroupsForUserCommand,
  ListAttachedUserPoliciesCommand
} from '@aws-sdk/client-iam';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { awsConfig } from './aws';
import type { StsIdentity, IamUserSummary, IamRoleSummary, IamPolicySummary, IamUserDetail } from '$lib/types/iam';

function iamClient() { return new IAMClient(awsConfig); }
function stsClient() { return new STSClient(awsConfig); }

export async function getCallerIdentity(): Promise<StsIdentity> {
  const sts = stsClient();
  const res = await sts.send(new GetCallerIdentityCommand({}));
  return { accountId: res.Account!, userId: res.UserId!, arn: res.Arn! };
}

export async function listUsers(): Promise<IamUserSummary[]> {
  const iam = iamClient();
  const users = [];
  let marker: string | undefined;
  do {
    const res = await iam.send(new ListUsersCommand({ Marker: marker }));
    if (res.Users) users.push(...res.Users);
    marker = res.Marker;
  } while (marker);
  return users.map(u => ({
    username: u.UserName!,
    arn: u.Arn!,
    userId: u.UserId!,
    createdDate: u.CreateDate?.toISOString(),
    passwordLastUsed: u.PasswordLastUsed?.toISOString()
  }));
}

export async function listRoles(): Promise<IamRoleSummary[]> {
  const iam = iamClient();
  const roles = [];
  let marker: string | undefined;
  do {
    const res = await iam.send(new ListRolesCommand({ Marker: marker }));
    if (res.Roles) roles.push(...res.Roles);
    marker = res.Marker;
  } while (marker);
  return roles.map(r => ({
    roleName: r.RoleName!,
    arn: r.Arn!,
    roleId: r.RoleId!,
    createdDate: r.CreateDate?.toISOString(),
    description: r.Description
  }));
}

export async function listLocalPolicies(): Promise<IamPolicySummary[]> {
  const iam = iamClient();
  const policies = [];
  let marker: string | undefined;
  do {
    const res = await iam.send(new ListPoliciesCommand({ Scope: 'Local', Marker: marker }));
    if (res.Policies) policies.push(...res.Policies);
    marker = res.Marker;
  } while (marker);
  return policies.map(p => ({
    policyName: p.PolicyName!,
    arn: p.Arn!,
    policyId: p.PolicyId!,
    attachmentCount: p.AttachmentCount,
    createdDate: p.CreateDate?.toISOString(),
    isAwsManaged: false
  }));
}

export async function getUserDetail(username: string): Promise<IamUserDetail> {
  const iam = iamClient();
  const [groupsRes, policiesRes] = await Promise.all([
    iam.send(new ListGroupsForUserCommand({ UserName: username })),
    iam.send(new ListAttachedUserPoliciesCommand({ UserName: username }))
  ]);
  const users = await listUsers();
  const user = users.find(u => u.username === username)!;
  return {
    ...user,
    groups: (groupsRes.Groups ?? []).map(g => g.GroupName!),
    attachedPolicies: (policiesRes.AttachedPolicies ?? []).map(p => ({
      policyName: p.PolicyName!,
      policyArn: p.PolicyArn!
    }))
  };
}
