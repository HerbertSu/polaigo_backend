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
    await fetch('http://clerk.house.gov/xml/lists/MemberData.xml')
        .then( xml => xml.text())
        .then( data => {
            let publishDate = "";
            parseString(data, {
                trim: true, 
                attrkey: 'attr',
            }, 
            function (err, result){
                publishDate = dateify(result.MemberData.attr["publish-date"]);
            })

            hrMemberDataXMLFileName = `./test/HR-Representatives-Data-${publishDate}.txt`;

            if(!fs.existsSync(hrMemberDataXMLFileName)){
                fs.writeFile(hrMemberDataXMLFileName, data, err=>{
                    if(err){
                        console.log(err)
                        throw err;
                    }
                })
            }
        })
    return hrMemberDataXMLFileName;
}


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

const getDateOfClerksMemberXML = (representativesObj) => {
    let dateOfMemberData = representativesObj.attr["publish-date"];
    return dateify(dateOfMemberData);
}


    
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

/*
-fetchAndWriteRepresentativesData() to get most up-to-date list of representatives.

*/

let compareActiveRepresentativesForUpdates = (HRMemberList, postgres) => {
    postgres.select()
            .table('representatives_of_hr_active')
            .orderBy(['state', {column: 'district', order: 'asc'}])
        .then(repsInTableList => {
            console.log(repsInTableList)
        })
}

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
 * 
 * @param {*} HRMemberList A list returned from parseHRMemberDataObj() containing a list of the current members of the HR retrieved from clerk.house.gov
 * @param {*} dateOfUpdate Date of said member data
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
        })
    })
}   


let updateVoteHistoriesActiveBioGuideIds = (postgres) => {
    let tableName = "vote_histories_hr_active";
    let columnName = "bioguideid";

    let bioIdGuideListFromSQL = [];
    
    postgres.transaction( trx => {
        trx.select("bioguideid")
            .from("representatives_of_hr_active")
            .then(res => {
                bioIdGuideListFromSQL = res;
                let insertOnConflictQuery =  upsertQueryRaw(tableName, columnName, bioIdGuideListFromSQL);
                return trx.raw(insertOnConflictQuery)                
                })
            .then(trx.commit)
            .catch(err=>{
                console.log(err);
                trx.rollback;
            })
            
        
    })
}

module.exports = {
    fetchAndWriteRepresentativesData,
    convertHRMemberXMLToObj,
    parseHRMemberDataObj,
    updateRepresentativesActiveTable,
    compareActiveRepresentativesForUpdates,
    updateVoteHistoriesActiveBioGuideIds,
    getDateOfClerksMemberXML,
}

