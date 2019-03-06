/**
 * Converts dates into yyyy-mm-dd format. Throws an error if an invalid date input is given.
 * @param date any date format valid to the Date object.
 * @returns yyyy-mm-dd 
 */
let dateify = (date) => {
    let datified = new Date(date);
    
    if( isNaN(datified) ){
        console.log("Invalid date entered into dateify.");
        throw "Invalid date entered into dateify.";
    }

    let dd = datified.getDate();
    let mm = datified.getMonth() + 1;
    let yyyy = datified.getFullYear();

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