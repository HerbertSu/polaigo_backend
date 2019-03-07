/**
 * Converts dates into yyyy-mm-dd format. Throws an error if an invalid date input is given.
 * @param date any date format valid to the Date object.
 * @returns yyyy-mm-dd 
 */
let dateify = (date) => {
    let dateObject = new Date(date);
    let offset = dateObject.getTimezoneOffset();
    let utc = dateObject.getTime() + offset*60*1000;
    let datified = new Date(utc);
    
    if( isNaN(datified) ){
        console.log("Invalid date entered into dateify.");
        throw "Invalid date entered into dateify.";
    }

    let dd = parseInt(datified.getDate());
    let mm = parseInt(datified.getMonth() + 1);
    let yyyy = parseInt(datified.getFullYear());

    if (dd < 10) {
        dd = '0' + dd;
    }
    
    if (mm < 10) {
        mm = '0' + mm;
    }

    return `${yyyy}-${mm}-${dd}`;
}

module.exports = {
    dateify,
}