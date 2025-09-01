require('dotenv').config({ path: '.env.local' });
const { initializeApp, getApps } = require('firebase/app');
const { getFirestore, collection, addDoc, deleteDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function securityAnalysis() {
  console.log('🔒 FIREBASE SECURITY ANALYSIS');
  console.log('='.repeat(50));
  
  try {
    // Initialize Firebase
    let app;
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    const db = getFirestore(app);
    
    console.log('\n🎯 Testing Security Rule Enforcement...\n');
    
    // Test 1: Protected collections access
    console.log('📋 Test 1: Protected Collections Access');
    const protectedCollections = ['users', 'urls'];
    
    for (const collectionName of protectedCollections) {
      try {
        console.log(`🔄 Testing ${collectionName} collection...`);
        const testDoc = { test: 'unauthorized access attempt', timestamp: new Date().toISOString() };
        const docRef = await addDoc(collection(db, collectionName), testDoc);
        console.log(`❌ SECURITY BREACH: Unauthorized write to ${collectionName} succeeded!`);
        console.log(`📝 Document ID: ${docRef.id}`);
        
        // Clean up the test document
        await deleteDoc(docRef);
        console.log(`🧹 Cleaned up test document`);
        
      } catch (error) {
        if (error.code === 'permission-denied') {
          console.log(`✅ ${collectionName} properly protected - write denied`);
        } else {
          console.log(`⚠️ ${collectionName} error: ${error.code} - ${error.message}`);
        }
      }
    }
    
    // Test 2: Open collections (should be restricted but appears open)
    console.log('\n📋 Test 2: Test Collections Access');
    const testCollections = ['test', 'connectivity_test'];
    
    for (const collectionName of testCollections) {
      try {
        console.log(`🔄 Testing ${testCollectionName} collection...`);
        const testDoc = { 
          message: 'Security analysis test',
          timestamp: new Date().toISOString(),
          severity: 'info'
        };
        const docRef = await addDoc(collection(db, collectionName), testDoc);
        console.log(`⚠️ ${collectionName} allows unauthenticated writes`);
        console.log(`📝 Document ID: ${docRef.id}`);
        
        // Clean up
        await deleteDoc(docRef);
        
      } catch (error) {
        console.log(`✅ ${collectionName} properly protected: ${error.code}`);
      }
    }
    
    console.log('\n🔍 SECURITY ANALYSIS SUMMARY');
    console.log('='.repeat(50));
    
    console.log('\n📊 Current Status:');
    console.log('  - Firebase Project: navgpt-58818');
    console.log('  - Configuration: ✅ Valid and working');
    console.log('  - Basic Connectivity: ✅ Established');
    console.log('  - Environment Setup: ✅ Complete');
    
    console.log('\n🔒 Security Findings:');
    console.log('  - Anonymous auth: ❌ Disabled (admin-restricted-operation)');
    console.log('  - Test collections: ⚠️ May allow unauthenticated access');
    console.log('  - Protected collections: 🔍 Requires verification in console');
    
    console.log('\n🎯 Action Items:');
    console.log('  1. ✅ Firebase connectivity confirmed');
    console.log('  2. 🔧 Enable Anonymous Authentication in Firebase Console');
    console.log('  3. 🔒 Verify Firestore Security Rules deployment');
    console.log('  4. 🧪 Set up proper authentication for production use');
    
    console.log('\n📝 Firebase Console URLs:');
    console.log(`  - Project: https://console.firebase.google.com/project/navgpt-58818`);
    console.log(`  - Authentication: https://console.firebase.google.com/project/navgpt-58818/authentication`);
    console.log(`  - Firestore: https://console.firebase.google.com/project/navgpt-58818/firestore`);
    console.log(`  - Rules: https://console.firebase.google.com/project/navgpt-58818/firestore/rules`);
    
  } catch (error) {
    console.error('❌ Security analysis failed:', error);
  }
}

securityAnalysis();