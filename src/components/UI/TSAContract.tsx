'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { Card } from '@/components/UI/Card';
import { 
  CheckCircle, Download, FileText, FileCheck, 
  Mail, Phone, Building2, User, Package
} from 'lucide-react';
import { PLAN_DATA } from '@/components/UI/ServicePlanModal';

interface ServiceItem {
  id: string;
  name: string;
  teamInCharge: string;
  government: string;
  rate: number;
}

interface CustomPlanDetails {
  basePlan: string;
  customFeaturesIncluded: string[];
  customFeaturesMore: string[];
  customFreebies: string[];
  customPrice: string;
  selectedServiceIds?: string[];
  displayName?: string;
}

interface ClientData {
  clientNo: string;
  businessName: string;
  authorizedRep: string;
  email: string;
  phone: string;
  tin: string;
  businessAddress: string;
  agentName?: string;
  selectedPlan?: string;
  planDetails?: CustomPlanDetails;
  totalAmount?: number;
  dueDate?: string;
  civilStatus?: string;
  residenceAddress?: string;
  isBusinessRegistered?: boolean;
  selectedServices?: string[];
  businessType?: string;
}

interface TurnoverSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientData: ClientData;
  selectedPlan: 'starter' | 'essentials-non-vat' | 'essentials-vat' | 'agila360-non-vat' | 'agila360-vat' | 'vip';
  allServices: ServiceItem[];
}

function downloadDocument(html: string, _filename: string): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to download documents.');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

export const TurnoverSuccessModal: React.FC<TurnoverSuccessModalProps> = ({
  isOpen,
  onClose,
  clientData,
  allServices
}) => {
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  // Fetch all services from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        if (response.ok) {
          const _data = await response.json();
          // Services are already provided via props, no need to fetch
        }
      } finally {
        setIsLoadingServices(false);
      }
    };

    if (isOpen) {
      fetchServices();
    }
  }, [isOpen]);

  const clientPlanDetails = clientData.planDetails;
  const basePlanData = clientPlanDetails
    ? (PLAN_DATA[clientPlanDetails.basePlan as keyof typeof PLAN_DATA] ?? null)
    : null;

  async function generateTermsOfService() {
    try {
      const [{ pdf }, { TSAContractPDF, buildContractData }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/UI/TSAContractPDF'),
      ]);
      const headerSrc = `${window.location.origin}/images/header.webp`;
      const contractData = buildContractData(clientData, allServices, basePlanData, headerSrc);
      const el = React.createElement(TSAContractPDF, { data: contractData }) as Parameters<typeof pdf>[0];
      const blob = await pdf(el).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      console.error('Failed to generate TOS PDF', err);
      alert('Failed to generate the contract PDF. Please try again.');
    }
  }

  function generateInvoice() {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const planPrice = clientPlanDetails?.customPrice ?? '—';
    const planName = basePlanData?.displayName ?? clientData.selectedPlan ?? 'Custom Plan';
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Temporary Invoice - ${clientData.clientNo}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:auto;color:#1e293b}
    h1{color:#25238e;border-bottom:3px solid #25238e;padding-bottom:10px}
    table{width:100%;border-collapse:collapse;margin-top:20px}
    th{background:#25238e;color:#fff;padding:10px;text-align:left}
    td{padding:10px;border-bottom:1px solid #e2e8f0}
    .total{font-weight:bold;font-size:1.1em}</style></head><body>
    <img src="/images/header.webp" style="width:100%;max-height:120px;object-fit:contain;margin-bottom:16px" />
    <h1>TEMPORARY INVOICE</h1>
    <p><strong>Invoice Date:</strong> ${dateStr}</p>
    <p><strong>Client No.:</strong> ${clientData.clientNo}</p>
    <p><strong>Business Name:</strong> ${clientData.businessName}</p>
    <p><strong>Authorized Rep.:</strong> ${clientData.authorizedRep}</p>
    <table><thead><tr><th>Description</th><th>Amount (Php)</th></tr></thead>
    <tbody><tr><td>${planName} — Monthly Subscription</td><td>${planPrice}</td></tr></tbody>
    <tfoot><tr><td class="total">Total Monthly</td><td class="total">${planPrice}</td></tr></tfoot>
    </table>
    <p style="margin-top:30px;font-size:11pt;color:#64748b">This is a temporary invoice subject to final billing confirmation.</p>
    </body></html>`;
    downloadDocument(html, `Invoice_${clientData.clientNo}.html`);
  }

  function downloadBoth() {
    generateInvoice();
    void generateTermsOfService();
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="🎉 Client Onboarding Complete!" 
      size="xl"
    >
      <div className="space-y-6 p-6">
        {/* Success Message */}
        <div className="text-center p-6 bg-linear-to-r from-emerald-50 to-blue-50 rounded-2xl border-2 border-emerald-200">
          <CheckCircle size={64} className="mx-auto text-emerald-600 mb-4" />
          <h3 className="text-2xl font-black text-slate-900 mb-2">Turnover Successful!</h3>
          <p className="text-slate-600">
            <strong>{clientData.businessName}</strong> has been successfully onboarded.
          </p>
          <div className="mt-4 inline-block bg-white px-8 py-3 rounded-xl shadow-sm">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Client Number</p>
            <p className="text-3xl font-black text-blue-600">{clientData.clientNo}</p>
          </div>
        </div>

        {/* Selected Plan Information */}
        {clientPlanDetails && basePlanData && (
          <Card className="p-6 border-2 border-blue-200 bg-linear-to-br from-blue-50 to-purple-50">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-xl ${basePlanData.bgColor}`}>
                <Package size={24} className={basePlanData.color} />
              </div>
              <div>
                <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm">
                  Selected Monthly Service Plan
                </h4>
                <p className="text-xs text-slate-500">Recurring monthly subscription</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {basePlanData.icon}
                    <h5 className="text-lg font-black text-slate-900">{basePlanData.displayName}</h5>
                  </div>
                  {basePlanData.badge && (
                    <span className={`text-[9px] font-black px-2 py-1 rounded ${basePlanData.badgeColor}`}>
                      {basePlanData.badge}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-blue-600">
                    ₱{clientPlanDetails.customPrice}
                  </p>
                  <p className="text-xs text-slate-500">/month</p>
                </div>
              </div>
              
              <p className="text-sm text-slate-600 mb-3">{basePlanData.description}</p>
              
              {/* Selected Services */}
              {clientPlanDetails.selectedServiceIds && clientPlanDetails.selectedServiceIds.length > 0 && (
                <div className="border-t border-slate-200 pt-3 mb-3">
                  <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">
                    Selected Services ({clientPlanDetails.selectedServiceIds.length}):
                  </p>
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                    {clientPlanDetails.selectedServiceIds.map((serviceId: string) => {
                      const service = allServices.find(s => s.id === serviceId);
                      return service ? (
                        <div key={serviceId} className="flex items-start gap-2 text-xs bg-blue-50 p-2 rounded">
                          <CheckCircle size={12} className="text-blue-600 mt-0.5 shrink-0" />
                          <span className="text-slate-700">{service.name}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              
              {/* Core Features */}
              <div className="border-t border-slate-200 pt-3">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                  Core Features ({clientPlanDetails.customFeaturesIncluded.length}):
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {clientPlanDetails.customFeaturesIncluded.slice(0, 6).map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-[#000000] mt-0.5 shrink-0" />
                      <span className="text-xs text-slate-600">{feature}</span>
                    </div>
                  ))}
                </div>
                {clientPlanDetails.customFeaturesIncluded.length > 6 && (
                  <p className="text-xs text-blue-600 font-bold mt-2">
                    +{clientPlanDetails.customFeaturesIncluded.length - 6} more features
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Client Information Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <Building2 size={20} className="text-blue-600" />
              <h4 className="font-black text-slate-800 uppercase tracking-tight text-xs">Business Info</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-slate-500">Business Name</p>
                <p className="font-bold text-slate-900">{clientData.businessName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">TIN</p>
                <p className="font-bold text-slate-900">{clientData.tin}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <User size={20} className="text-purple-600" />
              <h4 className="font-black text-slate-800 uppercase tracking-tight text-xs">Contact Info</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-slate-400" />
                <p className="text-slate-900">{clientData.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-slate-400" />
                <p className="text-slate-900">{clientData.phone}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Documents Section */}
        <div className="border-t border-slate-200 pt-6">
          <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm flex items-center gap-2 mb-4">
            <FileText size={16} />
            Required Documents
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 border-slate-200 hover:border-blue-500 transition-all group">
              <div className="flex flex-col items-center gap-3">
                <FileCheck size={32} className="text-blue-600 group-hover:scale-110 transition-transform" />
                <h5 className="font-bold text-sm text-center">Temporary Invoice</h5>
                <p className="text-xs text-slate-500 text-center">Monthly subscription breakdown with selected services</p>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700" 
                  onClick={generateInvoice}
                  disabled={isLoadingServices}
                >
                  <Download size={14} className="mr-2" />
                  {isLoadingServices ? 'Loading...' : 'Download Invoice'}
                </Button>
              </div>
            </Card>
            
            <Card className="p-6 border-slate-200 hover:border-purple-500 transition-all group">
              <div className="flex flex-col items-center gap-3">
                <FileText size={32} className="text-purple-600 group-hover:scale-110 transition-transform" />
                <h5 className="font-bold text-sm text-center">Terms of Service</h5>
                <p className="text-xs text-slate-500 text-center">Service agreement with plan details</p>
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700" 
                  onClick={generateTermsOfService}
                  disabled={isLoadingServices}
                >
                  <Download size={14} className="mr-2" />
                  {isLoadingServices ? 'Loading...' : 'Download Agreement'}
                </Button>
              </div>
            </Card>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={downloadBoth}
            disabled={isLoadingServices}
          >
            <Download size={16} className="mr-2" />
            Download Both
          </Button>
          <Button 
            className="flex-1 bg-emerald-600 hover:bg-emerald-700" 
            onClick={onClose}
          >
            Complete
          </Button>
        </div>
      </div>
    </Modal>
  );
};

function _generateTOSHTML(clientData: ClientData, allServices: ServiceItem[]): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const tosDate = `${year}-${month}-${day}`;

  const planDetails = clientData.planDetails;
  const basePlanData = planDetails ? PLAN_DATA[planDetails.basePlan as keyof typeof PLAN_DATA] : null;
  const businessStatus = clientData.isBusinessRegistered ? 'registered' : 'unregistered';

  // Determine which subscription plan checkbox to check
  let subscriptionFeeHTML = '';
  if (basePlanData && planDetails) {
    const planPrice = parseFloat(planDetails.customPrice.replace(/,/g, '')).toFixed(2);
    
    // Map plan IDs to their display information
    const planDisplayInfo: Record<string, { name: string; price: string }> = {
      'starter': { name: 'Starter Plan', price: '1,500.00' },
      'essentials-non-vat': { name: 'Essentials Plan (Non-VAT)', price: '2,500.00' },
      'essentials-vat': { name: 'Essentials Plan (VAT)', price: '4,500.00' },
      'agila360-non-vat': { name: 'Agila360 Plan (Non-VAT)', price: '5,000.00' },
      'agila360-vat': { name: 'Agila360 Plan (VAT)', price: '6,500.00' },
      'vip': { name: 'VIP Plan', price: '15,000.00' }
    };

    const selectedPlanInfo = planDisplayInfo[basePlanData.id];
    
    if (selectedPlanInfo) {
      subscriptionFeeHTML = `
        <div style="margin-left: 20px;">
          <p style="margin-bottom: 8px;"><strong>● Subscription Fee for ${selectedPlanInfo.name}: Php ${selectedPlanInfo.price} per month</strong></p>
        </div>
        <div style="margin-top: 12px; margin-left: 20px;"><strong>Actual Monthly Subscription: Php ${planPrice}</strong></div>
        <p style="margin-top: 12px;"><strong>Additional Services / One-Time Fees:</strong> Rates are based on selected service plans and will be confirmed prior to commencement of work.</p>
      `;
    }
  }

  // Helper function to check if a service is included in the plan
  const isServiceInPlan = (keywords: string[]): boolean => {
    if (!planDetails || !basePlanData) return false;
    
    // Check in featuresIncluded
    const inFeaturesIncluded = basePlanData.featuresIncluded.some((feature: string) => 
      keywords.some(keyword => feature.toLowerCase().includes(keyword.toLowerCase()))
    );
    
    // Check in featuresMore
    const inFeaturesMore = basePlanData.featuresMore ? 
      basePlanData.featuresMore.some((feature: string) => 
        keywords.some(keyword => feature.toLowerCase().includes(keyword.toLowerCase()))
      ) : false;
    
    // Check in selectedServiceIds
    const inSelectedServices = planDetails.selectedServiceIds ? 
      planDetails.selectedServiceIds.some((serviceId: string) => {
        const service = allServices.find(s => s.id === serviceId);
        if (!service) return false;
        return keywords.some(keyword => 
          service.name.toLowerCase().includes(keyword.toLowerCase()) ||
          service.government.toLowerCase().includes(keyword.toLowerCase())
        );
      }) : false;
    
    return inFeaturesIncluded || inFeaturesMore || inSelectedServices;
  };

  // Service category checks
  const isDTI = isServiceInPlan(['DTI', 'Department of Trade', 'Business Name']);
  const isDTIReg = isServiceInPlan(['DTI Registration', 'DTI Certificate']);
  const isDTIClosure = isServiceInPlan(['DTI', 'Closure', 'Business Name Closure']);
  const isBMBE = isServiceInPlan(['BMBE']);
  
  const isSEC = isServiceInPlan(['SEC', 'Securities', 'Corporation']);
  const isSECReg = isServiceInPlan(['SEC Registration', 'Corporate Registration', 'Incorporation']);
  const isEfast = isServiceInPlan(['eFast', 'Efast']);
  const isStockTransfer = isServiceInPlan(['Stock Transfer']);
  const isSECAmendments = isServiceInPlan(['SEC Amendment', 'Amendment']);
  const isAppointment = isServiceInPlan(['Appointment of Officers', 'One-Person Corporation']);
  const isGIS = isServiceInPlan(['GIS', 'General Information Sheet']);
  const isAFS = isServiceInPlan(['AFS', 'Audited Financial', 'Financial Statement']);
  
  const isLGU = isServiceInPlan(['Mayor', 'Permit', 'LGU', 'Business Permit']);
  const isMayorReg = isServiceInPlan(['Mayor\'s Permit Registration', 'Mayor Permit Processing']);
  const isMayorRenewal = isServiceInPlan(['Mayor\'s Permit Renewal', 'Permit Renewal']);
  const isMayorClosure = isServiceInPlan(['Mayor', 'Closure', 'Retirement']);
  const isTempPermit = isServiceInPlan(['Temporary Permit']);
  const isSanitary = isServiceInPlan(['Sanitary Permit']);
  const isFire = isServiceInPlan(['Fire', 'Fire Safety', 'FSIC']);
  const isCCENRO = isServiceInPlan(['CCENRО', 'Environmental Certificate']);
  const isProfessionalTax = isServiceInPlan(['Professional Tax', 'Occupational Tax', 'Cedula']);
  
  const isBIR = isServiceInPlan(['BIR', 'Bureau of Internal Revenue']);
  const isBIRReg = isServiceInPlan(['BIR Registration', 'BIR Business Registration', 'Certificate of Registration', '2303']);
  const isBIRBranch = isServiceInPlan(['Add Branch', 'Branch Registration']);
  const isBIRClosure = isServiceInPlan(['BIR', 'Closure']);
  const isORUS = isServiceInPlan(['ORUS']);
  const isBooksReg = isServiceInPlan(['Books Registration', 'Register Books']);
  const isInvoicePrint = isServiceInPlan(['Invoice Printing', 'Official Receipt', 'Sales Invoice']);
  const isAddTaxType = isServiceInPlan(['Add Tax Type', 'Tax Type']);
  const isRentalDocStamp = isServiceInPlan(['Rental', 'Doc Stamp', 'Documentary Stamp']);
  const isStocksDocStamp = isServiceInPlan(['Stocks', 'Doc Stamp']);
  const isAuditorsReport = isServiceInPlan(['Auditor\'s Report', 'Auditors Report']);
  const isOpenCase = isServiceInPlan(['Open Case', 'Case Report']);
  
  const isBIRCompliance = isServiceInPlan(['Tax Return', 'ITR', 'VAT', 'Withholding', 'BIR Compliance', 'Filing']);
  const isEWT = isServiceInPlan(['Expanded Withholding', 'EWT']);
  const isFWT = isServiceInPlan(['Final Withholding', 'FWT']);
  const isCWT = isServiceInPlan(['Compensation Withholding', 'CWT']);
  const isPercentageTax = isServiceInPlan(['Percentage Tax']);
  const isVATReturn = isServiceInPlan(['VAT Return', 'Value-Added Tax']);
  const isITR = isServiceInPlan(['Income Tax Return', 'ITR']);
  
  const isEmployerReg = isServiceInPlan(['Employer Registration', 'SSS', 'PhilHealth', 'PAGIBIG', 'Pag-IBIG', 'DOLE']);
  const isSSS = isServiceInPlan(['SSS', 'Social Security']);
  const isPhilHealth = isServiceInPlan(['PhilHealth', 'PHIC']);
  const isPagibig = isServiceInPlan(['PAGIBIG', 'Pag-IBIG', 'HDMF']);
  const isBIREmployer = isServiceInPlan(['BIR', 'Employer']);
  const isDOLE = isServiceInPlan(['DOLE', 'Department of Labor']);
  
  const isRemittances = isServiceInPlan(['Remittance', 'Contribution', 'Government Remittance']);

  // Build services HTML - only show checked items
  let servicesHTML = '';

  // DTI Section
  if (isDTI || isDTIReg || isDTIClosure || isBMBE) {
    servicesHTML += `<p><strong>Department of Trade and Industry (DTI)</strong></p>`;
    
    if (isDTI || isDTIReg) {
      servicesHTML += `<div class="service-item">☑ Business Name Registration</div>`;
      if (isDTI || isDTIReg) {
        servicesHTML += `<div class="sub-service">☑ Securing DTI Certificate of Business Name Registration</div>`;
      }
    }
    
    if (isDTIClosure) {
      servicesHTML += `<div class="service-item">☑ Business Name Closure</div>`;
    }
    
    if (isBMBE) {
      servicesHTML += `<div class="service-item">☑ BMBE Registration</div>`;
    }
  }

  // SEC Section
  if (isSEC || isSECReg || isEfast || isStockTransfer || isSECAmendments || isAppointment || isGIS || isAFS) {
    servicesHTML += `<p style="margin-top: 20px;"><strong>Securities and Exchange Commission (SEC)</strong></p>`;
    
    if (isSEC || isSECReg) {
      servicesHTML += `<div class="service-item">☑ Corporate Registration, securing the following documents:</div>`;
      servicesHTML += `<div class="sub-service">☑ Certificate of Incorporation</div>`;
      servicesHTML += `<div class="sub-service">☑ Articles of Incorporation</div>`;
      servicesHTML += `<div class="sub-service">☑ By-Laws</div>`;
    }
    
    if (isEfast) {
      servicesHTML += `<div class="service-item">☑ eFast Registration</div>`;
    }
    
    if (isStockTransfer) {
      servicesHTML += `<div class="service-item">☑ Stock Transfer Book</div>`;
    }
    
    if (isSECAmendments) {
      servicesHTML += `<div class="service-item">☑ SEC Amendments</div>`;
    }
    
    if (isAppointment) {
      servicesHTML += `<div class="service-item">☑ Appointment of Officers for One-Person Corporation</div>`;
    }
    
    if (isGIS) {
      servicesHTML += `<div class="sub-service">☑ General Information Sheet (GIS) Compliance</div>`;
    }
    
    if (isAFS) {
      servicesHTML += `<div class="sub-service">☑ Audited Financial Statement (AFS) Submission Compliance</div>`;
    }
  }

  // LGU Section
  if (isLGU || isMayorReg || isMayorRenewal || isMayorClosure || isTempPermit || isSanitary || isFire || isCCENRO || isProfessionalTax) {
    servicesHTML += `<p style="margin-top: 20px;"><strong>Local Government Unit (LGU)</strong></p>`;
    
    if (isLGU || isMayorReg) {
      servicesHTML += `<div class="service-item">☑ Mayor's Permit Registration:</div>`;
      if (isTempPermit || isLGU) {
        servicesHTML += `<div class="sub-service">☑ Temporary Permit</div>`;
      }
      if (isSanitary || isLGU) {
        servicesHTML += `<div class="sub-service">☑ Sanitary Permit</div>`;
      }
      if (isFire || isLGU) {
        servicesHTML += `<div class="sub-service">☑ Fire Safety Inspection Certificate</div>`;
      }
      if (isCCENRO || isLGU) {
        servicesHTML += `<div class="sub-service">☑ Environmental Certificate (CCENRO)</div>`;
      }
      if (isLGU) {
        servicesHTML += `<div class="sub-service">☑ Final Mayor's Permit</div>`;
        servicesHTML += `<div class="sub-service">☑ This should only involve Business Permits Processing only. Processing of Property Documents are not included.</div>`;
      }
    }
    
    if (isMayorRenewal) {
      servicesHTML += `<div class="service-item">☑ Mayor's Permit Renewal</div>`;
    }
    
    if (isMayorClosure) {
      servicesHTML += `<div class="service-item">☑ Mayor's Permit Retirement (Closure)</div>`;
    }
    
    if (isProfessionalTax) {
      servicesHTML += `<div class="service-item">☑ Professional / Occupational Tax Receipt and Cedula for Professionals</div>`;
    }
  }

  // BIR Section
  if (isBIR || isBIRReg || isBIRBranch || isBIRClosure || isORUS || isBooksReg || isInvoicePrint || isAddTaxType || isRentalDocStamp || isStocksDocStamp || isAuditorsReport || isOpenCase) {
    servicesHTML += `<p style="margin-top: 20px;"><strong>Bureau of Internal Revenue (BIR)</strong></p>`;
    
    if (isBIR || isBIRReg) {
      servicesHTML += `<div class="service-item">☑ Business Registration</div>`;
      if (isBIRReg || isBIR) {
        servicesHTML += `<div class="sub-service">☑ Securing Certificate of Registration (BIR Form 2303)</div>`;
      }
    }
    
    if (isBIRBranch) {
      servicesHTML += `<div class="service-item">☑ Add Branch</div>`;
    }
    
    if (isBIRClosure) {
      servicesHTML += `<div class="service-item">☑ Closure of Main / Branch</div>`;
    }
    
    if (isORUS) {
      servicesHTML += `<div class="service-item">☑ ORUS Registration</div>`;
    }
    
    if (isBooksReg) {
      servicesHTML += `<div class="service-item">☑ Books Registration</div>`;
    }
    
    if (isInvoicePrint) {
      servicesHTML += `<div class="service-item">☑ Invoice Printing / Reprinting</div>`;
    }
    
    if (isAddTaxType) {
      servicesHTML += `<div class="service-item">☑ Add Tax Type</div>`;
    }
    
    if (isRentalDocStamp) {
      servicesHTML += `<div class="service-item">☑ Rental Doc Stamp</div>`;
    }
    
    if (isStocksDocStamp) {
      servicesHTML += `<div class="service-item">☑ Stocks Doc Stamp</div>`;
    }
    
    if (isAuditorsReport) {
      servicesHTML += `<div class="service-item">☑ Auditor's Report for AFS</div>`;
    }
    
    if (isOpenCase) {
      servicesHTML += `<div class="service-item">☑ Open Case Report Checking</div>`;
    }
  }

  // BIR Compliance Section
  if (isBIRCompliance || isEWT || isFWT || isCWT || isPercentageTax || isVATReturn || isITR) {
    servicesHTML += `<p style="margin-top: 20px;"><strong>Bureau of Internal Revenue (BIR) Compliance</strong></p>`;
    servicesHTML += `<div class="service-item">☑ This covers the following compliances (whichever is applicable):</div>`;
    
    if (isEWT || isBIRCompliance) {
      servicesHTML += `<div class="sub-service">☑ Expanded Withholding Tax Return (Monthly, Quarterly, and Annually)</div>`;
    }
    
    if (isFWT || isBIRCompliance) {
      servicesHTML += `<div class="sub-service">☑ Final Withholding Tax Return (Monthly, Quarterly and Annually)</div>`;
    }
    
    if (isCWT || isBIRCompliance) {
      servicesHTML += `<div class="sub-service">☑ Compensation Withholding Tax Return (Monthly and Annually)</div>`;
    }
    
    if (isPercentageTax || isBIRCompliance) {
      servicesHTML += `<div class="sub-service">☑ Percentage Tax Return (Quarterly)</div>`;
    }
    
    if (isVATReturn || isBIRCompliance) {
      servicesHTML += `<div class="sub-service">☑ Value-Added Tax Return (Quarterly)</div>`;
    }
    
    if (isITR || isBIRCompliance) {
      servicesHTML += `<div class="sub-service">☑ Income Tax Return (Quarterly and Annually)</div>`;
    }
    
    if (isBIRCompliance) {
      servicesHTML += `<div class="service-item">☑ Securing the following documents:</div>`;
      servicesHTML += `<div class="sub-service">☑ BIR Forms</div>`;
      servicesHTML += `<div class="sub-service">☑ Email Confirmation</div>`;
      servicesHTML += `<div class="sub-service">☑ Payment Receipt</div>`;
      servicesHTML += `<div class="sub-service">☑ Filing Attachments</div>`;
    }
  }

  // Employer Registration Section
  if (isEmployerReg || isSSS || isPhilHealth || isPagibig || isBIREmployer || isDOLE) {
    servicesHTML += `<p style="margin-top: 20px;"><strong>Employer Registration</strong></p>`;
    servicesHTML += `<div class="service-item">☑ This covers the employer and employee registration in the following government agencies:</div>`;
    
    if (isSSS || isEmployerReg) {
      servicesHTML += `<div class="sub-service">☑ Social Security System (SSS)</div>`;
    }
    
    if (isPhilHealth || isEmployerReg) {
      servicesHTML += `<div class="sub-service">☑ Philippine Health Insurance Corporation (PHIC - PhilHealth)</div>`;
    }
    
    if (isPagibig || isEmployerReg) {
      servicesHTML += `<div class="sub-service">☑ Home Development Mutual Fund (HDMF – PAGIBIG)</div>`;
    }
    
    if (isBIREmployer || isEmployerReg) {
      servicesHTML += `<div class="sub-service">☑ Bureau of Internal Revenue (BIR)</div>`;
    }
    
    if (isDOLE || isEmployerReg) {
      servicesHTML += `<div class="sub-service">☑ Department of Labor and Employment (DOLE)</div>`;
    }
  }

  // Government Remittances Section
  if (isRemittances) {
    servicesHTML += `<p style="margin-top: 20px;"><strong>Government Remittances</strong></p>`;
    servicesHTML += `<div class="service-item">☑ This covers the contribution remittances to the following government agencies:</div>`;
    
    if (isSSS || isRemittances) {
      servicesHTML += `<div class="sub-service">☑ Social Security System (SSS)</div>`;
    }
    
    if (isPhilHealth || isRemittances) {
      servicesHTML += `<div class="sub-service">☑ Philippine Health Insurance Corporation (PHIC - PhilHealth)</div>`;
    }
    
    if (isPagibig || isRemittances) {
      servicesHTML += `<div class="sub-service">☑ Home Development Mutual Fund (HDMF – PAGIBIG)</div>`;
    }
    
    if (isBIREmployer || isRemittances) {
      servicesHTML += `<div class="sub-service">☑ Bureau of Internal Revenue (BIR)</div>`;
    }
  }

  // Employer Retirement Section
  if (isEmployerReg && (isSSS || isPhilHealth || isPagibig || isBIREmployer || isDOLE)) {
    servicesHTML += `<p style="margin-top: 20px;"><strong>Employer Retirement (Closure)</strong></p>`;
    servicesHTML += `<div class="service-item">☑ This covers the following government agencies:</div>`;
    
    if (isSSS || isEmployerReg) {
      servicesHTML += `<div class="sub-service">☑ Social Security System (SSS)</div>`;
    }
    
    if (isPhilHealth || isEmployerReg) {
      servicesHTML += `<div class="sub-service">☑ Philippine Health Insurance Corporation (PHIC - PhilHealth)</div>`;
    }
    
    if (isPagibig || isEmployerReg) {
      servicesHTML += `<div class="sub-service">☑ Home Development Mutual Fund (HDMF – PAGIBIG)</div>`;
    }
    
    if (isBIREmployer || isEmployerReg) {
      servicesHTML += `<div class="sub-service">☑ Bureau of Internal Revenue (BIR)</div>`;
    }
    
    if (isDOLE || isEmployerReg) {
      servicesHTML += `<div class="sub-service">☑ Department of Labor and Employment (DOLE)</div>`;
    }
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Terms of Service Agreement - ${clientData.clientNo}</title>
      <style>
        @media print {
          @page { margin: 0.75in; }
        }
        body { 
          font-family: 'Times New Roman', Times, serif; 
          padding: 40px; 
          color: #1e293b; 
          max-width: 900px; 
          margin: auto; 
          line-height: 1.8; 
          background: #fff;
          font-size: 11pt;
        }
        .header-image { 
          width: 100%; 
          height: auto; 
          max-height: 150px; 
          object-fit: contain;
          margin-bottom: 20px;
        }
        .header { 
          text-align: center; 
          border-bottom: 3px solid #25238e; 
          padding-bottom: 20px; 
          margin-bottom: 30px; 
        }
        .company-name { 
          font-size: 24px; 
          font-weight: 900; 
          color: #25238e; 
          margin-bottom: 5px; 
        }
        .doc-title { 
          font-size: 22px; 
          font-weight: 900; 
          text-align: center; 
          margin: 30px 0; 
          text-transform: uppercase; 
          letter-spacing: 2px;
        }
        .section { 
          margin-bottom: 25px;
          page-break-inside: avoid;
        }
        .section-title { 
          font-size: 12pt; 
          font-weight: 900; 
          color: #25238e; 
          margin: 25px 0 15px 0; 
          text-transform: uppercase; 
          border-bottom: 2px solid #25238e;
          padding-bottom: 5px;
        }
        .parties-info { 
          background: #f8fafc; 
          border-left: 4px solid #25238e; 
          padding: 20px; 
          margin: 20px 0; 
          font-size: 11pt; 
        }
        .signature-section { 
          margin-top: 60px; 
          page-break-inside: avoid;
        }
        .signature-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 50px; 
          margin-top: 40px; 
        }
        .signature-box { 
          text-align: center;
        }
        .signature-line { 
          border-top: 2px solid #000; 
          padding-top: 8px; 
          margin-top: 60px;
          font-weight: bold;
        }
        .signature-label {
          font-size: 10pt;
          color: #64748b;
          margin-bottom: 5px;
        }
        .terms-intro {
          text-indent: 40px;
          text-align: justify;
          margin-bottom: 20px;
        }
        .service-item {
          margin-left: 30px;
          margin-bottom: 8px;
        }
        .sub-service {
          margin-left: 50px;
          margin-bottom: 5px;
        }
        p {
          text-align: justify;
        }
      </style>
    </head>
    <body>
      <img src="/images/header.webp" alt="Company Header" class="header-image" />
      
      <div class="header">
        <div class="company-name">TERMS OF SERVICE AGREEMENT</div>
      </div>
      <p class="terms-intro">
        This Terms of Service Agreement ("<strong>Agreement</strong>") is made and entered into 
        at the City of Cebu, Philippines, this <u>&nbsp;&nbsp;&nbsp;${tosDate}&nbsp;&nbsp;&nbsp;</u>
        by and between:
      </p>

      <div class="parties-info">
        <p style="margin-bottom: 15px;">
          <strong>AGILA TAX MANAGEMENT SERVICES</strong>, a sole proprietorship duly registered 
          under the name <strong>Jade Christian Y. Quitorio</strong>, Filipino, of legal age, single, 
          with business address at Unit 8-2D Alicia Building, Charity and Friendship Streets, 
          Peace Valley, Lahug, Cebu City 6000, hereinafter referred to as the 
          "<strong>Service Provider</strong>."
        </p>
        <p style="text-align: center; margin: 15px 0;"><strong>- AND -</strong></p>
        <p>
          <strong>${clientData.authorizedRep}</strong>, Filipino, of legal age, 
          ${clientData.civilStatus || 'single / married / widowed / divorced'}, 
          with residence address at <strong>${clientData.residenceAddress || '_____________________'}</strong>, 
          the owner / representative / shareholder of <strong>${clientData.businessName}${businessStatus === 'unregistered' ? ' (unregistered)' : ''}</strong> 
          with business address at <strong>${clientData.businessAddress}</strong>, 
          hereinafter referred to as the "<strong>Client</strong>."
        </p>
      </div>

      <div class="section">
        <div class="section-title">I. SERVICE RATES AND FEES</div>
        <p>The Client agrees to pay Agila Tax Management Services the following:</p>
        ${subscriptionFeeHTML}
      </div>

      <div class="section">
        <div class="section-title">II. SCOPE OF SERVICES</div>
        <p>Agila Tax Management Services agrees to provide the services selected and agreed upon by the Client, which may include:</p>

        <div style="margin-top: 15px;">
          ${servicesHTML}
        </div>
      </div>

      <div class="section">
        <div class="section-title">III. BILLING AND PAYMENT TERMS</div>
        <p><strong>Billing Cycle:</strong> Invoices shall be issued on the 1st day of every month, except for the First Payment. For subscriptions initiated at any time during the month, the First Payment shall be paid in full for the subscription to be activated. The due date of each subscription invoice shall be three (3) calendar days after the invoice date. Failure to settle the subscription fee after the due date may result to Service Suspension and shall incur a Late Payment Charge of four percent <strong>(4%)</strong> per month, computed on the outstanding balance.</p>
        
        <p><strong>Subscription Commitment and Lock-In Period:</strong> The Client agrees to a minimum service commitment of six (6) months, commencing from the official service start month. Upon completion of the six (6) month commitment period, this Agreement shall automatically continue on a month-to-month basis, unless otherwise terminated in accordance with this Agreement.</p>
        
        <p><strong>Early Termination and Refund Policy:</strong> If the Client terminates the service within the six (6) month lock-in period, the Client agrees to pay all remaining subscription fees for the unexpired portion of the commitment period. All payments made to the Service Provider are non-refundable, regardless of usage, termination, or suspension of services. Services shall continue only until the end of the current paid period.</p>
      </div>

      <div class="section">
        <div class="section-title">IV. PAYMENT METHOD</div>
        <p>Payments may be made through any of the following methods:</p>
        <div style="margin-left: 20px;">
          <p>• Cash Payment, accepted at the Service Provider's office</p>
          <p>• Fund Transfer through the official company bank account under UnionBank</p>
          <p>• eWallet Payments, as accepted by the Service Provider</p>
        </div>
        <p>Available payment options may be viewed at: <strong>https://agilaworkspace.com/payment-options</strong></p>
        <p>The Service Provider reserves the right to update payment channels as necessary.</p>
      </div>

      <div class="section">
        <div class="section-title">V. POINTS OF COMMUNICATION</div>
        <p style="font-style: italic; font-size: 10pt;">(Subject to change without prior notice)</p>
        
        <p><strong>Day-to-Day Communication:</strong></p>
        <div style="margin-left: 20px;">
          <p>WhatsApp Messenger: 0962-248-5706</p>
          <p>Facebook Messenger: ATMS Client Care</p>
        </div>
        
        <p><strong>Phone Contacts:</strong></p>
        <div style="margin-left: 20px;">
          <p>Account Officers: 0962-433-6811 (Primary point of contact and follow-ups)</p>
          <p>Acting Operations Manager: 0962-248-5706 (Escalations)</p>
          <p>Sales Officer: 0962-433-6808 (Additional services or additional accounts)</p>
          <p>Executive Manager: By appointment only (Major or strategic concerns)</p>
        </div>
      </div>

      <div class="section">
        <div class="section-title">VI. OFFICE HOURS AND AVAILABILITY</div>
        <p>The Service Provider's official office hours are:</p>
        <p style="margin-left: 20px;"><strong>Monday to Friday, 8:00 AM to 5:00 PM</strong></p>
        <p>The office is closed on weekends, official holidays, office trainings, and special events.</p>
      </div>

      <div class="section">
        <div class="section-title">VII. CLIENT RESPONSIBILITIES</div>
        <p>The Client agrees to:</p>
        <div style="margin-left: 20px;">
          <p>• Provide accurate, complete, and timely information required for service delivery.</p>
          <p>• Respond to communications within a reasonable timeframe during working hours.</p>
          <p>• Ensure availability for onboarding meetings and required submissions.</p>
        </div>
        <p>Failure to comply may result in delays or additional charges.</p>
      </div>

      <div class="section">
        <div class="section-title">VIII. TERMS AND TERMINATION</div>
        <p>This Agreement shall commence upon acceptance and remain effective until disengagement or termination. Either party may terminate this Agreement before the next billing cycle. If an invoice has been generated, that should be paid by the client and all works should be done by the service provider.</p>
      </div>

      <div class="section">
        <div class="section-title">IX. CONFIDENTIALITY</div>
        <p>Both parties agree to treat as confidential all non-public, proprietary, or sensitive information disclosed in connection with this Agreement, whether oral, written, electronic, or otherwise, including but not limited to business records, financial data, personal information, documents, processes, and compliance-related information ("Confidential Information").</p>
        
        <p>The receiving party shall use such Confidential Information solely for purposes related to the performance of the Services and shall not disclose the same to any third party without prior written consent of the disclosing party, except as may be required by law, regulation, or government authority.</p>
        
        <p>This confidentiality obligation shall survive the termination or expiration of this Agreement.</p>
      </div>

      <div class="section">
        <div class="section-title">X. INTELLECTUAL PROPERTY</div>
        <p>All documents, reports, filings, working papers, templates, systems access, and materials prepared or provided by Agila Tax Management Services in connection with the Services shall remain the intellectual property of the Service Provider until full payment of all applicable fees has been received, unless otherwise expressly agreed in writing.</p>
        
        <p>Upon full payment, the Client is granted a non-exclusive right to use the final deliverables solely for lawful business purposes. The Client shall not reproduce, distribute, or modify such materials to third parties without the prior written consent of the Service Provider.</p>
      </div>

      <div class="section">
        <div class="section-title">XI. LIMITATION OF LIABILITY</div>
        <p>To the maximum extent permitted by law, Agila Tax Management Services shall not be liable for any indirect, incidental, consequential, special, or punitive damages, including but not limited to loss of profits, loss of business, loss of data, or interruption of operations, arising out of or in connection with this Agreement or the Services provided.</p>
        
        <p>The total aggregate liability of the Service Provider, whether arising in contract, tort, negligence, or otherwise, shall in no event exceed the total amount actually paid by the Client for the specific Services giving rise to the claim.</p>
        
        <p>The Service Provider shall not be liable for delays, penalties, losses, or damages resulting from incomplete, inaccurate, or late information or documentation provided by the Client, nor for acts, omissions, system limitations, policy changes, processing timelines, or decisions of government agencies or third parties.</p>
        
        <p><strong>Fortuitous Events.</strong> The Service Provider shall not be held liable for any failure or delay in the performance of its obligations arising from fortuitous events or force majeure, including but not limited to acts of God, natural disasters, fire, flood, earthquake, pandemic, epidemic, war, civil disturbance, labor disputes, government actions, power outages, system failures, or other events beyond the reasonable control of the Service Provider.</p>
      </div>

      <div class="section">
        <div class="section-title">XII. GOVERNING LAW AND DISPUTE RESOLUTION</div>
        <p>This Agreement shall be governed by and construed in accordance with the laws of the Republic of the Philippines.</p>
        
        <p>In the event of any dispute arising out of or in connection with this Agreement, the parties shall first endeavor to resolve the matter through amicable settlement and good faith negotiations. If no resolution is reached within a reasonable period, either party may pursue appropriate legal remedies before the proper courts of the Philippines, with venue to be agreed upon or as provided by law.</p>
      </div>

      <div class="section">
        <div class="section-title">XIII. ACCEPTANCE AND AGREEMENT</div>
        <p>By signing below, the Client confirms understanding and acceptance of these Terms of Service.</p>
      </div>

      <div class="signature-section">
        <div class="signature-grid">
          <div class="signature-box">
            <div class="signature-label">AGILA TAX MANAGEMENT SERVICES</div>
            <div class="signature-label" style="margin-top: 10px;">Authorized Representative:</div>
            <div class="signature-line">
              MR. JOHN CARLO MALIKSI EMOCLING
            </div>
            <div style="margin-top: 10px; font-size: 10pt;">Date: ${tosDate}</div>
          </div>
          <div class="signature-box">
            <div class="signature-label">CLIENT</div>
            <div class="signature-label" style="margin-top: 10px;">Authorized Representative:</div>
            <div class="signature-line">
              ${clientData.authorizedRep.toUpperCase()}
            </div>
            <div style="margin-top: 10px; font-size: 10pt;">Date: _________________</div>
          </div>
        </div>
      </div>

      <div style="margin-top: 50px; font-size: 10pt; color: #64748b; text-align: center;">
        Document Reference: ${clientData.clientNo} | Generated: ${tosDate}
      </div>
    </body>
    </html>
  `;
}