const fs = require('fs');
const fetch = require('node-fetch');
const parseString = require('xml2js').parseString;


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


let representativesObj = convertHRMemberXMLToObj('./test/HR-Representatives-Data-February-11-2019.txt');
const ACCESS_ARRAY = 0;




    
let parseHRMemberDataObj = (representativesObj) => {
    
    let representativesList = representativesObj.members[ACCESS_ARRAY].member;
    let dateOfMemberData = representativesObj.attr["publish-date"];

    for(let index = 0; index < representativesList.length; index++){
        
        let district = representativesList[index].statedistrict[ACCESS_ARRAY];
        let memberInfo = representativesList[index]["member-info"][ACCESS_ARRAY];

        let bioGuideId = "";
        if(memberInfo.footnote != undefined){
            bioGuideId = `VAC${district}`;
        } else {
            bioGuideId = memberInfo.bioguideID[ACCESS_ARRAY];
        }

        let firstName = memberInfo.firstname[ACCESS_ARRAY];
        let lastName = memberInfo.lastname[ACCESS_ARRAY];
        let middleName = memberInfo.middlename[ACCESS_ARRAY];
        let priorCongress = memberInfo["prior-congress"][ACCESS_ARRAY];
        let state = memberInfo.state[ACCESS_ARRAY].attr["postal-code"];
        let party = memberInfo.party[ACCESS_ARRAY];

    }

}

parseHRMemberDataObj(representativesObj)

