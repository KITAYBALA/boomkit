const apiKey = "AIzaSyBJcKB1BFqEIlcL8VGJ-q6BKFvBLB8jXmc";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

fetch(url)
    .then(res => res.json())
    .then(data => {
        console.log(JSON.stringify(data, null, 2));
    })
    .catch(err => console.error(err));
