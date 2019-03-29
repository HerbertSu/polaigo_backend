const fs = require('fs');
const fetch = require('node-fetch');
const {HR_DAILY_DIGEST_TAGS} = require('../../constants/constants');

//Writes the Daily Digest html files into the test folder. TODO Perhaps change to 'records' folder
//Visit each PgD link parsed from CREC and see if it contains NEW PUBLIC LAWS, what the HR voted, 
    //what the HR passed, what the HR failed to pass, what the Senate passed,
    //what the Senate failed to pass.
const downloadDailyDigests = (dailyDigestHTMLLinks) => {
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

//Some elements of the paragraphs at this point may have pages that are connected
    //to the beginning of new messages separated only by a newline character.
    //This function cleans the newline character and flattens out so that the resulting
    //array is only an array of strings.
const cleanHRDailyDigest = (hrDailyDigestParagraphs) => {
    for(let i = 0; i < hrDailyDigestParagraphs.length; i++){
        if(hrDailyDigestParagraphs[i].slice(0,4) == "Page"){
            //Separate the page numbers (eg. H12345-67) from any tagalongs 
            hrDailyDigestParagraphs[i] = hrDailyDigestParagraphs[i].split("\n");
            //Join the remaining entries such they are full paragraphs in a single string
            let remainder = hrDailyDigestParagraphs[i].slice(1, hrDailyDigestParagraphs[i].length - 1);
            //Clean empty items and digest page entries (eg [[D1234]])
            remainder = remainder.filter(item => item.length > 0 && !/^\[\[/.test(item) && !/\]\]$/.test(item));
            remainder = remainder.join(" "); 
            hrDailyDigestParagraphs[i] = [hrDailyDigestParagraphs[i][0], remainder];

        }else{
            //Clean regular paragraphs of the newline character
            hrDailyDigestParagraphs[i] = hrDailyDigestParagraphs[i].split("\n");
            //Clean empty items and digest page entries (eg [[D1234]])
            hrDailyDigestParagraphs[i] = hrDailyDigestParagraphs[i].filter(item => item.length > 0 && !/^\[\[/.test(item) && !/\]\]$/.test(item));
            hrDailyDigestParagraphs[i] = hrDailyDigestParagraphs[i].join(" "); 
        }
    }

}


const flattenArrayOfDoubleArray = (array) => {
    
    let indicator = true;
    let i = 0;
    while(indicator){
        if(Array.isArray(array[i])){
            array.splice(i + 1, 0, array[i][1]);
            array[i] = array[i][0];
            i++;
        }
        i++;
        if(i > array.length){
            indicator = false;
        }
    }
}

//Creates an object with HR-Daily-Digest-specific keys and values
const createHRDailyDigestObject = (paragraphs) => {
    let hrDailyDigestObject = {};
    let hrDailyDigestEntries = Object.entries(HR_DAILY_DIGEST_TAGS);
    let currentTag = "";

    paragraphs.forEach((element) => {
        
        for(let i = 0; i < hrDailyDigestEntries.length; i++){
            if(element.includes(hrDailyDigestEntries[i][1])){
                currentTag = hrDailyDigestEntries[i][0];
                if(hrDailyDigestObject[hrDailyDigestEntries[i][0]] == undefined){
                    hrDailyDigestObject[hrDailyDigestEntries[i][0]] = [];
                }
                break;
            }
        }
        if(currentTag.length > 0){
            hrDailyDigestObject[currentTag].push(element);
        }
    });
    
    return hrDailyDigestObject;
}


//Returns an object containing the measures that were passed or failed (depending on the 
    //passedOrFailed parameter) with their roll calls, bill descriptions, and page numbers 
    //in the CREC.
//Also updates the hrDailyDigestObject passed in's passedMeasures value to a cleaner version.
const getPassedOrFailedMeasuresHR = (hrDailyDigestObject, passedOrFailed) => {
    let measureState = "";

    if(passedOrFailed === true){
        measureState = "passedMeasures";
    }else if(passedOrFailed === false){
        measureState = "failedMeasures";
    }else{
        throw "passOrFailed argument must be a boolean type."
    }

    let listOfMeasureObjects = [];
    let measureObject = {};
    
    for(let entry = 0; entry < hrDailyDigestObject[measureState].length; entry++){
        if(hrDailyDigestObject[measureState][entry].includes("Suspension") &&
        hrDailyDigestObject[measureState][entry].includes(":") && 
        hrDailyDigestObject[measureState][entry].includes("The House")){ 
        } else {
            if(hrDailyDigestObject[measureState][entry].includes("Page")){
                let pages = hrDailyDigestObject[measureState][entry].split(" ");

                pages = pages.filter(word => !word.includes("Page") && word.length > 0);
                
                for(let page = 0; page < pages.length; page++){
                    if(pages[page].includes("-")){
                        let [firstPage, lastPage] = pages[page].split("-");
                        firstPageString = firstPage.replace(/\D/, "");
                        firstPageInt = parseInt(firstPageString);
                        firstPageLastTwoDigits = parseInt(firstPageString.slice(firstPageString.length - 2, firstPageString.length));
                        lastPageTwoDigits = parseInt(lastPage);
                        let pageDifference = Math.abs(lastPageTwoDigits - firstPageLastTwoDigits);
                        
                        lastPageInt = firstPageInt + pageDifference;

                        lastPageStringH = "H" + lastPageInt;
                        firstPageStringH = "H" + firstPageString;
                        pages[page] = [firstPageStringH, lastPageStringH];
                    }else{
                        pages[page] = [pages[page].replace(/\W/, '')];
                    }
                }

                measureObject["pages"] = pages;
                listOfMeasureObjects.push(measureObject);
                measureObject = {};
            }else{
                let rollCall = hrDailyDigestObject[measureState][entry].split("Roll ")[1];
                
                //Remove non-numeric values to retrieve the roll call vote's number
                rollCall = rollCall.replace( /^\D+/, '');
                rollCall = rollCall.replace( /\D+$/, '');
                rollCall = "No. " + rollCall;
                
                measureObject["rollCall"] = rollCall;
                measureObject["billDescription"] = hrDailyDigestObject[measureState][entry];
            }
        }
    }
    hrDailyDigestObject[measureState] = listOfMeasureObjects;
    return listOfMeasureObjects;
}


module.exports = {
    downloadDailyDigests : downloadDailyDigests,
    cleanHRDailyDigest : cleanHRDailyDigest,
    flattenArrayOfDoubleArray : flattenArrayOfDoubleArray,
    createHRDailyDigestObject : createHRDailyDigestObject,
    getPassedOrFailedMeasuresHR : getPassedOrFailedMeasuresHR,
}