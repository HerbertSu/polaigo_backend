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