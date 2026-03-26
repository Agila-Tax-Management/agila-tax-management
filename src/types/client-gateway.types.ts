// src/types/client-gateway.types.ts

export type BusinessEntity =
  | 'INDIVIDUAL'
  | 'SOLE_PROPRIETORSHIP'
  | 'PARTNERSHIP'
  | 'CORPORATION'
  | 'COOPERATIVE';

export type BranchType = 'MAIN' | 'BRANCH';
export type PlaceType = 'OWNED' | 'RENTED' | 'FREE_USE';

// ─── List item (returned by GET /api/client-gateway/clients) ─────────────────
export interface ClientListItem {
  id: number;
  companyCode: string | null;
  clientNo: string | null;
  businessName: string;
  portalName: string;
  businessEntity: BusinessEntity;
  branchType: BranchType;
  active: boolean;
  createdAt: string;
  ownerName: string | null;
  ownerEmail: string | null;
}

// ─── Sub-models ───────────────────────────────────────────────────────────────
export interface BirInfoData {
  tin: string;
  branchCode: string;
  rdoCode: string;
  registeredAddress: string;
  zipCode: string;
  contactNumber: string;
  isWithholdingAgent: boolean;
  withholdingCategory: string;
  corUrl: string;
}

export interface BusinessDetailsData {
  tradeName: string;
  industry: string;
  lineOfBusiness: string;
  psicCode: string;
  businessAreaSqm: string;
  noOfManagers: number;
  noOfSupervisors: number;
  noOfRankAndFile: number;
  noOfElevators: number;
  noOfEscalators: number;
  noOfAircons: number;
  hasCctv: boolean;
  signboardLength: string;
  hasSignboardLight: boolean;
  landlineNumber: string;
  faxNumber: string;
  placeType: PlaceType;
  // Rented
  lessorName: string;
  lessorAddress: string;
  monthlyRent: string;
  rentContractUrl: string;
  isNotarized: boolean;
  hasDocStamp: boolean;
  // Owned
  propertyOwner: string;
  ownedDocsUrl: string;
  ownedReason: string;
  // Free use
  noRentReason: string;
}

export interface CorporateDetailsData {
  secRegistrationNo: string;
  acronym: string;
  suffix: string;
  companyClassification: string;
  companySubclass: string;
  dateOfIncorporation: string;
  termOfExistence: string;
  primaryPurpose: string;
  annualMeetingDate: string;
  numberOfIncorporators: number | null;
  hasBoardOfDirectors: boolean;
  authorizedCapital: string;
  subscribedCapital: string;
  paidUpCapital: string;
  primaryEmail: string;
  secondaryEmail: string;
  primaryContactNo: string;
  secondaryContactNo: string;
  contactPerson: string;
  authRepFirstName: string;
  authRepMiddleName: string;
  authRepLastName: string;
  authRepPosition: string;
  authRepTin: string;
  authRepDob: string;
  // President
  presidentFirstName: string;
  presidentMiddleName: string;
  presidentLastName: string;
  presidentGender: string;
  presidentNationality: string;
  presidentAddress: string;
  presidentTin: string;
  presidentEmail: string;
  presidentDob: string;
  // Treasurer
  treasurerFirstName: string;
  treasurerMiddleName: string;
  treasurerLastName: string;
  treasurerGender: string;
  treasurerNationality: string;
  treasurerAddress: string;
  treasurerTin: string;
  treasurerEmail: string;
  treasurerDob: string;
  // Secretary
  secretaryFirstName: string;
  secretaryMiddleName: string;
  secretaryLastName: string;
  secretaryGender: string;
  secretaryNationality: string;
  secretaryAddress: string;
  secretaryTin: string;
  secretaryEmail: string;
  secretaryDob: string;
}

export interface ShareholderData {
  id?: number;
  firstName: string;
  middleName: string;
  lastName: string;
  dob: string;
  nationality: string;
  gender: string;
  tin: string;
  numberOfShares: string;
  paidUpCapital: string;
  methodOfPayment: string;
  orderSequence: number;
}

export interface IndividualDetailsData {
  firstName: string;
  middleName: string;
  lastName: string;
  dob: string;
  civilStatus: string;
  gender: string;
  citizenship: string;
  placeOfBirth: string;
  residentialAddress: string;
  prcLicenseNo: string;
  primaryIdType: string;
  primaryIdNumber: string;
  personalEmail: string;
  mobileNumber: string;
  telephoneNumber: string;
  motherFirstName: string;
  motherMiddleName: string;
  motherLastName: string;
  fatherFirstName: string;
  fatherMiddleName: string;
  fatherLastName: string;
  spouseFirstName: string;
  spouseMiddleName: string;
  spouseLastName: string;
  spouseEmploymentStatus: string;
  spouseTin: string;
  spouseEmployerName: string;
  spouseEmployerTin: string;
}

export interface PortalUserData {
  id: string;
  name: string;
  email: string;
  status: string;
  role: string;
}

// ─── Full detail (returned by GET /api/client-gateway/clients/[id]) ──────────
export interface ClientDetail {
  id: number;
  companyCode: string | null;
  clientNo: string | null;
  businessName: string;
  portalName: string;
  logoUrl: string | null;
  businessEntity: BusinessEntity;
  branchType: BranchType;
  active: boolean;
  dayResetTime: string;
  workingDayStarts: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  birInfo: BirInfoData | null;
  businessDetails: BusinessDetailsData | null;
  corporateDetails: CorporateDetailsData | null;
  shareholders: ShareholderData[];
  individualDetails: IndividualDetailsData | null;
  portalUsers: PortalUserData[];
}

// ─── PUT body for updating a client ──────────────────────────────────────────
export interface UpdateClientBody {
  core?: {
    businessName?: string;
    companyCode?: string;
    clientNo?: string;
    portalName?: string;
    active?: boolean;
    timezone?: string;
    branchType?: BranchType;
  };
  birInfo?: Partial<BirInfoData>;
  businessDetails?: Partial<BusinessDetailsData>;
  corporateDetails?: Partial<CorporateDetailsData>;
  individualDetails?: Partial<IndividualDetailsData>;
  shareholders?: ShareholderData[];
}
