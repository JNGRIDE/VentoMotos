
const admin = require('firebase-admin');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Use a service account
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const financiers = ['Vento', 'Maxicash', 'Galgo', 'Other'];

const settingsRef = db.collection('settings').doc('financiers');

settingsRef.set({
  list: financiers
}).then(() => {
  console.log('Document successfully written!');
}).catch((error) => {
  console.error('Error writing document: ', error);
});
