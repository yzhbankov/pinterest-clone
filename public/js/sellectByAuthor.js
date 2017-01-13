/**
 * Created by Iaroslav Zhbankov on 13.01.2017.
 */
var selector;
$(".info").each(function () {
    $(this).children('a').on('click', function () {
        selector = $(this).children('img').attr('title');
        if (selector) {
            $('.grid-item').each(function () {
                if ($(this).children('.info').children('a').children('img').attr('title') != selector) {
                    $(this).remove();
                }
            });
            $.getScript("/js/mansory.js", function(){
            });
        }
    });
});

