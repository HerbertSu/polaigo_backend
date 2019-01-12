const fetch = require('node-fetch');
const express = require('express');
const parseString = require('xml2js').parseString;
const fs = require('fs');
const app = express();


// app.get("https://api.govinfo.gov/packages/CREC-2018-07-10/mods?api_key=UPY9jQU6CVq80XXWXWoDZzQ7JTm29GsvdJzACahT", (req, res) => {
//     res.send("hello")
// })

let date = "2018-12-21"

fetch(`https://api.govinfo.gov/packages/CREC-${date}/mods?api_key=DEMO_KEY`)
    .then(res => res.text())
    .then(fullCR => {
        // let jsCR = parseString(fullCR, (err, result)=>{
        //     console.log(result)
        // })
        fs.writeFile("./test/CREC-2018-12-21.txt", fullCR, err=>{
            if(err){
                console.log(err)
            }
        })
    })

app.listen(3000);