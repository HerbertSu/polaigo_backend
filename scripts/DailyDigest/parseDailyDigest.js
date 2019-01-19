const fs = require('fs');
const fetch = require('node-fetch');


//Writes the Daily Digest html files into the test folder. TODO Perhaps change to 'records' folder
//Visit each PgD link parsed from CREC and see if it contains NEW PUBLIC LAWS, what the HR voted, 
    //what the HR passed, what the HR failed to pass, what the Senate passed,
    //what the Senate failed to pass.
let downloadDailyDigests = (dailyDigestHTMLLinks) => {
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
    //to the beginning of new messages separated only by a newline character
let cleanHRDailyDigest = (hrDailyDigestParagraphs) => {
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

module.exports = {
    downloadDailyDigests : downloadDailyDigests,
    cleanHRDailyDigest : cleanHRDailyDigest,
}