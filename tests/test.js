const chai = require('chai');
const chaiHttp = require('chai-http');
//const server = require('./server');
const config = require('./config');
let xsuaa_access_token;
let arr;
let businessspartner;
let riskid;
let bp;
let autoRiskID;
// Configure chai
chai.use(chaiHttp);
chai.should();




describe("get access token for xsuaa", () => {
    describe("Should Get access token for xsuaa", () => {
        it(" should fetch access token", (done) => {

            var req_headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
            chai.request(config.token_url)
                .post('/oauth/token').set(req_headers).send(config.xsuaa)
                .end((error, response) => {
                    try {
                        response.should.have.status(200);
                        xsuaa_access_token = response.body.access_token;
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
        });
    });
});

describe('Business partner read', () => {
    describe('Should get all  BusinessPartners', () => {
        it('+ should return a list of business partners', (done) => {
            chai.request(config.service_domain)
                .get('/service/risk/BusinessPartners').set('Authorization', 'bearer ' + xsuaa_access_token)
                .end((error, response) => {
                    try {
                        response.should.have.status(200);
                        response.body.value.should.be.an('array');
                        businessspartner = response.body.value[0].ID;
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
        });
    });
});


describe("Post Risk and activate", () => {

    it(" Should Post RISK data in draft", (done) => {
        let risk = {
            title: "Shipment violating export control",
            prio: "1",
            descr: "Violation of export and trade control with unauthorized downloads",
            impact: 200000,
            status_value:"NEW",
            bp_ID: businessspartner

        }
        chai.request(config.service_domain)
            .post('/service/risk/Risks').send(risk).set('Authorization', 'bearer ' + xsuaa_access_token)
            .end((error, response) => {
                try {
                    response.should.have.status(201);
                    //console.log(response.body);


                    response.body.should.be.a('object');
                    riskid = response.body.ID;
                    done();
                } catch (err) {
                    done(err);
                }
            });
    })

    it(" Should get risk data", (done) => {

        chai.request(config.service_domain)
            .get('/service/risk/Risks(ID=' + riskid + ',IsActiveEntity=false)').set('Authorization', 'bearer ' + xsuaa_access_token)
            .end((error, response) => {
                try {
                    response.should.have.status(200);
                    //console.log(response.body);                  
                    //chai.assert.strictEqual(response.body.ID, riskid);
                    done();
                } catch (err) {
                    done(err);
                }
            });
    })


  


    it('should Prepare the draft with Side effects Qualifier', (done) => {

        let url = '/service/risk/Risks(ID=' + riskid + ',IsActiveEntity=false)/RiskService.draftPrepare';
        chai.request(config.service_domain)
            .post(url)
            .set('Authorization', 'bearer ' + xsuaa_access_token)
            .send({ "SideEffectsQualifier": "" })
            .end((error, response) => {
                try {
                    response.should.have.status(200);
                    //console.log(response.body);
                    done();
                } catch (err) {
                    done(err);
                }
            });
    });


    it('Should Activate the draft to save and mark isActiveEntity=true', (done) => {

        let url = '/service/risk/Risks(ID=' + riskid + ',IsActiveEntity=false)/RiskService.draftActivate';
        chai.request(config.service_domain)
            .post(url)
            .set('Authorization', 'bearer ' + xsuaa_access_token)
            .send({ PreserveChanges: true })
            .end((error, response) => {
                try {
                    response.should.have.status(201);
                    //console.log(response.body);
                    done();
                } catch (err) {
                    done(err);
                }
            });
    });


    it(" Should get risk data to check activation", (done) => {

        chai.request(config.service_domain)
            .get('/service/risk/Risks(ID=' + riskid + ',IsActiveEntity=true)').set('Authorization', 'bearer ' + xsuaa_access_token)
            .end((error, response) => {
                try {
                    response.should.have.status(200);
                    //console.log(response.body);        
                    var isactive = response.body.IsActiveEntity;
                    // chai.assert.strictEqual(isactive, true);
                    done();
                } catch (err) {
                    done(err);
                }
            });
    })

        it('should Delete risk if already present', (done) => {

        let url = '/service/risk/Risks(ID=' + riskid + ',IsActiveEntity=true)';
        chai.request(config.service_domain)
            .delete(url)
            .set('Authorization', 'bearer ' + xsuaa_access_token)
            .end((error, response) => {
                try {
                   response.should.have.status(204)  ;
                    //console.log(response.body);
                    done();
                } catch (err) {
                    done(err);
                }
            });
    });




});




describe("Should create  risk automatically", () => {

    it('create business partner with industry system type', (done) => {

        bp = Date.now().toString().slice(8,12);
        let businesspartner = {
            BusinessPartner: bp,
            IndustrySector: "73",
            IndustrySystemType: "xxx"
        }

        chai.request(config.mock_service_domain)
            .post('/api-business-partner/A_BuPaIndustry').send(businesspartner)
            .end((error, response) => {
                try {
                    response.should.have.status(201);
                    //console.log(response.body);


                    response.body.should.be.a('object');
                    businesspartner = response.body.BusinessPartner;
                    done();
                } catch (err) {
                    done(err);
                }
            });



    })

    it('create business partner', (done) => {
        let businesspartner = {
            BusinessPartner: bp
        }
        chai.request(config.mock_service_domain)
            .post('/api-business-partner/A_BusinessPartner').send(businesspartner)
            .end((error, response) => {
                try {
                    response.should.have.status(201);
                    //console.log(response.body);


                    response.body.should.be.a('object');
                    bp = response.body.BusinessPartner;
                    setTimeout(() => {
                        done();
                    }, 1000);
                    // done();
                } catch (err) {
                    done(err);
                }

            });
    })

    it(" Should get risk data", (done) => {

        chai.request(config.service_domain)
            .get('/service/risk/Risks?$filter=bp_ID eq \'' + bp + '\'').set('Authorization', 'bearer ' + xsuaa_access_token)
            .end((error, response) => {
                try {
                    response.should.have.status(200);
                    //console.log(response.body);

                    const {value} = response.body;
                    // console.log("Response body Risk ", response.body);
                    console.log(value[0]);
                    autoRiskID = value[0].ID;
                    chai.expect(value[0].bp_ID).to.equal(bp);
                    done();
                } catch (err) {
                    done(err);
                }

            });
    })


})

describe("Should Update the Risk with impact - Draft Choregraphy !", () => {

    it('Should enable draft for Risk', (done) => {
        let url = `/service/risk/Risks(ID=${autoRiskID},IsActiveEntity=true)/RiskService.draftEdit?$select=HasActiveEntity,HasDraftEntity,ID,IsActiveEntity,bp_ID,criticality,descr,impact,miti_ID,prio,status_value,title&$expand=DraftAdministrativeData($select=DraftUUID,InProcessByUser),bp($select=ID,businessPartnerFullName,businessPartnerIsBlocked,industry,searchTerm1),miti($select=ID,IsActiveEntity,description),status($select=criticality,value)`
        chai.request(config.service_domain)
            .post(url)
            .set('Authorization', 'bearer ' + xsuaa_access_token)
            .send({"PreserveChanges":true})
            .end((error, response) => {
                try {
                    response.should.have.status(201);
                    done();
                } catch (err) {
                    done(err);
                }
            });
    });

    it('Should patch the priority 1 and impact 100000 for Risk', (done) => {
        let url = `/service/risk/Risks(ID=${autoRiskID},IsActiveEntity=false)`
        chai.request(config.service_domain)
            .patch(url)
            .set('Authorization', 'bearer ' + xsuaa_access_token)
            .send({"prio": "1","impact": 100000})
            .end((error, response) => {
                try {
                    response.should.have.status(200);
                    done();
                } catch (err) {
                    done(err);
                }
            });
    });

    it('Should Qualify the side effects of Risk in draft', (done) => {
        let url = `/service/risk/Risks(ID=${autoRiskID},IsActiveEntity=false)/RiskService.draftPrepare`
        chai.request(config.service_domain)
            .post(url)
            .set('Authorization', 'bearer ' + xsuaa_access_token)
            .send({"SideEffectsQualifier":""})
            .end((error, response) => {
                try {
                    response.should.have.status(200);
                    done();
                } catch (err) {
                    done(err);
                }
            });
    });

    it('Should activate the draft for Risks', (done) => {
        let url = `/service/risk/Risks(ID=${autoRiskID},IsActiveEntity=false)/RiskService.draftActivate?$select=HasActiveEntity,HasDraftEntity,ID,IsActiveEntity,bp_ID,criticality,descr,impact,miti_ID,prio,status_value,title&$expand=DraftAdministrativeData($select=DraftUUID,InProcessByUser),bp($select=ID,businessPartnerFullName,businessPartnerIsBlocked,industry,searchTerm1),miti($select=ID,IsActiveEntity,description),status($select=criticality,value)`
        chai.request(config.service_domain)
            .post(url)
            .set('Authorization', 'bearer ' + xsuaa_access_token)
            .send({})
            .end((error, response) => {
                try {
                    response.should.have.status(201);
                    setTimeout(() => {
                        done();
                    }, 1000);
                    // done();
                } catch (err) {
                    done(err);
                }
            });
    });
});

describe("Should check for the Central block and search Term", (done) => {

    it('Should central block be enabled', (done) => {
        let url = `/service/risk/Risks(ID=${autoRiskID},IsActiveEntity=true)?$expand=bp($select=ID,businessPartnerFullName,businessPartnerIsBlocked,searchTerm1)`
        chai.request(config.service_domain)
            .get(url)
            .set('Authorization', 'bearer ' + xsuaa_access_token)
            .end((error, response) => {
                try {
                    response.should.have.status(200);
                    const value = response.body;
                    console.log("blocked risk ", value);
                    chai.expect(value.bp.businessPartnerIsBlocked).to.equal(true);
                    chai.expect(value.bp.searchTerm1).to.equal("Very High Risk");
                    done();
                } catch (err) {
                    done(err);
                }
            });
    })
});



describe("Should Update business partners and check risk", () => {

    it('Should update business partner', (done) => {

        // let url = '/api-business-partner/A_BusinessPartner(\'' + bp + '\'' + ')';
        let url = `/api-business-partner/A_BusinessPartner('${bp}')`;
        chai.request(config.mock_service_domain)
            .patch(url).send({ SearchTerm1: "mitigated", BusinessPartnerIsBlocked: false })
            .end((error, response) => {
                try {
                    response.should.have.status(200);
                    setTimeout(() => {
                        done();
                    }, 1000);
                    // done();
                   
                } catch (err) {
                    done(err);
                }
            });

    })



    it('Should check whether the risk has updated', (done) => {
        chai.request(config.service_domain)
            .get(`/service/risk/Risks(ID=${autoRiskID},IsActiveEntity=true)?$expand=bp($select=ID,businessPartnerFullName,businessPartnerIsBlocked,searchTerm1)`).set('Authorization', 'bearer ' + xsuaa_access_token)
            .end((error, response) => {
                try {
                    response.should.have.status(200);

                    let { searchTerm1, businessPartnerIsBlocked } = response.body.bp;
                    chai.expect(searchTerm1).to.equal("mitigated")
                    chai.expect(businessPartnerIsBlocked).to.equal(false)
                    done();
                } catch (err) {
                    done(err);
                }
            });

    })


})


describe('Read Mitigations', () => {
    describe('Should Get all Mitigations', () => {
        it('+ should return a list of mitigations', (done) => {
            chai.request(config.service_domain)
                .get('/service/risk/Mitigations')
                .set('Authorization', 'bearer ' + xsuaa_access_token)
                .end((error, response) => {
                    try {
                        response.should.have.status(200);
                        //console.log(response.body);
                        // response.body.value.should.be.an('array').to.have.lengthOf(4);
                        done();
                    } catch (err) {
                        done(err);
                    }
                });
        });
    });
});




