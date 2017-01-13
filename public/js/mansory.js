/**
 * Created by Iaroslav Zhbankov on 12.01.2017.
 */


var $grid = $('.grid').masonry({
    percentPosition: true,
    fitWidth: true
});
$grid.masonry( 'on', 'layoutComplete', function() {
});
$grid.masonry();