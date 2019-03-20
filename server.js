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


app.post('/get-hr-rep-vote-history-active-full', async (request, response) => {
    const {bioguideid} = request.body;

    let isRepresentativeActive = await postgres("representatives_of_hr_active")
        .select("bioguideid")
        .where("bioguideid", bioguideid);
    
    if(isRepresentativeActive.length === 0 || isRepresentativeActive === undefined){
        response.status(404).send({
            "message" : `${bioguideid} is either inactive or contains incorrect syntax.`,
            "controller" : '/getHRRepVoteHistoryActiveFull'
        });
        return;
    };

    let repVoteHistory = await postgres("vote_histories_hr_active")
        .select("votinghistory")
        .where("bioguideid", bioguideid)
        .then(res => {
            return res[ACCESS_ARRAY];
        });

    let voteHistoryObject = Object.values(repVoteHistory)[ACCESS_ARRAY];
    let voteHistoryArray = Object.entries(voteHistoryObject).sort();

    let congressterm_session_roll_Array = [];

    for(let key in voteHistoryObject){
        let entries = key.split("_");
        let congressterm_session_roll = entries.map((element) => parseInt(element));
        
        congressterm_session_roll_Array.push(congressterm_session_roll);
    };

    let selectedRollCallVotes = await postgres("roll_call_votes_hr")
        .select(
            'congressterm',
            'session',
            'roll',
            'result',
            'date',
            'issue',
            'question'
        )
        .whereIn(['congressterm', 'session', 'roll'], congressterm_session_roll_Array)
        .orderByRaw('congressterm::int DESC, session::int DESC, roll::int DESC');

    let representativeVoteObjectArray = selectedRollCallVotes.map((rollCallObj) => {
        rollCallObj.roll = String(parseInt(rollCallObj.roll));

        if(rollCallObj.roll.length == 1){
            rollCallObj.roll = "00"+ rollCallObj.roll;
        }else if(rollCallObj.roll.length == 2){
            rollCallObj.roll = "0"+ rollCallObj.roll;
        }

        let congressterm_session_roll = `${rollCallObj.congressterm}_${rollCallObj.session}_${rollCallObj.roll}`; 

        let match = voteHistoryArray.find((congressterm_session_roll_AND_voted) => congressterm_session_roll_AND_voted[0] == congressterm_session_roll);

        return {
            ...rollCallObj,
            ...match[1]
        };
    });

    response.send(representativeVoteObjectArray)
})

app.post('/get-representatives-from-location', async (request, response) => {

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
