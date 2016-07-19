module.exports.checkForTextOverflow = function(selector, textOverflowHandler){
    var result = false;
    var elementsForTextOverflowCheck = $(selector);
    elementsForTextOverflowCheck.each(function(index, item){
        if(($(item)[0].offsetWidth < $(item)[0].scrollWidth) || ($(item)[0].offsetHeight < $(item)[0].scrollHeight)){
            textOverflowHandler(item);
            result = true;
        }
    });
    return result;
};