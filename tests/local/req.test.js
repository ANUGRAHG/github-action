const cds = require("@sap/cds/lib");
const { GET, POST, DELETE } = cds.test ('serve', '--in-memory', '--with-mocks').in(__dirname+'/../../').verbose(false);

const riskManagerAuth = {
    "headers": {
        "Authorization": "Basic cmlzay5tYW5hZ2VyQHRlc3Rlci5zYXAuY29tOmluaXRpYWw="
    }
}

describe("Sanity Test", () => {
    describe("GET /risk/Risks", () => {
        var autoRiskID = null;

        it("+ should return a list of Risks", async () => {
            const response = await GET("/service/risk/Risks", riskManagerAuth);
                expect (response.status).toBe(200);
                expect (response.data.value.length).toBe(3);
        });
    });

    describe("GET /risk/Mitigations", () => {
        it("+ should return a list of Mitigations", async () => {
            const response = await GET("/service/risk/Mitigations", riskManagerAuth);
            expect (response.status).toBe(200);
            expect (response.data.value.length).toBe(4);
        });
    });

    describe("GET /api-business-partner/A_BusinessPartner", () => {
        it("+ should return a list of Mock BusinessPartners", async () => {
            const response = await GET("/api-business-partner/A_BusinessPartner")

            expect (response.status).toBe(200);
        });
    });
});

describe("Risk Management  Flow", () => {

    it("+ set industry for Business Partner", async () => {
        const payload = {
            "BusinessPartner": "1234",
            "IndustrySector": "73",
            "IndustrySystemType": "xxx",
            "IndustryKeyDescription": "Leisure and Hotel"
        }
        const response = await POST("/api-business-partner/A_BuPaIndustry", payload)
        expect (response.status).toBe(201);
    });

    it("+ create new Business Partner", async () => {
        const payload = {
            "BusinessPartner": "1234",
            "BusinessPartnerFullName": "ACME",
            "BusinessPartnerIsBlocked": false
        }
        const response = await POST("/api-business-partner/A_BusinessPartner", payload)

        expect (response.status).toBe(201);
    });

    it("+ Assert Auto Risk Create", async () => {
        const response = await GET("/service/risk/Risks?$filter=bp_ID eq '1234'", riskManagerAuth)
        expect (response.status).toBe(200);
        expect (response.data.value.length).toBe(1);
        autoRiskID = response.data.value[0]?.ID;
    });

    it("- Delete the new Risk", async () => {
        const response = await DELETE(`/service/risk/Risks(ID=${autoRiskID},IsActiveEntity=true)`, riskManagerAuth)
        expect (response.status).toBe(204);
    });

});

describe("CDS Entity level testing", () => {

    const manualRiskPayload = {
        title: 'Manual create: non-compliance',
        descr: 'New Business Partner might violate CFR code',
        bp_ID: "1234",
        status_value: 'NEW'
      }

    it("+ should create new risk in cql", async ()=> {
        
        const {results} = await INSERT.into('Risks').entries(manualRiskPayload)

         expect (results).toBeDefined()

    });

    it("+ should look for the newly created Risk", async ()=>{
        const response = await SELECT.from('Risks').where({"bp_ID": "1234"});
        expect (response).toBeDefined()
        expect (response).toMatchObject([manualRiskPayload]);
    });
});
