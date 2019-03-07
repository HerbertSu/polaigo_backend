const express = require('express');
const app = express();
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

const knex = require('knex');

const postgres = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: 'password',
        database: 'polaigo_test'
    }
});


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











