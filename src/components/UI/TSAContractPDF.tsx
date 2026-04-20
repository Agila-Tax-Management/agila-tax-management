// src/components/UI/TSAContractPDF.tsx
'use client';

import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ContractData {
  clientNo: string;
  businessName: string;
  authorizedRep: string;
  email: string;
  phone: string;
  tin: string;
  businessAddress: string;
  residenceAddress: string;
  civilStatus: string;
  isBusinessRegistered: boolean;
  tosDate: string;
  planName: string;
  planPrice: string;
  actualMonthlySubscription: string;
  // Dynamic service lists for Section I
  planServices?: string[];       // Recurring/package-included services
  additionalServices?: string[]; // One-time or add-on services
  headerSrc?: string;
  // DTI
  isDTI: boolean;
  isDTIReg: boolean;
  isDTIClosure: boolean;
  isBMBE: boolean;
  // SEC
  isSEC: boolean;
  isSECReg: boolean;
  isEfast: boolean;
  isStockTransfer: boolean;
  isSECAmendments: boolean;
  isAppointment: boolean;
  isGIS: boolean;
  isAFS: boolean;
  // LGU
  isLGU: boolean;
  isMayorReg: boolean;
  isMayorRenewal: boolean;
  isMayorClosure: boolean;
  isTempPermit: boolean;
  isSanitary: boolean;
  isFire: boolean;
  isCCENRO: boolean;
  isProfessionalTax: boolean;
  // BIR
  isBIR: boolean;
  isBIRReg: boolean;
  isBIRBranch: boolean;
  isBIRClosure: boolean;
  isORUS: boolean;
  isBooksReg: boolean;
  isInvoicePrint: boolean;
  isAddTaxType: boolean;
  isRentalDocStamp: boolean;
  isStocksDocStamp: boolean;
  isAuditorsReport: boolean;
  isOpenCase: boolean;
  // BIR Compliance
  isBIRCompliance: boolean;
  isEWT: boolean;
  isFWT: boolean;
  isCWT: boolean;
  isPercentageTax: boolean;
  isVATReturn: boolean;
  isITR: boolean;
  // Employer Registration
  isEmployerReg: boolean;
  isSSS: boolean;
  isPhilHealth: boolean;
  isPagibig: boolean;
  isBIREmployer: boolean;
  isDOLE: boolean;
  // Remittances
  isRemittances: boolean;
}

interface PlanInfo {
  id: string;
  price?: string;
  featuresIncluded: string[];
  featuresMore?: string[];
}

interface ServiceItemInfo {
  id: string;
  name: string;
  government: string;
}

// ── Plan display names & base prices ────────────────────────────────────────

const PLAN_DISPLAY_NAMES: Record<string, string> = {
  'starter': 'Starter Plan',
  'essentials-non-vat': 'Essentials Plan (Non-VAT)',
  'essentials-vat': 'Essentials Plan (VAT)',
  'agila360-non-vat': 'Agila360 Plan (Non-VAT)',
  'agila360-vat': 'Agila360 Plan (VAT)',
  'vip': 'VIP Plan',
};

const PLAN_BASE_PRICES: Record<string, string> = {
  'starter': '1,500.00',
  'essentials-non-vat': '2,500.00',
  'essentials-vat': '4,500.00',
  'agila360-non-vat': '5,000.00',
  'agila360-vat': '6,500.00',
  'vip': '15,000.00',
};

// ── Builder helper ───────────────────────────────────────────────────────────

export function buildContractData(
  clientData: {
    clientNo: string;
    businessName: string;
    authorizedRep: string;
    email: string;
    phone: string;
    tin: string;
    businessAddress: string;
    residenceAddress?: string;
    civilStatus?: string;
    isBusinessRegistered?: boolean;
    planDetails?: {
      basePlan: string;
      customPrice: string;
      selectedServiceIds?: string[];
    };
  },
  allServices: ServiceItemInfo[],
  planData: PlanInfo | null,
  headerSrc?: string,
): ContractData {
  const planDetails = clientData.planDetails;

  const isServiceInPlan = (keywords: string[]): boolean => {
    if (!planDetails || !planData) return false;
    const inFeatures = planData.featuresIncluded.some((f) =>
      keywords.some((k) => f.toLowerCase().includes(k.toLowerCase()))
    );
    const inMore = (planData.featuresMore ?? []).some((f) =>
      keywords.some((k) => f.toLowerCase().includes(k.toLowerCase()))
    );
    const inServices = (planDetails.selectedServiceIds ?? []).some((sid) => {
      const svc = allServices.find((s) => s.id === sid);
      if (!svc) return false;
      return keywords.some(
        (k) =>
          svc.name.toLowerCase().includes(k.toLowerCase()) ||
          svc.government.toLowerCase().includes(k.toLowerCase())
      );
    });
    return inFeatures || inMore || inServices;
  };

  const now = new Date();
  const tosDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const planName = planData ? (PLAN_DISPLAY_NAMES[planData.id] ?? planData.id) : '';
  const planPrice = planData ? (PLAN_BASE_PRICES[planData.id] ?? planData.price ?? '') : '';
  const actualMonthlySubscription = planDetails
    ? parseFloat(planDetails.customPrice.replace(/,/g, '')).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
      })
    : '';

  return {
    clientNo: clientData.clientNo,
    businessName: clientData.businessName,
    authorizedRep: clientData.authorizedRep,
    email: clientData.email,
    phone: clientData.phone,
    tin: clientData.tin,
    businessAddress: clientData.businessAddress,
    residenceAddress: clientData.residenceAddress ?? '',
    civilStatus: clientData.civilStatus ?? 'single',
    isBusinessRegistered: clientData.isBusinessRegistered ?? true,
    tosDate,
    planName,
    planPrice,
    actualMonthlySubscription,
    headerSrc,
    // DTI
    isDTI: isServiceInPlan(['DTI', 'Department of Trade', 'Business Name']),
    isDTIReg: isServiceInPlan(['DTI Registration', 'DTI Certificate']),
    isDTIClosure: isServiceInPlan(['DTI', 'Closure', 'Business Name Closure']),
    isBMBE: isServiceInPlan(['BMBE']),
    // SEC
    isSEC: isServiceInPlan(['SEC', 'Securities', 'Corporation']),
    isSECReg: isServiceInPlan(['SEC Registration', 'Corporate Registration', 'Incorporation']),
    isEfast: isServiceInPlan(['eFast', 'Efast']),
    isStockTransfer: isServiceInPlan(['Stock Transfer']),
    isSECAmendments: isServiceInPlan(['SEC Amendment', 'Amendment']),
    isAppointment: isServiceInPlan(['Appointment of Officers', 'One-Person Corporation']),
    isGIS: isServiceInPlan(['GIS', 'General Information Sheet']),
    isAFS: isServiceInPlan(['AFS', 'Audited Financial', 'Financial Statement']),
    // LGU
    isLGU: isServiceInPlan(['Mayor', 'Permit', 'LGU', 'Business Permit']),
    isMayorReg: isServiceInPlan(["Mayor's Permit Registration", 'Mayor Permit Processing']),
    isMayorRenewal: isServiceInPlan(["Mayor's Permit Renewal", 'Permit Renewal']),
    isMayorClosure: isServiceInPlan(['Mayor', 'Closure', 'Retirement']),
    isTempPermit: isServiceInPlan(['Temporary Permit']),
    isSanitary: isServiceInPlan(['Sanitary Permit']),
    isFire: isServiceInPlan(['Fire', 'Fire Safety', 'FSIC']),
    isCCENRO: isServiceInPlan(['CCENRO', 'Environmental Certificate']),
    isProfessionalTax: isServiceInPlan(['Professional Tax', 'Occupational Tax', 'Cedula']),
    // BIR
    isBIR: isServiceInPlan(['BIR', 'Bureau of Internal Revenue']),
    isBIRReg: isServiceInPlan(['BIR Registration', 'BIR Business Registration', 'Certificate of Registration', '2303']),
    isBIRBranch: isServiceInPlan(['Add Branch', 'Branch Registration']),
    isBIRClosure: isServiceInPlan(['BIR', 'Closure']),
    isORUS: isServiceInPlan(['ORUS']),
    isBooksReg: isServiceInPlan(['Books Registration', 'Register Books']),
    isInvoicePrint: isServiceInPlan(['Invoice Printing', 'Official Receipt', 'Sales Invoice']),
    isAddTaxType: isServiceInPlan(['Add Tax Type', 'Tax Type']),
    isRentalDocStamp: isServiceInPlan(['Rental', 'Doc Stamp', 'Documentary Stamp']),
    isStocksDocStamp: isServiceInPlan(['Stocks', 'Doc Stamp']),
    isAuditorsReport: isServiceInPlan(["Auditor's Report", 'Auditors Report']),
    isOpenCase: isServiceInPlan(['Open Case', 'Case Report']),
    // BIR Compliance
    isBIRCompliance: isServiceInPlan(['Tax Return', 'ITR', 'VAT', 'Withholding', 'BIR Compliance', 'Filing']),
    isEWT: isServiceInPlan(['Expanded Withholding', 'EWT']),
    isFWT: isServiceInPlan(['Final Withholding', 'FWT']),
    isCWT: isServiceInPlan(['Compensation Withholding', 'CWT']),
    isPercentageTax: isServiceInPlan(['Percentage Tax']),
    isVATReturn: isServiceInPlan(['VAT Return', 'Value-Added Tax']),
    isITR: isServiceInPlan(['Income Tax Return', 'ITR']),
    // Employer
    isEmployerReg: isServiceInPlan(['Employer Registration', 'SSS', 'PhilHealth', 'PAGIBIG', 'Pag-IBIG', 'DOLE']),
    isSSS: isServiceInPlan(['SSS', 'Social Security']),
    isPhilHealth: isServiceInPlan(['PhilHealth', 'PHIC']),
    isPagibig: isServiceInPlan(['PAGIBIG', 'Pag-IBIG', 'HDMF']),
    isBIREmployer: isServiceInPlan(['BIR', 'Employer']),
    isDOLE: isServiceInPlan(['DOLE', 'Department of Labor']),
    // Remittances
    isRemittances: isServiceInPlan(['Remittance', 'Contribution', 'Government Remittance']),
  };
}

// ── Styles ───────────────────────────────────────────────────────────────────

const C = {
  blue: '#25238e',
  dark: '#1e293b',
  muted: '#64748b',
  light: '#f8fafc',
  border: '#e2e8f0',
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: C.dark,
    paddingTop: 40,
    paddingBottom: 54,
    paddingHorizontal: 0,
    lineHeight: 1.5,
  },
  pageContent: {
    paddingTop: 0,
    paddingHorizontal: 54,
    flex: 1,
  },
  headerImage: {
    width: '100%',
    objectFit: 'contain',
    marginTop: -40,
    marginBottom: 12,
  },
  titleBar: {
    borderBottomWidth: 2,
    borderBottomColor: C.blue,
    paddingBottom: 10,
    marginBottom: 14,
  },
  titleText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    color: C.blue,
    textAlign: 'center',
  },
  partiesBox: {
    backgroundColor: C.light,
    borderLeftWidth: 4,
    borderLeftColor: C.blue,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    marginTop: 8,
  },
  body: {
    fontSize: 10,
    marginBottom: 6,
    lineHeight: 1.5,
    textAlign: 'justify',
  },
  bodyCenter: {
    fontSize: 10,
    marginBottom: 6,
    textAlign: 'center',
    marginVertical: 8,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  sectionTitleBar: {
    borderBottomWidth: 1.5,
    borderBottomColor: C.blue,
    paddingBottom: 4,
    marginBottom: 8,
    marginTop: 16,
  },
  sectionTitleText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: C.blue,
  },
  indent: {
    marginLeft: 20,
    marginBottom: 4,
    fontSize: 10,
    lineHeight: 1.5,
  },
  bullet: {
    marginLeft: 20,
    marginBottom: 4,
    fontSize: 10,
    lineHeight: 1.5,
  },
  serviceGroupTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    marginTop: 10,
    marginBottom: 4,
  },
  serviceItem: {
    marginLeft: 20,
    marginBottom: 3,
    fontSize: 10,
    lineHeight: 1.4,
  },
  subService: {
    marginLeft: 38,
    marginBottom: 3,
    fontSize: 10,
    lineHeight: 1.4,
  },
  sigSection: {
    marginTop: 36,
  },
  sigRow: {
    flexDirection: 'row',
    marginTop: 28,
    justifyContent: 'space-between',
  },
  sigBox: {
    width: '45%',
    alignItems: 'center',
  },
  sigLabel: {
    fontSize: 9,
    color: C.muted,
    textAlign: 'center',
    marginBottom: 3,
  },
  sigLine: {
    borderTopWidth: 1.5,
    borderTopColor: C.dark,
    paddingTop: 6,
    marginTop: 40,
    width: '100%',
  },
  sigName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    textAlign: 'center',
  },
  sigDate: {
    fontSize: 9,
    marginTop: 6,
    textAlign: 'center',
    color: C.muted,
  },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 54,
    right: 54,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 5,
  },
});

// ── Sub-components ────────────────────────────────────────────────────────────

// Agency grouping for dynamic Section II
const _AGENCY_GROUPS: { title: string; keywords: string[] }[] = [
  { title: 'Department of Trade and Industry (DTI)', keywords: ['dti', 'business name registration', 'business name closure', 'bmbe'] },
  { title: 'Securities and Exchange Commission (SEC)', keywords: ['sec', 'general information sheet', 'gis', 'audited financial', 'afs', 'efast', 'stock transfer', 'articles of incorporation', 'certificate of incorporation', 'by-laws', 'one-person corporation', 'opc', 'corporate registration', 'incorporation'] },
  { title: "Local Government Unit (LGU) / Mayor's Permit", keywords: ["mayor's", 'mayor permit', 'business permit', 'sanitary permit', 'fire safety', 'fsic', 'ccenro', 'occupational tax', 'professional tax', 'cedula', 'barangay clearance', 'zoning', 'bfp'] },
  { title: 'Bureau of Internal Revenue (BIR)', keywords: ['bir', 'books of account', 'authority to print', 'atp', 'loose leaf', 'cas', 'pos permit', 'doc stamp', 'documentary stamp', 'orus', 'tin application', 'tax clearance', 'slsp', 'alpha list', 'withholding', 'vat filing', 'vat return', 'itr filing', 'income tax return', 'income tax', 'percentage tax', 'annual registration', 'cor update', 'certificate of registration', 'business registration', 'add branch', 'closure processing', 'open case', 'tax type'] },
  { title: 'Social Security System (SSS)', keywords: ['sss', 'social security'] },
  { title: 'Philippine Health Insurance Corporation (PhilHealth)', keywords: ['philhealth', 'phic'] },
  { title: 'Home Development Mutual Fund (PAGIBIG)', keywords: ['pagibig', 'pag-ibig', 'hdmf'] },
  { title: 'Department of Labor and Employment (DOLE)', keywords: ['dole', 'department of labor'] },
  { title: 'Accounting and Bookkeeping', keywords: ['bookkeeping', 'financial statement', 'trial balance', 'bank reconciliation', 'payroll', 'accounts receivable', 'accounts payable', 'chart of accounts'] },
  { title: 'Special Registrations and Consulting', keywords: ['peza', 'boi', 'import', 'export', 'audit assistance', 'compliance calendar', 'consultation', 'change of business'] },
];

function SectionTitle({ number, title }: { number: string; title: string }) {
  return (
    <View style={styles.sectionTitleBar}>
      <Text style={styles.sectionTitleText}>
        {number}. {title}
      </Text>
    </View>
  );
}

function ServiceSections({ d }: { d: ContractData }) {
  const hasDTI = d.isDTI || d.isDTIReg || d.isDTIClosure || d.isBMBE;
  const hasSEC = d.isSEC || d.isSECReg || d.isEfast || d.isStockTransfer || d.isSECAmendments || d.isAppointment || d.isGIS || d.isAFS;
  const hasLGU = d.isLGU || d.isMayorReg || d.isMayorRenewal || d.isMayorClosure || d.isTempPermit || d.isSanitary || d.isFire || d.isCCENRO || d.isProfessionalTax;
  const hasBIR = d.isBIR || d.isBIRReg || d.isBIRBranch || d.isBIRClosure || d.isORUS || d.isBooksReg || d.isInvoicePrint || d.isAddTaxType || d.isRentalDocStamp || d.isStocksDocStamp || d.isAuditorsReport || d.isOpenCase;
  const hasBIRC = d.isBIRCompliance || d.isEWT || d.isFWT || d.isCWT || d.isPercentageTax || d.isVATReturn || d.isITR;
  const hasEmp = d.isEmployerReg || d.isSSS || d.isPhilHealth || d.isPagibig || d.isBIREmployer || d.isDOLE;
  const hasEmpClosure = hasEmp && (d.isSSS || d.isPhilHealth || d.isPagibig || d.isBIREmployer || d.isDOLE);

  return (
    <View>
      {/* DTI */}
      {hasDTI && (
        <View>
          <Text style={styles.serviceGroupTitle}>Department of Trade and Industry (DTI)</Text>
          {(d.isDTI || d.isDTIReg) && (
            <View>
              <Text style={styles.serviceItem}>☑ Business Name Registration</Text>
              <Text style={styles.subService}>☑ Securing DTI Certificate of Business Name Registration</Text>
            </View>
          )}
          {d.isDTIClosure && <Text style={styles.serviceItem}>☑ Business Name Closure</Text>}
          {d.isBMBE && <Text style={styles.serviceItem}>☑ BMBE Registration</Text>}
        </View>
      )}

      {/* SEC */}
      {hasSEC && (
        <View>
          <Text style={styles.serviceGroupTitle}>Securities and Exchange Commission (SEC)</Text>
          {(d.isSEC || d.isSECReg) && (
            <View>
              <Text style={styles.serviceItem}>☑ Corporate Registration, securing the following documents:</Text>
              <Text style={styles.subService}>☑ Certificate of Incorporation</Text>
              <Text style={styles.subService}>☑ Articles of Incorporation</Text>
              <Text style={styles.subService}>☑ By-Laws</Text>
            </View>
          )}
          {d.isEfast && <Text style={styles.serviceItem}>☑ eFast Registration</Text>}
          {d.isStockTransfer && <Text style={styles.serviceItem}>☑ Stock Transfer Book</Text>}
          {d.isSECAmendments && <Text style={styles.serviceItem}>☑ SEC Amendments</Text>}
          {d.isAppointment && <Text style={styles.serviceItem}>☑ Appointment of Officers for One-Person Corporation</Text>}
          {d.isGIS && <Text style={styles.subService}>☑ General Information Sheet (GIS) Compliance</Text>}
          {d.isAFS && <Text style={styles.subService}>☑ Audited Financial Statement (AFS) Submission Compliance</Text>}
        </View>
      )}

      {/* LGU */}
      {hasLGU && (
        <View>
          <Text style={styles.serviceGroupTitle}>Local Government Unit (LGU)</Text>
          {(d.isLGU || d.isMayorReg) && (
            <View>
              <Text style={styles.serviceItem}>☑ Mayor&apos;s Permit Registration:</Text>
              {(d.isTempPermit || d.isLGU) && <Text style={styles.subService}>☑ Temporary Permit</Text>}
              {(d.isSanitary || d.isLGU) && <Text style={styles.subService}>☑ Sanitary Permit</Text>}
              {(d.isFire || d.isLGU) && <Text style={styles.subService}>☑ Fire Safety Inspection Certificate</Text>}
              {(d.isCCENRO || d.isLGU) && <Text style={styles.subService}>☑ Environmental Certificate (CCENRO)</Text>}
              {d.isLGU && (
                <View>
                  <Text style={styles.subService}>☑ Final Mayor&apos;s Permit</Text>
                  <Text style={styles.subService}>☑ This should only involve Business Permits Processing only. Processing of Property Documents are not included.</Text>
                </View>
              )}
            </View>
          )}
          {d.isMayorRenewal && <Text style={styles.serviceItem}>☑ Mayor&apos;s Permit Renewal</Text>}
          {d.isMayorClosure && <Text style={styles.serviceItem}>☑ Mayor&apos;s Permit Retirement (Closure)</Text>}
          {d.isProfessionalTax && <Text style={styles.serviceItem}>☑ Professional / Occupational Tax Receipt and Cedula for Professionals</Text>}
        </View>
      )}

      {/* BIR */}
      {hasBIR && (
        <View>
          <Text style={styles.serviceGroupTitle}>Bureau of Internal Revenue (BIR)</Text>
          {(d.isBIR || d.isBIRReg) && (
            <View>
              <Text style={styles.serviceItem}>☑ Business Registration</Text>
              <Text style={styles.subService}>☑ Securing Certificate of Registration (BIR Form 2303)</Text>
            </View>
          )}
          {d.isBIRBranch && <Text style={styles.serviceItem}>☑ Add Branch</Text>}
          {d.isBIRClosure && <Text style={styles.serviceItem}>☑ Closure of Main / Branch</Text>}
          {d.isORUS && <Text style={styles.serviceItem}>☑ ORUS Registration</Text>}
          {d.isBooksReg && <Text style={styles.serviceItem}>☑ Books Registration</Text>}
          {d.isInvoicePrint && <Text style={styles.serviceItem}>☑ Invoice Printing / Reprinting</Text>}
          {d.isAddTaxType && <Text style={styles.serviceItem}>☑ Add Tax Type</Text>}
          {d.isRentalDocStamp && <Text style={styles.serviceItem}>☑ Rental Doc Stamp</Text>}
          {d.isStocksDocStamp && <Text style={styles.serviceItem}>☑ Stocks Doc Stamp</Text>}
          {d.isAuditorsReport && <Text style={styles.serviceItem}>☑ Auditor&apos;s Report for AFS</Text>}
          {d.isOpenCase && <Text style={styles.serviceItem}>☑ Open Case Report Checking</Text>}
        </View>
      )}

      {/* BIR Compliance */}
      {hasBIRC && (
        <View>
          <Text style={styles.serviceGroupTitle}>Bureau of Internal Revenue (BIR) Compliance</Text>
          <Text style={styles.serviceItem}>☑ This covers the following compliances (whichever is applicable):</Text>
          {(d.isEWT || d.isBIRCompliance) && <Text style={styles.subService}>☑ Expanded Withholding Tax Return (Monthly, Quarterly, and Annually)</Text>}
          {(d.isFWT || d.isBIRCompliance) && <Text style={styles.subService}>☑ Final Withholding Tax Return (Monthly, Quarterly and Annually)</Text>}
          {(d.isCWT || d.isBIRCompliance) && <Text style={styles.subService}>☑ Compensation Withholding Tax Return (Monthly and Annually)</Text>}
          {(d.isPercentageTax || d.isBIRCompliance) && <Text style={styles.subService}>☑ Percentage Tax Return (Quarterly)</Text>}
          {(d.isVATReturn || d.isBIRCompliance) && <Text style={styles.subService}>☑ Value-Added Tax Return (Quarterly)</Text>}
          {(d.isITR || d.isBIRCompliance) && <Text style={styles.subService}>☑ Income Tax Return (Quarterly and Annually)</Text>}
          {d.isBIRCompliance && (
            <View>
              <Text style={styles.serviceItem}>☑ Securing the following documents:</Text>
              <Text style={styles.subService}>☑ BIR Forms</Text>
              <Text style={styles.subService}>☑ Email Confirmation</Text>
              <Text style={styles.subService}>☑ Payment Receipt</Text>
              <Text style={styles.subService}>☑ Filing Attachments</Text>
            </View>
          )}
        </View>
      )}

      {/* Employer Registration */}
      {hasEmp && (
        <View>
          <Text style={styles.serviceGroupTitle}>Employer Registration</Text>
          <Text style={styles.serviceItem}>☑ This covers the employer and employee registration in the following government agencies:</Text>
          {(d.isSSS || d.isEmployerReg) && <Text style={styles.subService}>☑ Social Security System (SSS)</Text>}
          {(d.isPhilHealth || d.isEmployerReg) && <Text style={styles.subService}>☑ Philippine Health Insurance Corporation (PHIC - PhilHealth)</Text>}
          {(d.isPagibig || d.isEmployerReg) && <Text style={styles.subService}>☑ Home Development Mutual Fund (HDMF – PAGIBIG)</Text>}
          {(d.isBIREmployer || d.isEmployerReg) && <Text style={styles.subService}>☑ Bureau of Internal Revenue (BIR)</Text>}
          {(d.isDOLE || d.isEmployerReg) && <Text style={styles.subService}>☑ Department of Labor and Employment (DOLE)</Text>}
        </View>
      )}

      {/* Government Remittances */}
      {d.isRemittances && (
        <View>
          <Text style={styles.serviceGroupTitle}>Government Remittances</Text>
          <Text style={styles.serviceItem}>☑ This covers the contribution remittances to the following government agencies:</Text>
          {(d.isSSS || d.isRemittances) && <Text style={styles.subService}>☑ Social Security System (SSS)</Text>}
          {(d.isPhilHealth || d.isRemittances) && <Text style={styles.subService}>☑ Philippine Health Insurance Corporation (PHIC - PhilHealth)</Text>}
          {(d.isPagibig || d.isRemittances) && <Text style={styles.subService}>☑ Home Development Mutual Fund (HDMF – PAGIBIG)</Text>}
          {(d.isBIREmployer || d.isRemittances) && <Text style={styles.subService}>☑ Bureau of Internal Revenue (BIR)</Text>}
        </View>
      )}

      {/* Employer Retirement */}
      {hasEmpClosure && (
        <View>
          <Text style={styles.serviceGroupTitle}>Employer Retirement (Closure)</Text>
          <Text style={styles.serviceItem}>☑ This covers the following government agencies:</Text>
          {(d.isSSS || d.isEmployerReg) && <Text style={styles.subService}>☑ Social Security System (SSS)</Text>}
          {(d.isPhilHealth || d.isEmployerReg) && <Text style={styles.subService}>☑ Philippine Health Insurance Corporation (PHIC - PhilHealth)</Text>}
          {(d.isPagibig || d.isEmployerReg) && <Text style={styles.subService}>☑ Home Development Mutual Fund (HDMF – PAGIBIG)</Text>}
          {(d.isBIREmployer || d.isEmployerReg) && <Text style={styles.subService}>☑ Bureau of Internal Revenue (BIR)</Text>}
          {(d.isDOLE || d.isEmployerReg) && <Text style={styles.subService}>☑ Department of Labor and Employment (DOLE)</Text>}
        </View>
      )}
    </View>
  );
}

// ── Main PDF component ────────────────────────────────────────────────────────

export function TSAContractPDF({ data }: { data: ContractData }) {
  const businessSuffix = data.isBusinessRegistered ? '' : ' (unregistered)';

  return (
    <Document
      title={`Terms of Service Agreement - ${data.clientNo}`}
      author="Agila Tax Management Services"
    >
      <Page size="A4" style={styles.page}>
        {/* Header image — full-bleed banner at top of every page */}
        {data.headerSrc && (
          // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image does not support alt prop
          <Image src={data.headerSrc} style={styles.headerImage} />
        )}

        <View style={styles.pageContent}>
        {/* Document title */}
        <View style={styles.titleBar}>
          <Text style={styles.titleText}>TERMS OF SERVICE AGREEMENT</Text>
        </View>

        {/* Intro */}
        <Text style={styles.body}>
          {'  '}This Terms of Service Agreement (&quot;Agreement&quot;) is made and entered into at the City of Cebu, Philippines, this{' '}
          <Text style={styles.bold}>{data.tosDate}</Text> by and between:
        </Text>

        {/* Parties box */}
        <View style={styles.partiesBox}>
          <Text style={styles.body}>
            <Text style={styles.bold}>AGILA TAX MANAGEMENT SERVICES</Text>
            {', a sole proprietorship duly registered under the name '}
            <Text style={styles.bold}>Jade Christian Y. Quitorio</Text>
            {', Filipino, of legal age, single, with business address at Unit 8-2D Alicia Building, Charity and Friendship Streets, Peace Valley, Lahug, Cebu City 6000, hereinafter referred to as the '}
            <Text style={styles.bold}>&quot;Service Provider.&quot;</Text>
          </Text>
          <Text style={styles.bodyCenter}>- AND -</Text>
          <Text style={styles.body}>
            <Text style={styles.bold}>{data.authorizedRep}</Text>
            {`, Filipino, of legal age, ${data.civilStatus || 'single / married / widowed / divorced'}, with residence address at `}
            <Text style={styles.bold}>{data.residenceAddress || '_____________________'}</Text>
            {', the owner / representative / shareholder of '}
            <Text style={styles.bold}>{data.businessName}{businessSuffix}</Text>
            {' with business address at '}
            <Text style={styles.bold}>{data.businessAddress}</Text>
            {', hereinafter referred to as the '}
            <Text style={styles.bold}>&quot;Client.&quot;</Text>
          </Text>
        </View>

        {/* I. Service Rates and Fees */}
        <SectionTitle number="I" title="SERVICE RATES AND FEES" />
        <Text style={styles.body}>The Client agrees to pay Agila Tax Management Services the following:</Text>

        {/* Subscription line — show recurring + free one-time services */}
        {data.planName && (data.planServices ?? []).length > 0 ? (
          <View style={{ marginBottom: 6 }}>
            <Text style={[styles.indent, styles.bold]}>
              {'• Subscription Fee for '}{data.planName}
            </Text>
            {/* List recurring + free one-time services */}
            <View style={{ marginLeft: 36, marginTop: 2 }}>
              {(data.planServices ?? []).map((svc, i) => (
                <Text key={i} style={[styles.serviceItem, { marginLeft: 0 }]}>
                  {'- '}{svc}
                </Text>
              ))}
            </View>
            {data.actualMonthlySubscription ? (
              <Text style={[styles.indent, { marginTop: 4, fontSize: 9 }]}>
                {'Actual Monthly Subscription: Php '}{data.actualMonthlySubscription}{' per month'}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Additional / one-time paid services - only show if there are any */}
        {(data.additionalServices ?? []).length > 0 ? (
          <View style={{ marginBottom: 6 }}>
            <Text style={[styles.indent, styles.bold]}>{'• Additional Services / One-Time Fees:'}</Text>
            <View style={{ marginLeft: 36, marginTop: 2 }}>
              {(data.additionalServices ?? []).map((svc, i) => (
                <Text key={i} style={[styles.serviceItem, { marginLeft: 0 }]}>
                  {'- '}{svc}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {/* II. Scope of Services */}
        <SectionTitle number="II" title="SCOPE OF SERVICES" />
        <Text style={styles.body}>
          Agila Tax Management Services agrees to provide the services selected and agreed upon by the Client, which may include:
        </Text>
        {/* Flat bullet list of all services */}
        {(data.planServices ?? []).length > 0 || (data.additionalServices ?? []).length > 0 ? (
          <View style={{ marginTop: 4 }}>
            {[...(data.planServices ?? []), ...(data.additionalServices ?? [])].map((svc, i) => {
              // Strip price suffix if present (e.g., "Service - P500.00" -> "Service")
              const cleanName = svc.replace(/\s*-\s*P[\d,]+\.\d{2}$/i, '');
              return (
                <Text key={i} style={styles.bullet}>
                  {'• '}{cleanName}
                </Text>
              );
            })}
          </View>
        ) : (
          <ServiceSections d={data} />
        )}

        {/* III. Billing and Payment Terms */}
        <SectionTitle number="III" title="BILLING AND PAYMENT TERMS" />
        <Text style={styles.body}>
          <Text style={styles.bold}>Billing Cycle: </Text>
          Invoices shall be issued on the 1st day of every month, except for the First Payment. For subscriptions initiated at any time during the month, the First Payment shall be paid in full for the subscription to be activated. The due date of each subscription invoice shall be three (3) calendar days after the invoice date. Failure to settle the subscription fee after the due date may result to Service Suspension and shall incur a Late Payment Charge of four percent{' '}
          <Text style={styles.bold}>(4%)</Text> per month, computed on the outstanding balance.
        </Text>
        <Text style={styles.body}>
          <Text style={styles.bold}>Subscription Commitment and Lock-In Period: </Text>
          The Client agrees to a minimum service commitment of six (6) months, commencing from the official service start month. Upon completion of the six (6) month commitment period, this Agreement shall automatically continue on a month-to-month basis, unless otherwise terminated in accordance with this Agreement.
        </Text>
        <Text style={styles.body}>
          <Text style={styles.bold}>Early Termination and Refund Policy: </Text>
          If the Client terminates the service within the six (6) month lock-in period, the Client agrees to pay all remaining subscription fees for the unexpired portion of the commitment period. All payments made to the Service Provider are non-refundable, regardless of usage, termination, or suspension of services. Services shall continue only until the end of the current paid period.
        </Text>

        {/* IV. Payment Method */}
        <SectionTitle number="IV" title="PAYMENT METHOD" />
        <Text style={styles.body}>Payments may be made through any of the following methods:</Text>
        <Text style={styles.bullet}>• Cash Payment, accepted at the Service Provider&apos;s office</Text>
        <Text style={styles.bullet}>• Fund Transfer through the official company bank account under UnionBank</Text>
        <Text style={styles.bullet}>• eWallet Payments, as accepted by the Service Provider</Text>
        <Text style={styles.body}>
          Available payment options may be viewed at:{' '}
          <Text style={styles.bold}>https://agilaworkspace.com/payment-options</Text>
        </Text>
        <Text style={styles.body}>The Service Provider reserves the right to update payment channels as necessary.</Text>

        {/* V. Points of Communication */}
        <SectionTitle number="V" title="POINTS OF COMMUNICATION" />
        <Text style={[styles.body, { fontFamily: 'Helvetica-Oblique', fontSize: 9 }]}>(Subject to change without prior notice)</Text>
        <Text style={[styles.body, styles.bold]}>Day-to-Day Communication:</Text>
        <Text style={styles.bullet}>• WhatsApp Messenger: 0962-248-5706</Text>
        <Text style={styles.bullet}>• Facebook Messenger: ATMS Client Care</Text>
        <Text style={[styles.body, styles.bold]}>Phone Contacts:</Text>
        <Text style={styles.bullet}>• Account Officers: 0962-433-6811 (Primary point of contact and follow-ups)</Text>
        <Text style={styles.bullet}>• Acting Operations Manager: 0912-803-9908 (Escalations)</Text>
        <Text style={styles.bullet}>• Sales Officer: 0962-433-6808 (Additional services or additional accounts)</Text>
        <Text style={styles.bullet}>• Executive Manager: By appointment only (Major or strategic concerns)</Text>

        {/* VI. Office Hours */}
        <SectionTitle number="VI" title="OFFICE HOURS AND AVAILABILITY" />
        <Text style={styles.body}>The Service Provider&apos;s official office hours are:</Text>
        <Text style={[styles.indent, styles.bold]}>Monday to Thursday, 8:00 AM to 5:00 PM & Firdays, 8:00 AM to 12:00 PM</Text>
        <Text style={styles.body}>
          The office is closed on weekends, official holidays, office trainings, and special events.
        </Text>

        {/* VII. Client Responsibilities */}
        <SectionTitle number="VII" title="CLIENT RESPONSIBILITIES" />
        <Text style={styles.body}>The Client agrees to:</Text>
        <Text style={styles.bullet}>• Provide accurate, complete, and timely information required for service delivery.</Text>
        <Text style={styles.bullet}>• Respond to communications within a reasonable timeframe during working hours.</Text>
        <Text style={styles.bullet}>• Ensure availability for onboarding meetings and required submissions.</Text>
        <Text style={styles.body}>Failure to comply may result in delays or additional charges.</Text>

        {/* VIII. Terms and Termination */}
        <SectionTitle number="VIII" title="TERMS AND TERMINATION" />
        <Text style={styles.body}>
          This Agreement shall commence upon acceptance and remain effective until disengagement or termination. Either party may terminate this Agreement before the next billing cycle. If an invoice has been generated, that should be paid by the client and all works should be done by the service provider.
        </Text>

        {/* IX. Confidentiality */}
        <SectionTitle number="IX" title="CONFIDENTIALITY" />
        <Text style={styles.body}>
          Both parties agree to treat as confidential all non-public, proprietary, or sensitive information disclosed in connection with this Agreement, whether oral, written, electronic, or otherwise, including but not limited to business records, financial data, personal information, documents, processes, and compliance-related information (&quot;Confidential Information&quot;).
        </Text>
        <Text style={styles.body}>
          The receiving party shall use such Confidential Information solely for purposes related to the performance of the Services and shall not disclose the same to any third party without prior written consent of the disclosing party, except as may be required by law, regulation, or government authority.
        </Text>
        <Text style={styles.body}>
          This confidentiality obligation shall survive the termination or expiration of this Agreement.
        </Text>

        {/* X. Intellectual Property */}
        <SectionTitle number="X" title="INTELLECTUAL PROPERTY" />
        <Text style={styles.body}>
          All documents, reports, filings, working papers, templates, systems access, and materials prepared or provided by Agila Tax Management Services in connection with the Services shall remain the intellectual property of the Service Provider until full payment of all applicable fees has been received, unless otherwise expressly agreed in writing.
        </Text>
        <Text style={styles.body}>
          Upon full payment, the Client is granted a non-exclusive right to use the final deliverables solely for lawful business purposes. The Client shall not reproduce, distribute, or modify such materials to third parties without the prior written consent of the Service Provider.
        </Text>

        {/* XI. Limitation of Liability */}
        <SectionTitle number="XI" title="LIMITATION OF LIABILITY" />
        <Text style={styles.body}>
          To the maximum extent permitted by law, Agila Tax Management Services shall not be liable for any indirect, incidental, consequential, special, or punitive damages, including but not limited to loss of profits, loss of business, loss of data, or interruption of operations, arising out of or in connection with this Agreement or the Services provided.
        </Text>
        <Text style={styles.body}>
          The total aggregate liability of the Service Provider, whether arising in contract, tort, negligence, or otherwise, shall in no event exceed the total amount actually paid by the Client for the specific Services giving rise to the claim.
        </Text>
        <Text style={styles.body}>
          The Service Provider shall not be liable for delays, penalties, losses, or damages resulting from incomplete, inaccurate, or late information or documentation provided by the Client, nor for acts, omissions, system limitations, policy changes, processing timelines, or decisions of government agencies or third parties.
        </Text>
        <Text style={styles.body}>
          <Text style={styles.bold}>Fortuitous Events. </Text>
          The Service Provider shall not be held liable for any failure or delay in the performance of its obligations arising from fortuitous events or force majeure, including but not limited to acts of God, natural disasters, fire, flood, earthquake, pandemic, epidemic, war, civil disturbance, labor disputes, government actions, power outages, system failures, or other events beyond the reasonable control of the Service Provider.
        </Text>

        {/* XII. Governing Law */}
        <SectionTitle number="XII" title="GOVERNING LAW AND DISPUTE RESOLUTION" />
        <Text style={styles.body}>
          This Agreement shall be governed by and construed in accordance with the laws of the Republic of the Philippines.
        </Text>
        <Text style={styles.body}>
          In the event of any dispute arising out of or in connection with this Agreement, the parties shall first endeavor to resolve the matter through amicable settlement and good faith negotiations. If no resolution is reached within a reasonable period, either party may pursue appropriate legal remedies before the proper courts of the Philippines, with venue to be agreed upon or as provided by law.
        </Text>

        {/* XIII. Acceptance */}
        <SectionTitle number="XIII" title="ACCEPTANCE AND AGREEMENT" />
        <Text style={styles.body}>
          By signing below, the Client confirms understanding and acceptance of these Terms of Service.
        </Text>

        {/* Signatures */}
        <View style={styles.sigSection} wrap={false}>
          <View style={styles.sigRow}>
            <View style={styles.sigBox}>
              <Text style={styles.sigLabel}>AGILA TAX MANAGEMENT SERVICES</Text>
              <Text style={styles.sigLabel}>Authorized Representative:</Text>
              <View style={styles.sigLine}>
                <Text style={styles.sigName}>MR. JOHN CARLO MALIKSI EMOCLING</Text>
              </View>
              <Text style={styles.sigDate}>Date: {data.tosDate}</Text>
            </View>
            <View style={styles.sigBox}>
              <Text style={styles.sigLabel}>CLIENT</Text>
              <Text style={styles.sigLabel}>Authorized Representative:</Text>
              <View style={styles.sigLine}>
                <Text style={styles.sigName}>{data.authorizedRep.toUpperCase()}</Text>
              </View>
              <Text style={styles.sigDate}>Date: _________________</Text>
            </View>
          </View>
        </View>

        </View>{/* end pageContent */}

        {/* Footer (appears on every page) */}
        <View style={styles.footer} fixed>
          <Text>
            Document Reference: {data.clientNo} | Generated: {data.tosDate}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
