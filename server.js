const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const knex = require('knex');
const bcrypt = require('bcrypt');

const login = require('./controllers/login');
const hr = require('./controllers/hr');
const location = require('./controllers/location');

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


app.post('/createUser', async (request, response) => {
    const user = request.body;

    await bcrypt.hash(user.password, 0, (err, hash) => {
        postgres.transaction(trx => {
            trx.table("users")
                .returning("id")
                .insert({
                    username : user.username,
                    firstname : user.firstname,
                    lastname : user.lastname,
                    middlename : user.middlename,
                    email : user.email
                })
                .catch(error=> {
                    throw error;
                })
                .then((id) => {
                    return trx("hash")
                        .insert({
                            id : parseInt(id),
                            hash : hash
                        })
                        .catch(error => {
                            throw error;
                        });
                })
            .then(trx.commit)
            .then(()=>{
                response.send("New user has been created.");
            })
            .catch(err => {
                console.log(err);
                trx.rollback;
                response.status(500).send("Could not create new user.")
                throw err;
                
            });
        });
    });

})


app.post('/login', async (request, response) => await login.handleLogin(request, response, postgres, bcrypt));

app.post('/get-hr-rep-vote-history-active-full', async (request, response) => await hr.handleGetRepVoteHistory(request, response, postgres, ACCESS_ARRAY));

app.post('/get-representatives-from-location', async (request, response) => await location.handleGetRepFromLocation(request, response, postgres)); 
// app.post('/get-representatives-from-location', async (request, response) => {

//     try{
//         const {addressLine1, addressLine2, city, state, zipCode} = request.body;

//         let address = `${addressLine1} ${addressLine2}, ${city}, ${state} ${zipCode}`;
//         let district = await fetchCongressionalDistrictFromAddress(address);
//         let representative = await fetchRepresentativeGivenDistrict(district.state, district.districtNumber, postgres );

//         response.send(representative)

//     }catch(err){
//         response.status(404).send({
//             "error" : "Invalid address",
//             "message" : `Could not fetch representative for given address. Please check input address. ${err}`
//         });
//     };
// });

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
