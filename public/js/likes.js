/**
 * Created by Iaroslav Zhbankov on 14.01.2017.
 */

var likes = document.querySelectorAll(".like");
likes.forEach(function (item, index) {
    item.addEventListener("click", function () {
        var url = '/like/' + $(this).attr("data-id");
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.send(null);

        xhr.onreadystatechange = function () {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                if (xhr.responseText == 'not authorised') {
                    alert("You should authorised");
                } else {
                    item.children[0].innerHTML = JSON.parse(xhr.responseText)["likes"];
                }
            }
        };
    })
});
