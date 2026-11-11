// service-worker.js (في الجذر)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBB_yZ_q7UAbM1-uaE-XoAy3g-tuyr14wo",
  authDomain: "ali1-2ac52.firebaseapp.com",
  projectId: "ali1-2ac52",
  storageBucket: "ali1-2ac52.appspot.com",
  messagingSenderId: "868134603145",
  appId: "1:868134603145:web:YOUR_WEB_APP_ID"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/assets/logo.png'
  });
});
