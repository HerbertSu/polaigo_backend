const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const knex = require('knex');
const bcrypt = require('bcrypt');

const login = require('./controllers/login');
const hr = require('./controllers/hr');
const location = require('./controllers/location');
const userMainetenance = require('./controllers/userMaintenance');
const admin = require('./controllers/admin');

const {
    convertHRMemberXMLToObj, 
    parseHRMemberDataObj,
    updateRepresentativesActiveTable,
    updateVoteHistoriesActiveBioGuideIds,
    fetchAndWriteRepresentativesData,
    getDateOfClerksMemberXML,
    } = require('./scripts/HR/HR');
const {dateify} = require('./scripts/dateify');
const {fetchAndUpdateDBGivenDate} = require('./scripts/fetchAndUpdateDBGivenDate');

const {ACCESS_ARRAY} = require('./constants/constants');

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


app.post('/createUser', async (request, response) => await userMainetenance.handleCreateUser(request, response, postgres, bcrypt));

app.post('/login', async (request, response) => await login.handleLogin(request, response, postgres, bcrypt));

app.post('/get-hr-rep-vote-history-active-full', async (request, response) => await hr.handleGetRepVoteHistory(request, response, postgres, ACCESS_ARRAY));

app.post('/get-representatives-from-location', async (request, response) => await location.handleGetRepFromLocation(request, response, postgres)); 

app.post('/get-and-update-db-given-date', async (request, response) => await admin.handleUpdateDBGivenDate(request, response, postgres));

//Check logic of updateRepresentativesActiveTable()
//***** For populating representatives_of_hr_active table
( async () => {
    let xmlFilePath = await fetchAndWriteRepresentativesData();
    let representativesObj = convertHRMemberXMLToObj(xmlFilePath);
    let dateOfMemberData = getDateOfClerksMemberXML(representativesObj);
    let HRMemberList = parseHRMemberDataObj(representativesObj);
    // updateRepresentativesActiveTable(HRMemberList, dateOfMemberData, postgres);
})();
//*****


//***** For Updating the vote history bioguideids 
// updateVoteHistoriesActiveBioGuideIds(postgres);
//*****


//***** For updating tables with new data given a date
// (async ()=> {
//     console.log( await fetchAndUpdateDBGivenDate("Dec 22, 2018", postgres));
// })()
//***** 



app.listen(PORT, ()=> {
    console.log(`App is running on port ${PORT}.`);
  });
