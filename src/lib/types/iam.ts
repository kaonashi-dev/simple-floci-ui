export type StsIdentity = {
  accountId: string;
  userId: string;
  arn: string;
};

export type IamUserSummary = {
  username: string;
  arn: string;
  userId: string;
  createdDate?: string;
  passwordLastUsed?: string;
};

export type IamRoleSummary = {
  roleName: string;
  arn: string;
  roleId: string;
  createdDate?: string;
  description?: string;
};

export type IamPolicySummary = {
  policyName: string;
  arn: string;
  policyId: string;
  attachmentCount?: number;
  createdDate?: string;
  isAwsManaged: boolean;
};

export type IamUserDetail = IamUserSummary & {
  groups: string[];
  attachedPolicies: { policyName: string; policyArn: string }[];
};
