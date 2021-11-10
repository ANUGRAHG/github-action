using API_BUSINESS_PARTNER as BUPA_API from './external/API_BUSINESS_PARTNER';
 
 
service RiskServiceMocks {

  @sap.persistance.skip 
  entity BusinessPartner as projection on BUPA_API.A_BusinessPartner;

}


