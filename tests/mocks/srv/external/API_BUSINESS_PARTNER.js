const cds = global.cds || require('@sap/cds')
module.exports = async srv => {
    
    const messaging = await cds.connect.to('messaging')
    // Mock events for s4
    srv.after("UPDATE", "A_BusinessPartner", async data => {
        const payload = {KEY: [{BUSINESSPARTNER: data.BusinessPartner}]};
        await messaging.emit("refapps/cpappems/abc/BO/BusinessPartner/Changed", payload);
        console.log('<< event emitted', payload);
    });

    srv.after("CREATE", "A_BusinessPartner", async data => {
        const payload = {KEY: [{BUSINESSPARTNER: data.BusinessPartner}]};
        await messaging.emit("refapps/cpappems/abc/BO/BusinessPartner/Created", payload);
        console.log('<< event emitted', payload);
    });
}