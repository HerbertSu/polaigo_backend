const fs = require('fs');
const fetch = require('node-fetch');
const parseString = require('xml2js').parseString;
const {ACCESS_ARRAY} = require('../../constants/constants');

//TODO Should I insert/update the representatives_of_hr_active psql table
    //inside the for-loop of parseHRMemberDataObj, or save all of the parsed
    //objects in a list and insert them later as an individual list?
    //Check the options of knex's update()

let fetchAndWriteRepresentativesData = () => {
    
    fetch('http://clerk.house.gov/xml/lists/MemberData.xml')
        .then( xml => xml.text())
        .then( data => {
            let publishDate = "";

            parseString(data, {
                trim: true, 
                attrkey: 'attr',
            }, 
            function (err, result){
                publishDate = result.MemberData.attr["publish-date"];
                publishDate = publishDate.replace(/,/g, '');
                publishDate = publishDate.split(" ").join("-");
            })

            let hrMemberDataXMLFileName = `./test/HR-Representatives-Data-${publishDate}.txt`;
            if(!fs.existsSync(hrMemberDataXMLFileName)){
                fs.writeFile(hrMemberDataXMLFileName, data, err=>{
                    if(err){
                        console.log(err)
                    }
                })
            }
        })
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


    
let parseHRMemberDataObj = (representativesObj) => {
    let HRMemberList = [];
    
    let representativesList = representativesObj.members[ACCESS_ARRAY].member;
    let dateOfMemberData = representativesObj.attr["publish-date"];

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
let updateRepresentativesActiveTable = (HRMemberList, postgres) => {
    postgres.transaction( trx => {
        trx.table("representatives_of_hr_active")
            .truncate()
            .then( () => {
                return trx.insert(HRMemberList)
                    .into("representatives_of_hr_active")
                    .then(res =>{
                        console.log("representatives_of_hr_active table has been updated.")
                    })
            })
        .then(trx.commit)        
        .catch( (err) => {
            console.log(err);
            trx.rollback;
        })
    })
}   

//@param columnListFromSQL is a list of a single column's {column : value} objects returned from a knex SELECT query
let upsertQueryRaw = (tableName, columnName, columnListFromSQL, conflict="", action="DO NOTHING" ) =>{
    let valuesList = columnListFromSQL.map((columnObj)=>{
        return "('" + Object.values(columnObj)[0] + "')";
    });
    let valuesString = valuesList.join(",")
    let upsert = `INSERT INTO ${tableName} (${columnName}) VALUES ${valuesString} ON CONFLICT ${conflict} ${action};`;
    return upsert;
}

let updateVoteHistoriesActiveBioGuideIds = (postgres) => {
    let tableName = "vote_histories_hr_active";
    let columnName = "bioguideid";

    let bioIdGuideListFromSQL = [];
    
    postgres.from("representatives_of_hr_active").select("bioguideid")
        .then(res => {
            bioIdGuideListFromSQL = res;
        })
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
}

