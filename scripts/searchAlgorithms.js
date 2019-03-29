/**
 * Performs binary search on a list of objects. Allows you to enter a key in each object in which you'd like to through.
 * @param {*} item Value of interest to search for in the given list of objects.
 * @param {Array} list List of objects. Objects in the key are sorted by the values of the key of interest.
 * @param {*} listKey Name of the key in the objects to check.
 * @returns Returns false if the item does not exist in any of the objects in the list. If a match is found, it returns the index of the matched object.
 */
let binarySearchListOfObjects = (item, list, listKey) => {
    let beginningIndex = 0;
    let endIndex = list.length - 1;
    while(true){
        if(beginningIndex > endIndex){
            return false;
        } 
        middleIndex = Math.floor(beginningIndex + (endIndex - beginningIndex)/2);

        if(item > list[middleIndex][listKey]){
            beginningIndex = middleIndex + 1;
        } else if (item < list[middleIndex][listKey]){
            endIndex = middleIndex - 1;
        } else {
            return middleIndex;
        }
    }
}

module.exports = {
    binarySearchListOfObjects,
}