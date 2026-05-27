import { apiRequest, type ApiResponse } from './client';

export interface ProfileOverview {
  businessType: string | null;
  employeeCount: number | null;
  annualRevenue: string | null;
  personalDataItems: string | null;
  hasPrivacyPolicy: boolean | null;
  sensitiveDataTypes: string | null;
  collectionMethods: string | null;
  collectionPurposes: string | null;
  delegationStatus: string | null;
  delegateeTypes: string | null;
  overseasTransferStatus: string | null;
  overseasTransferCountry: string | null;
  cctvOperationStatus: string | null;
  systemStatus: string | null;
  encryptionStatus: string | null;
}

export interface ProfileDestruction {
  policyStatus: string | null;
  methods: string | null;
}

export interface ProfileEmploymentRetention {
  documentRetention: string | null;
  formerEmployeeDestructionTiming: string | null;
}

export interface ProfilePartnerContactHandling {
  dbRegistration: string | null;
  retentionPolicy: string | null;
}

export interface ProfilePrivacyPolicyCompleteness {
  includedItems: string | null;
}

export interface ProfileDelegationGovernance {
  disclosureStatus: string | null;
  auditStatus: string | null;
  educationStatus: string | null;
}

export interface ProfileCloudHosting {
  serverLocation: string | null;
  overseasServerCountry: string | null;
}

export interface ProfileCctvControls {
  externalProvision: string | null;
  accessControl: string | null;
}

export interface ProfileSecurityControls {
  encryptedDataItems: string | null;
  accessControlSeparation: string | null;
  retiredAccessRevocation: string | null;
  accessChangeHistoryStatus: string | null;
}

export interface ProfileCpoInfo { status: string | null; title: string | null; }
export interface ProfileOperatingInfo { channels: string | null; privacyPolicyUrl: string | null; }
export interface ProfileDelegationContracts { contractPerType: string | null; }
export interface ProfileMarketingInfo { status: string | null; consentType: string | null; nightSend: string | null; }
export interface ProfileCctvAdditional { signageStatus: string | null; range: string | null; }
export interface ProfileAccessLogInfo { status: string | null; }
export interface ProfileJuminInfo { collectionGround: string | null; }
export interface ProfileProvisionInfo { status: string | null; consentStatus: string | null; }
export interface ProfileInternalPlanInfo { status: string | null; cycle: string | null; }

export interface Profile {
  id: string;
  overview: ProfileOverview;
  destruction: ProfileDestruction;
  employmentRetention: ProfileEmploymentRetention;
  partnerContactHandling: ProfilePartnerContactHandling;
  privacyPolicyCompleteness: ProfilePrivacyPolicyCompleteness;
  delegationGovernance: ProfileDelegationGovernance;
  cloudHosting: ProfileCloudHosting;
  cctvControls: ProfileCctvControls;
  securityControls: ProfileSecurityControls;
  cpoInfo: ProfileCpoInfo;
  operatingInfo: ProfileOperatingInfo;
  delegationContracts: ProfileDelegationContracts;
  marketingInfo: ProfileMarketingInfo;
  cctvAdditional: ProfileCctvAdditional;
  accessLogInfo: ProfileAccessLogInfo;
  juminInfo: ProfileJuminInfo;
  provisionInfo: ProfileProvisionInfo;
  internalPlanInfo: ProfileInternalPlanInfo;
  updatedAt: string;
}

export interface ProfileUpsertRequest {
  overview: ProfileOverview;
  destruction: ProfileDestruction;
  employmentRetention: ProfileEmploymentRetention;
  partnerContactHandling: ProfilePartnerContactHandling;
  privacyPolicyCompleteness: ProfilePrivacyPolicyCompleteness;
  delegationGovernance: ProfileDelegationGovernance;
  cloudHosting: ProfileCloudHosting;
  cctvControls: ProfileCctvControls;
  securityControls: ProfileSecurityControls;
  cpoInfo: ProfileCpoInfo;
  operatingInfo: ProfileOperatingInfo;
  delegationContracts: ProfileDelegationContracts;
  marketingInfo: ProfileMarketingInfo;
  cctvAdditional: ProfileCctvAdditional;
  accessLogInfo: ProfileAccessLogInfo;
  juminInfo: ProfileJuminInfo;
  provisionInfo: ProfileProvisionInfo;
  internalPlanInfo: ProfileInternalPlanInfo;
}

type LegacyProfile = {
  id?: string;
  businessType?: string | null;
  employeeCount?: number | null;
  annualRevenue?: string | null;
  personalDataItems?: string | null;
  hasPrivacyPolicy?: boolean | null;
  sensitiveDataTypes?: string | null;
  collectionMethods?: string | null;
  updatedAt?: string;
};

const EMPTY_OVERVIEW: ProfileOverview = {
  businessType: null,
  employeeCount: null,
  annualRevenue: null,
  personalDataItems: null,
  hasPrivacyPolicy: null,
  sensitiveDataTypes: null,
  collectionMethods: null,
  collectionPurposes: null,
  delegationStatus: null,
  delegateeTypes: null,
  overseasTransferStatus: null,
  overseasTransferCountry: null,
  cctvOperationStatus: null,
  systemStatus: null,
  encryptionStatus: null,
};

const EMPTY_PROFILE: Profile = {
  id: '',
  overview: EMPTY_OVERVIEW,
  destruction: { policyStatus: null, methods: null },
  employmentRetention: { documentRetention: null, formerEmployeeDestructionTiming: null },
  partnerContactHandling: { dbRegistration: null, retentionPolicy: null },
  privacyPolicyCompleteness: { includedItems: null },
  delegationGovernance: { disclosureStatus: null, auditStatus: null, educationStatus: null },
  cloudHosting: { serverLocation: null, overseasServerCountry: null },
  cctvControls: { externalProvision: null, accessControl: null },
  securityControls: {
    encryptedDataItems: null,
    accessControlSeparation: null,
    retiredAccessRevocation: null,
    accessChangeHistoryStatus: null,
  },
  cpoInfo: { status: null, title: null },
  operatingInfo: { channels: null, privacyPolicyUrl: null },
  delegationContracts: { contractPerType: null },
  marketingInfo: { status: null, consentType: null, nightSend: null },
  cctvAdditional: { signageStatus: null, range: null },
  accessLogInfo: { status: null },
  juminInfo: { collectionGround: null },
  provisionInfo: { status: null, consentStatus: null },
  internalPlanInfo: { status: null, cycle: null },
  updatedAt: '',
};

function normalizeProfile(input: unknown): Profile | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const data = input as Partial<Profile> & LegacyProfile;
  const overview = data.overview ?? {
    businessType: data.businessType ?? null,
    employeeCount: data.employeeCount ?? null,
    annualRevenue: data.annualRevenue ?? null,
    personalDataItems: data.personalDataItems ?? null,
    hasPrivacyPolicy: data.hasPrivacyPolicy ?? null,
    sensitiveDataTypes: data.sensitiveDataTypes ?? null,
    collectionMethods: data.collectionMethods ?? null,
    collectionPurposes: null,
    delegationStatus: null,
    delegateeTypes: null,
    overseasTransferStatus: null,
    overseasTransferCountry: null,
    cctvOperationStatus: null,
    systemStatus: null,
    encryptionStatus: null,
  };

  return {
    ...EMPTY_PROFILE,
    ...data,
    overview: { ...EMPTY_OVERVIEW, ...overview },
    destruction: { ...EMPTY_PROFILE.destruction, ...data.destruction },
    employmentRetention: { ...EMPTY_PROFILE.employmentRetention, ...data.employmentRetention },
    partnerContactHandling: { ...EMPTY_PROFILE.partnerContactHandling, ...data.partnerContactHandling },
    privacyPolicyCompleteness: { ...EMPTY_PROFILE.privacyPolicyCompleteness, ...data.privacyPolicyCompleteness },
    delegationGovernance: { ...EMPTY_PROFILE.delegationGovernance, ...data.delegationGovernance },
    cloudHosting: { ...EMPTY_PROFILE.cloudHosting, ...data.cloudHosting },
    cctvControls: { ...EMPTY_PROFILE.cctvControls, ...data.cctvControls },
    securityControls: { ...EMPTY_PROFILE.securityControls, ...data.securityControls },
    cpoInfo: { ...EMPTY_PROFILE.cpoInfo, ...data.cpoInfo },
    operatingInfo: { ...EMPTY_PROFILE.operatingInfo, ...data.operatingInfo },
    delegationContracts: { ...EMPTY_PROFILE.delegationContracts, ...data.delegationContracts },
    marketingInfo: { ...EMPTY_PROFILE.marketingInfo, ...data.marketingInfo },
    cctvAdditional: { ...EMPTY_PROFILE.cctvAdditional, ...data.cctvAdditional },
    accessLogInfo: { ...EMPTY_PROFILE.accessLogInfo, ...data.accessLogInfo },
    juminInfo: { ...EMPTY_PROFILE.juminInfo, ...data.juminInfo },
    provisionInfo: { ...EMPTY_PROFILE.provisionInfo, ...data.provisionInfo },
    internalPlanInfo: { ...EMPTY_PROFILE.internalPlanInfo, ...data.internalPlanInfo },
    id: data.id ?? '',
    updatedAt: data.updatedAt ?? '',
  };
}

export async function getProfile(token: string): Promise<ApiResponse<Profile>> {
  const res = await apiRequest<Profile>('/api/profile', { token });
  return res.success
    ? { ...res, data: normalizeProfile(res.data) }
    : res;
}

export async function upsertProfile(
  token: string,
  body: ProfileUpsertRequest,
): Promise<ApiResponse<Profile>> {
  const res = await apiRequest<Profile>('/api/profile', {
    method: 'PUT',
    token,
    body: JSON.stringify(body),
  });
  return res.success
    ? { ...res, data: normalizeProfile(res.data) }
    : res;
}

export async function patchProfileField(
  token: string,
  field: string,
  value: string,
): Promise<void> {
  await apiRequest<void>('/api/profile/field', {
    method: 'PATCH',
    token,
    body: JSON.stringify({ field, value }),
  });
}
