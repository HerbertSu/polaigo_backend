const fetch = require('node-fetch');
const express = require('express');
const parseString = require('xml2js').parseString;
const fs = require('fs');
const util = require('util');
const app = express();

const jsdom = require('jsdom');
const {JSDOM} = jsdom;


// app.get("https://api.govinfo.gov/packages/CREC-2018-12-21/mods?api_key=UPY9jQU6CVq80XXWXWoDZzQ7JTm29GsvdJzACahT", (req, res) => {
//     res.send("hello")
// })

// let date = "2018-12-21"

// fetch(`https://api.govinfo.gov/packages/CREC-${date}/mods?api_key=DEMO_KEY`)
//     .then(res => res.text())
//     .then(fullCR => {
//         // let jsCR = parseString(fullCR, (err, result)=>{
//         //     console.log(result)
//         // })
//         fs.writeFile("./test/CREC-2018-12-21.txt", fullCR, err=>{
//             if(err){
//                 console.log(err)
//             }
//         })
//     })

let xmlCR = fs.readFileSync("./test/CREC-2018-12-21.txt").toString();

//The base result of parsing CREC is an object of size 1 with key "mods".
//Object.keys(result.mods)) returns an array of the unique keys of the keys in the object that is the value to "mods"


async function parseCRECForDailyDigest(relatedItems, relatedObjects, dailyDigestIDs, markedRelatedItems){
    //Grabbing the items the daily digest items from the cumulative CREC and
        //storing them in arrays
    console.log("parse running")

    if(relatedItems.length > 0){
        for(let j = 0; j < relatedObjects.length; j++){
            if(relatedObjects[j].attr.ID.includes("PgD") ){
                let includes = false;
                for(let z = 0; z < dailyDigestIDs.length; z++){
                    if(relatedObjects[j].attr.ID.includes(dailyDigestIDs[z])){
                        includes = true;
                        break;
                    }
                }
                if(includes === false){
                    dailyDigestIDs.push(relatedObjects[j].attr.ID);
                    markedRelatedItems.push(relatedObjects[j]);
                }
            }
        }
    }

    if(dailyDigestIDs.length > 0 && markedRelatedItems.length > 0){
        return [dailyDigestIDs, markedRelatedItems];
    }
}



async function parseDailyDigestForLinks(markedRelatedItems){
    //Retrieving the html links for all of the daily digest pages referrenced
    let dailyDigestHTMLLinks = [];
    markedRelatedItems.forEach( dailyDigestObject => {
        let relatedItemsArray = dailyDigestObject.relatedItem;
        

        for(let i = 0; i < relatedItemsArray.length; i++){
            if(relatedItemsArray[i].attr.type == "otherFormat"){
                
                if(relatedItemsArray[i].attr['xlink:href'].includes("html")){
                    dailyDigestHTMLLinks.push(relatedItemsArray[i].attr['xlink:href'])
                }
            }
        }
    })

    return dailyDigestHTMLLinks;
}


async function fetchDailyDigests(dailyDigestHTMLLinks){
    //Visit each link and see if it contains NEW PUBLIC LAWS, what the HR voted, 
        //what the HR passed, what the HR failed to pass, what the Senate passed,
        //what the Senate failed to pass
    dailyDigestHTMLLinks.forEach((link)=>{
        fetch(link)
            .then(res => res.text())
            .then(dailyDigest => {
                console.log(dailyDigest)
                let urlParameters = link.split("/");
                    let newLawsFileName = "";
                    for(let parameter = 0; parameter < urlParameters.length; parameter++){
                        if(urlParameters[parameter].includes("PgD")){
                            newLawsFileName = urlParameters[parameter];
                        }
                    }
                
                if(dailyDigest.includes("NEW PUBLIC LAWS") 
                    || dailyDigest.includes("House of Representatives")
                    || dailyDigest.includes("Senate")){

                    fs.writeFile(`./test/${newLawsFileName}`, dailyDigest, err=>{
                        if(err){
                            console.log(err) 
                        } 
                    })
                }
            })

    })
}


parseString(xmlCR, {
        trim: true, 
        attrkey: 'attr',
    }, 
    function (err, result){
        let mods = result.mods;
        let modsKeys = Object.keys(mods);
        let modsValues = Object.values(mods);
        let modsEntries = Object.entries(mods);
        // let relatedItems = modsEntries[15]; // pick out related items
        let relatedItems = [];
        let relatedObjects = [];
        let markedRelatedItems = [];
        let dailyDigestIDs = [];
        let dailyDigestHTMLLinks = [];
        

        for(let i = 0; i < modsEntries.length; i++){
            if(modsEntries[i][0] === 'relatedItem'){
                relatedItems = modsEntries[i];
                relatedObjects = relatedItems[1];
                break;
            }
        }
        
        //-----------------------Uncomment to fetch daily digests---------------
        // parseCRECForDailyDigest(relatedItems, relatedObjects, dailyDigestIDs, markedRelatedItems)
        //     .then(res=>{
        //         dailyDigestIDs = res[0];
        //         markedRelatedItems = res[1];
        //         return;
        //     })        

        // parseDailyDigestForLinks(markedRelatedItems)
        //     .then(res=>{
        //         dailyDigestHTMLLinks = res;
        //         fetchDailyDigests(dailyDigestHTMLLinks);
        //     });
        
        // let newLawsDailyDigest = fs.readFileSync("./test/CREC-2018-12-21-pt1-PgD1317.htm").toString();
        // let senateDailyDigest = fs.readFileSync("./test/CREC-2018-12-21-pt1-PgD1313.htm").toString();
        let hrDailyDigest = fs.readFileSync("./test/CREC-2018-12-21-pt1-PgD1314.htm").toString();
        const dom = new JSDOM(hrDailyDigest);
        
        let body = dom.window.document.querySelector("pre").textContent;
        
        let hrDailyDigestItems = body.split('  ');
        let paragraphs = hrDailyDigestItems.filter(item => item.length > 0);
        

        //Some elements of the paragraphs at this point may have pages that are connected
            //to the beginning of new messages separated only by a newline character
        for(let i = 0; i < paragraphs.length; i++){
            if(paragraphs[i].slice(0,4) == "Page"){
                //Separate the page numbers (eg. H12345-67) from any tagalongs 
                paragraphs[i] = paragraphs[i].split("\n");
                //Join the remaining entries such they are full paragraphs in a single string
                let remainder = paragraphs[i].slice(1, paragraphs[i].length - 1);
                remainder = remainder.filter(item => item.length > 0);
                remainder = remainder.join(" "); 
                paragraphs[i] = [paragraphs[i][0], remainder];

            }else{
                //Clean regular paragraphs of the newline character
                paragraphs[i] = paragraphs[i].split("\n");
                
                paragraphs[i] = paragraphs[i].join(" "); 
            }
        }

        let indicator = true;
        let i = 0;
        while(indicator){
            if(Array.isArray(paragraphs[i])){
                paragraphs.splice(i + 1, 0, paragraphs[i][1]);
                paragraphs[i] = paragraphs[i][0];
                i++;
            }
            i++;
            if(i > paragraphs.length){
                indicator = false;
            }
        }
        paragraphs = paragraphs.filter(item => item.length > 0);

        const HR_DAILY_DIGEST_TAGS = {
            publicBills : "Public Bills and Resolutions Introduced", 
            coSponsors : "Additional Cosponsors",
            reports : "Reports Filed",
            journal : "Journal",
            passedMeasures : "Suspensions: The House agreed",
            failedMeasures: "Suspension: The House failed",
            orderBusiness : "Order of Business",
            recess : "Recess",
            senateReferral : "Senate Referral", 
            senateMessage : "Senate Message",
            quorumCallsVotes : "Quorum Calls--Votes",
            adjournment : "Adjournment",
            nextMeeting : "Motion to Fix Next Convening Time"
        };

        let hrDailyDigestObject = {};

        let hrDailyDigestEntries = Object.entries(HR_DAILY_DIGEST_TAGS);
        
        let currentTag = "";

        paragraphs.forEach((element) => {
            
            for(let i = 0; i < hrDailyDigestEntries.length; i++){
                if(element.includes(hrDailyDigestEntries[i][1])){
                    currentTag = hrDailyDigestEntries[i][0];
                    if(hrDailyDigestObject[hrDailyDigestEntries[i][0]] == undefined){

                        hrDailyDigestObject[hrDailyDigestEntries[i][0]] = [];
                        console.log("PRINTING", hrDailyDigestObject)
                    }
                    break;
                }
            }
            if(currentTag.length > 0){
                hrDailyDigestObject[currentTag].push(element);
            }
        });
        
        console.log(hrDailyDigestObject)

        //     // if(element.includes(HR_DAILY_DIGEST_TAGS.passedMeasures)){
        //     //     if(hrDailyDigestObject["passedMeasures"] !== undefined){
        //     //         hrDailyDigestObject["passedMeasures"] = hrDailyDigestObject["passedMeasures"] + element;
                    
        //     //     }else{
        //     //         hrDailyDigestObject["passedMeasures"] = element;
                    
        //     //     }
        //     // }else if(element.includes(HR_DAILY_DIGEST_TAGS.failedMeasures)){
        //     //     if(hrDailyDigestObject["failedMeasures"] !== undefined){
        //     //         hrDailyDigestObject["failedMeasures"] = hrDailyDigestObject["failedMeasures"] + element;
                    
        //     //     }else{
        //     //         hrDailyDigestObject["failedMeasures"] = element;
                    
        //     //     }
        //     // } else {
                
        //     // }
        // })

        // console.log(hrDailyDigestObject)

        /*
        House of Representative Daily Digest Possible Items
            Public Bills and Resolutions Introduced: 
            Additional Cosponsors:
            Reports Filed: 
            Journal: 
            Suspensions:
            Order of Business:
            Recess: 
            Senate Referral:    
            Senate Message: 
            Quorum Calls--Votes:
            Adjournment:
        */
        

        // console.log("-------------------------------THE RESULT----------------------------\n",
        //     "digestIDs ",dailyDigestIDs,
        //     "\nrelatedItems objects", markedRelatedItems)
        
        // console.log("-------------------------------THE RESULT----------------------------\n",
        // // relatedItems[1][2].attr
        // // relatedItems[1].length
        // relatedItems
        // );
        
        ////-----------Uncomment to get the congVote of the Lincoln room item ---------------------------------
        // let lincolnSpeech = 0;
        // let lincolnVote = 0;
        // //TODO Find a way to identify the vote records. Example of relatedItem that includes the votes is
        //     //relatedItems[1][68] for 12/21/2018 CREC
        // for( let i = 0; i < relatedItems[1].length; i++){
        //     if(String(relatedItems[1][i].attr.ID) == "id-CREC-2018-12-21-pt1-PgH10514-2"){
        //         console.log("Found speech");
        //         lincolnSpeech = i;
        //     }else if(String(relatedItems[1][i].attr.ID) == "id-CREC-2018-12-21-pt1-PgH10532"){
        //         console.log("Found vote");
        //         lincolnVote = i;
        //         break;
        //     }
        //     //find out how each item/title in the pdf is sectioned off
        //     // console.log(`${i}, ${util.inspect(relatedItems[1][i],false, null)}`)
        // }

        // console.log("-------------------------------THE RESULT----------------------------\n",
        //     relatedItems[1][lincolnVote])
        ////---------------------------------------------------------------------------------------------------
        

    // console.dir(Object.keys(result.mods))
    // console.log(Object.values(result.mods)[15])
    // console.log(util.inspect(Object.values(result.mods)[15][4], false, null))
})

// var xml = "<root>Hello xml2js!</root>"
// parseString(xml, function (err, result) {
//     console.dir(result);
// });

app.listen(3000);