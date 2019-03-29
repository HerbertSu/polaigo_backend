/**
 * Checks if an object is empty.
 * @param {Object} object 
 * @returns boolean.
 */
let isObjectEmpty = (object) => {
    return Object.keys(object).length === 0 && object.constructor === Object;
}

module.exports = {
    isObjectEmpty,
}