const {fetchCongressionalDistrictFromAddress} = require('../scripts/API/GoogleCivicInfo');
const {fetchRepresentativeGivenDistrict} = require('../scripts/postgresql/psql');

const handleGetRepFromLocation = async (request, response, postgres) => {

    try{
        const {addressLine1, addressLine2, city, state, zipCode} = request.body;

        let address = `${addressLine1} ${addressLine2}, ${city}, ${state} ${zipCode}`;
        let district = await fetchCongressionalDistrictFromAddress(address);
        let representative = await fetchRepresentativeGivenDistrict(district.state, district.districtNumber, postgres );

        response.send(representative)

    }catch(err){
        response.status(404).send({
            "error" : "Invalid address",
            "message" : `Could not fetch representative for given address. Please check input address. ${err}`
        });
    };
};

module.exports = {
    handleGetRepFromLocation
}