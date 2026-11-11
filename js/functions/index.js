const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendNotification = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated','لازم تسجيل دخول');
  // تحقق أن المستخدم مشرف
  const adminDoc = await admin.firestore().collection('admins').doc(context.auth.uid).get();
  if (!adminDoc.exists) throw new functions.https.HttpsError('permission-denied','مش مسموح');

  const { title, body, topic = 'all' } = data;
  await admin.messaging().send({
    topic,
    notification: { title, body }
  });
  return { success: true };
});

// تحديث المباريات المباشرة تلقائيًا (كل دقيقة)
exports.syncLiveMatches = functions.pubsub.schedule('every 1 minutes').onRun(async () => {
  // هنا تربط API خارجي مرخص (Football-Data.org, API-Football)
  // ثم تحدّث rtdb.ref('liveMatches')
});
