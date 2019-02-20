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
        let memberInfo = representativesList[index]["member-info"][ACCESS_ARRAY];

        let bioguideid = "";
        if(memberInfo.footnote != undefined){
            bioguideid = `VAC${district}`;
        } else {
            bioguideid = memberInfo.bioguideID[ACCESS_ARRAY];
        }

        let firstname = memberInfo.firstname[ACCESS_ARRAY];
        let lastname = memberInfo.lastname[ACCESS_ARRAY];
        let middlename = memberInfo.middlename[ACCESS_ARRAY];
        let priorcongress = memberInfo["prior-congress"][ACCESS_ARRAY];
        let state = memberInfo.state[ACCESS_ARRAY].attr["postal-code"];
        let party = memberInfo.party[ACCESS_ARRAY];
        
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




let updateRepresentativesActiveTable = (HRMemberList, postgres) => {
    //select from reps_of_hr_active table where bioguideid == bioguideid
    //if exists, update
    //else, insert
    postgres.transaction( trx => {
        trx.insert(HRMemberList)
        .into("representatives_of_hr_active")
        .then(res =>{
            console.log("inserted")
        })
        .catch( (err) => {
            console.log(err);
        })
    })

}   


module.exports = {
    fetchAndWriteRepresentativesData,
    convertHRMemberXMLToObj,
    parseHRMemberDataObj,
    updateRepresentativesActiveTable,
}

