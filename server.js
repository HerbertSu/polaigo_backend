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
    compareDatesOfLastHRMembersUpdate,
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


//***** For updating representatives_of_hr_active table, date_of_last_hr_members_update, vote_histories_hr_active, and vote_histories_hr_inactive. 
    //Will check HR clerk's website for new members.
    //If date of update is more recent than the one currently stored in date_of_last_hr_members_update, the update will commence.
    //Inserts any new representatives into vote_histories_hr_active.
    //Copies over vote histories of any inactive representatives from vote_histories_hr_active to vote_histories_hr_inactive.
    //TODO:
        //Include a case for if a rep who was inactive becomes active again?
// ( async () => {
//     try{
//         let xmlFilePath = await fetchAndWriteRepresentativesData();
//         let representativesObj = convertHRMemberXMLToObj(xmlFilePath);
//         let dateOfMemberData = getDateOfClerksMemberXML(representativesObj);
//         let HRMemberList = parseHRMemberDataObj(representativesObj);
//         let shouldUpdate = await compareDatesOfLastHRMembersUpdate(dateOfMemberData, postgres);
//         if(shouldUpdate){
//             await updateRepresentativesActiveTable(HRMemberList, dateOfMemberData, postgres);
//             await updateVoteHistoriesActiveBioGuideIds(postgres);
//             console.log('Updates complete.')
//         };    
//     }catch(err){
//         console.log(err);
//     };
// })();
//*****


//***** For Updating the vote history bioguideids 
// (async () => {
//     await updateVoteHistoriesActiveBioGuideIds(postgres);
// })()
//*****


//***** For updating tables with new data given a date
// (async ()=> {
//     console.log( await fetchAndUpdateDBGivenDate("Dec 22, 2018", postgres));
// })()
//***** 



app.listen(PORT, ()=> {
    console.log(`App is running on port ${PORT}.`);
  });
