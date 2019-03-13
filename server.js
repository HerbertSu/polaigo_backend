const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const knex = require('knex');

const {
    convertHRMemberXMLToObj, 
    parseHRMemberDataObj,
    updateRepresentativesActiveTable,
    updateVoteHistoriesActiveBioGuideIds,
    fetchAndWriteRepresentativesData,
    getDateOfClerksMemberXML,
    } = require('./scripts/HR/HR');
const {fetchRepresentativeGivenDistrict} = require('./scripts/postgresql/psql');
const {fetchCongressionalDistrictFromAddress} = require('./scripts/API/GoogleCivicInfo');
const {dateify} = require('./scripts/dateify');
const {fetchAndUpdateDBGivenDate} = require('./scripts/fetchAndUpdateDBGivenDate');

const app = express(); 

app.use(cors());
app.use(bodyParser());

const PORT = 3000;

const postgres = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: 'password',
        database: 'polaigo_test'
    }
});

app.post('/getRepresentativesFromLocation', async (request, response) => {

    try{
        const {addressLine1, addressLine2, city, state, zipCode} = request.body;

        let address = `${addressLine1} ${addressLine2}, ${city}, ${state} ${zipCode}`;
        let district = await fetchCongressionalDistrictFromAddress(address);
        let representative = await fetchRepresentativeGivenDistrict(district.state, district.districtNumber, postgres );

        response.send(representative)

    }catch(err){

        response.status(404).send({
            "error" : err,
            "message" : "Could not fetch representative for given address. Please check input address"
        });
    }
    
})

//***** For populating representatives_of_hr_active table
// ( async () => {
//     let xmlFilePath = await fetchAndWriteRepresentativesData();
//     let representativesObj = convertHRMemberXMLToObj(xmlFilePath);
//     let dateOfMemberData = getDateOfClerksMemberXML(representativesObj);
//     let HRMemberList = parseHRMemberDataObj(representativesObj);
//     updateRepresentativesActiveTable(HRMemberList, dateOfMemberData, postgres);
// })();
//*****


//***** For Updating the vote history bioguideids 
// updateVoteHistoriesActiveBioGuideIds(postgres);
//*****

//***** For fetching a representative's information given an address
// (async () => {
//     let district = await fetchCongressionalDistrictFromAddress("50 north illinois street Indianapolis Indiana 46204");
//     console.log(district);
//     let representative = await fetchRepresentativeGivenDistrict(district.state, district.districtNumber, postgres );
//     console.log(representative);
// })()
//*****

//***** For updating tables with new data given a date
// (async ()=> {
//     console.log( await fetchAndUpdateDBGivenDate("Dec 21, 2018", postgres));
// })()
//***** 



app.listen(PORT, ()=> {
    console.log(`App is running on port ${PORT}.`);
  });
