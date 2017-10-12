function onLoad() {
    document.addEventListener("deviceready", onDeviceReady, false);
}

function onDeviceReady() {
    window.open('https://trumf-esso.s3-eu-west-1.amazonaws.com/index.html', '_self');
}
