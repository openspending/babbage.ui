/**
 * Created by maik on 18.05.16.
 */
module.exports.checkForTextOverflow = function(selector, textOverflowHandler){
    var result = false;
    var rectangles = $(selector);
    rectangles.each(function(index, item){
        if($(item)[0].offsetWidth < $(item)[0].scrollWidth){
            $(item).empty();
            textOverflowHandler(item);
            result = true;
        }
    });
    return result;
};