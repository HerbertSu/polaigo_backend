const fs = require('fs');
const fetch = require('node-fetch');
const parseString = require('xml2js').parseString;
const {upsertQueryRaw} = require('../postgresql/psql');
const {ACCESS_ARRAY} = require('../../constants/constants');
const {dateify} = require('../dateify');

//TODO Should I insert/update the representatives_of_hr_active psql table
    //inside the for-loop of parseHRMemberDataObj, or save all of the parsed
    //objects in a list and insert them later as an individual list?
    //Check the options of knex's update()


/**
 * Fetches and writes xml data on the currently active representatives of HR.
 * @returns Filepath to the Member.xml data received from clerk.house.gov
 */
let fetchAndWriteRepresentativesData = async () => {
    let hrMemberDataXMLFileName = "";
    let xml = await fetch('http://clerk.house.gov/xml/lists/MemberData.xml')
    if(xml.status == 404){
        throw {
            status: 404,
            message: `Member data not found.`
        };
    };
    let data = await xml.text();
    let publishDate = "";
    parseString(data, {
            trim: true, 
            attrkey: 'attr',
        }, 
        function (err, result){
            publishDate = dateify(result.MemberData.attr["publish-date"]);
        }
    );
    
    hrMemberDataXMLFileName = `./test/HR-Representatives-Data-${publishDate}.txt`;

    if(!fs.existsSync(hrMemberDataXMLFileName)){
        fs.writeFile(hrMemberDataXMLFileName, data, err=>{
            if(err){
                console.log(err)
                throw err;
            };
        });
    };
    
    return hrMemberDataXMLFileName;
};


/**
 * Converts xml data of currently active representatives of HR into a JS object.
 * @param {string} xmlFilePath Path to a text document with xml data retrieved from clerk.house.gov/xml/lists/MemberData.xml. fetchAndWriteRepresentativesData() returns such a filepath.
 * @returns A JS object version of the member xml data.
 */
let convertHRMemberXMLToObj = (xmlFilePath) => {
    let xmlMemberData = fs.readFileSync(xmlFilePath);
    let memberObj = {};

    parseString(xmlMemberData, {
        trim: true, 
        attrkey: 'attr',
        charkey: 'content',
    }, 
    function (err, result){
        memberObj = result["MemberData"];
    })
    return memberObj;
}


/**
 * Returns the date of the member data retrieved from clerk.house.gov/xml/lists/MemberData.xml
 * @param {Object} representativesObj An object of the members of the House of Representatives. Such an object is returned from convertHRMemberXMLToObj().
 * @returns A date in the format of yyyy-mm-dd
 */
const getDateOfClerksMemberXML = (representativesObj) => {
    let dateOfMemberData = representativesObj.attr["publish-date"];
    return dateify(dateOfMemberData);
}


/**
 * For each active member returned from clerk.house.gov/xml/lists/MemberData.xml, parse out the desired information such as their bioguide ID, congressional district, name, etc.
 * If a member is vacant, then their bioguideid field will be marked vacant with 'VAC' + state + district.
 * @param {Object} representativesObj An object of the members of the House of Representatives. Such an object is returned from convertHRMemberXMLToObj().
 * @returns A list of objects. Each object contains information about an active representative of the HR: {bioguideid, priorcongress, state, party, firstname, lastname, middlename, district, dateoflastupdate : dateOfMemberData, }
 */
let parseHRMemberDataObj = (representativesObj) => {
    let HRMemberList = [];
    
    let representativesList = representativesObj.members[ACCESS_ARRAY].member;
    let dateOfMemberData = getDateOfClerksMemberXML(representativesObj);

    for(let index = 0; index < representativesList.length; index++){
        
        let district = representativesList[index].statedistrict[ACCESS_ARRAY];
        district = district.replace(/[^0-9]/g,'');

        let memberInfo = representativesList[index]["member-info"][ACCESS_ARRAY];

        let bioguideid = "";
        let party = "";

        let state = memberInfo.state[ACCESS_ARRAY].attr["postal-code"];
        if(memberInfo.footnote != undefined){
            bioguideid = `VAC${state}${district}`;
            party = "V";
        } else {
            bioguideid = memberInfo.bioguideID[ACCESS_ARRAY];
            party = memberInfo.party[ACCESS_ARRAY];
        }

        let firstname = memberInfo.firstname[ACCESS_ARRAY];
        let lastname = memberInfo.lastname[ACCESS_ARRAY];
        let middlename = memberInfo.middlename[ACCESS_ARRAY];
        let priorcongress = memberInfo["prior-congress"][ACCESS_ARRAY];
        
        
        HRMemberList.push({
            bioguideid,
            priorcongress,
            state,
            party,
            firstname,
            lastname,
            middlename,
            district,
            dateoflastupdate : dateOfMemberData,
        })
    }

    return HRMemberList;

}


/**
 * @todo INCOMPLETE
 * @param {*} HRMemberList 
 * @param {*} postgres 
 */
let compareActiveRepresentativesForUpdates = (HRMemberList, postgres) => {
    postgres.select()
            .table('representatives_of_hr_active')
            .orderBy(['state', {column: 'district', order: 'asc'}])
        .then(repsInTableList => {
            console.log(repsInTableList)
        })
}


/**
 * Compares the date of the received HR Member list with the one stored in the database.
 * @param {string} dateOfUpdate Date of said member data in yyyy-mm-dd form. Example input is the result of getDateOfClerksMemberXML().
 * @param {*} postgres 
 * @returns shouldUpdate: true if should update, false if shouldn't.
 */
let compareDatesOfLastHRMembersUpdate = async (dateOfUpdate, postgres) => {
    try{
        let date = await postgres.select("date").table("date_of_last_hr_members_update");
        let dateOfLastUpdate = dateify(date[ACCESS_ARRAY].date);
        
        let shouldUpdate = true;

        if(dateOfLastUpdate > dateOfUpdate){
            shouldUpdate = false;
            throw {
                status : 304,
                message : 'Date of new HR members list is older than the one currently stored.'
            };
        };
        return shouldUpdate;
    } 
    catch(err){
        console.error(err)
    };
    
};

//TODO instead of truncating representatives_of_hr_active table every time 
    //there's new member data, write a function that compares the new
    //data with the data in the table and change/update accordingly.
    //pseudo-code logic:
        //foreach item in HRMemberList - 
            //select from reps_of_hr_active table where bioguideid == bioguideid
            //if exists, update
            //else, insert
        //OR
        //select * from reps_of_hr_active;
        //compare HRMemberList with the returned data

/**
 * Given a list of active HR member data in the form of objects, this function truncates the 'representatives_of_hr_active' and 'date_of_last_hr_members_update' tables and updates both.
 * @todo Instead of truncating representatives_of_hr_active table every time there's new member data, write a function that compares the new data with the data in the table and change/update accordingly.
 * pseudo-code logic:
 * //foreach item in HRMemberList - 
 * select from reps_of_hr_active table where bioguideid == bioguideid
 * if exists, update
 * else, insert
 * OR
 * //select * from reps_of_hr_active;
 * compare HRMemberList with the returned data 
 * @param {Array} HRMemberList A list returned from parseHRMemberDataObj() containing a list of the current members of the HR retrieved from clerk.house.gov
 * @param {string} dateOfUpdate Date of said member data in yyyy-mm-dd form. Example input is the result of getDateOfClerksMemberXML().
 * @param {*} postgres 
 */
let updateRepresentativesActiveTable = (HRMemberList, dateOfUpdate, postgres, ) => {

    postgres.transaction( trx => {
        trx.table("representatives_of_hr_active")
            .truncate()
            .then( () => {
                return trx.insert(HRMemberList)
                    .into("representatives_of_hr_active")
                    .then(res =>{
                        console.log("representatives_of_hr_active table has been updated.");
                        return trx.table("date_of_last_hr_members_update")
                            .truncate()
                            .then( (res) => {
                                return trx.table("date_of_last_hr_members_update")
                                    .insert({
                                        date : dateOfUpdate
                                    })
                                    .then(res => {
                                        console.log("date_of_last_hr_members_update table has been updated.")
                                    })
                                    .catch(err=>{
                                        throw `Could not insert into date_of_last_hr_members_update table, ${err} `;
                                    })
                            })
                            .catch(err=>{
                                throw `Could not truncate date_of_last_hr_members_update table, ${err} `;
                            }) 
                    })
                    .catch(err => {
                        throw `Could not update representatives_of_hr_active table, ${err}`;
                    })                    
                })
        .then(trx.commit)        
        .catch( (err) => {
            console.log(err);
            trx.rollback;
        });
    });
};

/**
 * Creates new entries into vote_histories_hr_active with just the bioguideid filled out. A new entry is only created if the bioguideid does not already exist in vote_histories_hr_active.
 * @param {*} postgres 
 * @param {string} tableName Name of table we are inserting into. Here it is 'vote_histories_hr_active';
 * @param {string} columnName Name of the reference column we are using to see if the row/entry already exists. Here it is 'bioguideid';
 * @param {Array} bioIdGuideListFromSQL Empty array that will hold the bioguideid's in the representatives_of_hr_active table.
 */
const insertNewBioguideIDsIntoVoteHistoriesHRActive = async (postgres, tableName, columnName, bioIdGuideListFromSQL) => {
    await postgres.transaction( trx => {
        trx.select(columnName)
            .from("representatives_of_hr_active")
            .then(res => {
                bioIdGuideListFromSQL = res;
                let insertOnConflictQuery =  upsertQueryRaw(tableName, columnName, bioIdGuideListFromSQL);
                return trx.raw(insertOnConflictQuery);
                })
            .then(trx.commit)
            .catch(err=>{
                console.log(err);
                trx.rollback;
            });
    });
};


/**
 * Transfers inactive representatives' vote history from the vote_histories_hr_active table into vote_histories_hr_inactive.
 * @todo Left outer join the bioguideids from vote_histories_hr_active <-against-> representatives_of_hr_active 
 * @param {*} postgres 
 */
const transferInactivesFromVoteHistoriesHRActive = async(postgres) => {

};


/**
 * Updates the vote_histories_hr_active table by inserting new members.
 * @todo The current form of this function only ignores duplicates and adds any bioguideid's that aren't currently in the table. Also needs to add logic that removes old bioguideid's and move their data into vote_histories_hr_inactive if the 'date_of_last_hr_members_update' table's 'date' value is later than the representative's 'dateoflastupdate' column value in the 'representatives_of_hr_active' table.
 * @param {*} postgres 
 */
let updateVoteHistoriesActiveBioGuideIds = async (postgres) => {
    // Cases to consider:
        //1. Remove old bioguideids and move their data into vote_histories_hr_inactive 
            //if the 'date_of_last_hr_members_update' table's 'date' value is later than the representative's 
            //'dateoflastupdate' column value in the 'representatives_of_hr_active' table.

    let tableName = "vote_histories_hr_active";
    let columnName = "bioguideid";

    let bioIdGuideListFromSQL = [];
    
    await insertNewBioguideIDsIntoVoteHistoriesHRActive(postgres, tableName, columnName, bioIdGuideListFromSQL);
};

// let updateVoteHistoriesActiveBioGuideIds = (postgres) => {
//     let tableName = "vote_histories_hr_active";
//     let columnName = "bioguideid";

//     let bioIdGuideListFromSQL = [];
    
//     postgres.transaction( trx => {
//         trx.select("bioguideid")
//             .from("representatives_of_hr_active")
//             .then(res => {
//                 bioIdGuideListFromSQL = res;
//                 let insertOnConflictQuery =  upsertQueryRaw(tableName, columnName, bioIdGuideListFromSQL);
//                 return trx.raw(insertOnConflictQuery)                
//                 })
//             .then(trx.commit)
//             .catch(err=>{
//                 console.log(err);
//                 trx.rollback;
//             });
//     });
// };

module.exports = {
    fetchAndWriteRepresentativesData,
    convertHRMemberXMLToObj,
    parseHRMemberDataObj,
    updateRepresentativesActiveTable,
    compareActiveRepresentativesForUpdates,
    updateVoteHistoriesActiveBioGuideIds,
    getDateOfClerksMemberXML,
    compareDatesOfLastHRMembersUpdate
}

