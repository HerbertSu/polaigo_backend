const {fetchAndUpdateDBGivenDate} = require('../scripts/fetchAndUpdateDBGivenDate');

const handleUpdateDBGivenDate = async (request, response, postgres) => {
    const {date} = request.body;
    
    let result = await fetchAndUpdateDBGivenDate(date, postgres);
    response.status(result.status).send(result.message);
    
};

module.exports = {
    handleUpdateDBGivenDate,

};