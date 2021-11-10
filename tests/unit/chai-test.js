const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("./chai-serve");

// Configure chai
chai.use(chaiHttp);
chai.should();

let app = null;

before((done) => {
    server.then((result) => {
        app = result;
        done();
    });
});

describe("Sanity Test", () => {
    describe("GET /risk/Risks", () => {
        var autoRiskID = null;
        it("+ should return a list of Risks", async () => {
            const response = await chai.request(app)
                .get("/service/risk/Risks")
                .auth("risk.manager@tester.sap.com:initial")
            response.should.have.status(200);
            response.body.value.should.be.an("array").to.have.lengthOf(3);
        });
    });

    describe("GET /risk/Mitigations", () => {
        it("+ should return a list of Mitigations", async () => {
            const response = await chai.request(app)
                .get("/service/risk/Mitigations")
                .auth("risk.manager@tester.sap.com:initial")
            response.should.have.status(200);
            response.body.value.should.be.an("array").to.have.lengthOf(4);
        });
    });

    describe("GET /api-business-partner/A_BusinessPartner", () => {
        it("+ should return a list of Mock BusinessPartners", async () => {
            const response = await chai.request(app)
                .get("/api-business-partner/A_BusinessPartner")

            response.should.have.status(200);
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
        const response = await chai.request(app)
            .post("/api-business-partner/A_BuPaIndustry")
            .send(payload)
        response.should.have.status(201);
    });

    it("+ create new Business Partner", async () => {
        const payload = {
            "BusinessPartner": "1234",
            "BusinessPartnerFullName": "ACME",
            "BusinessPartnerIsBlocked": false
        }
        const response = await chai.request(app)
            .post("/api-business-partner/A_BusinessPartner")
            .send(payload)

        response.should.have.status(201);
    });

    it("+ Assert Auto Risk Create", async () => {
        const response = await chai.request(app)
            .get("/service/risk/Risks?$filter=bp_ID eq '1234'")
            .auth("risk.manager@tester.sap.com:initial")
        response.should.have.status(200);
        response.body.value.should.be.an("array").to.have.lengthOf(1);
        autoRiskID = response.body.value[0]?.ID;
    });

    it("- Delete the new Risk", async () => {
        const response = await chai.request(app)
            .delete(`/service/risk/Risks(ID=${autoRiskID},IsActiveEntity=true)`)
            .auth("risk.manager@tester.sap.com:initial")
        response.should.have.status(204);
    });

});