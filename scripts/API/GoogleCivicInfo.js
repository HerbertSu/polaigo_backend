const fetch = require('node-fetch');

const API_KEY = "AIzaSyBPfo8mJJbzcmRTXXupPWGihYotT1hJ2D4";

const fetchCongressionalDistrictFromAddress = async (address) => {
    let HTTP = `https://www.googleapis.com/civicinfo/v2/representatives/?address=${address}&includeOffices=false&key=${API_KEY}`;
    let result = await fetch(HTTP)
        .catch(err=>{
            console.log(err);
            throw err;
        });
    if(result.status == 400){
        throw "Invalid address";
    } 
    let data = await result.text();
    let dataObj = JSON.parse(data);

    const state = dataObj.normalizedInput.state;
    if(state == undefined){
        throw "Civic Info API call has failed for this input.";
    }
    
    let re = /\ocd-division\/country\:us\/state\:\D\D\/cd\:(\d{1,2})$/
    
    let divisionKeys = Object.keys(dataObj.divisions);

    for(let key of divisionKeys){
        if(re.test(key)){
            let matchArray = re.exec(key);
            let district = matchArray[1];

            if(district.length < 2){
                district = "0" + district;
            }

            return state + district;
        }
    }
    throw "District not found."
}

module.exports = {
    fetchCongressionalDistrictFromAddress,

}