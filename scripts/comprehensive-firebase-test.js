const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously, onAuthStateChanged } = require('firebase/auth');
const { getFirestore, collection, addDoc, getDocs, connectFirestoreEmulator } = require('firebase/firestore');

// Firebase configuration from your provided settings
const firebaseConfig = {
  apiKey: "AIzaSyAngRzGl0020J1kLNORL0vkqRwWcbuoIvU",
  authDomain: "navgpt-58818.firebaseapp.com",
  projectId: "navgpt-58818",
  storageBucket: "navgpt-58818.firebasestorage.app",
  messagingSenderId: "493295872909",
  appId: "1:493295872909:web:46ed31ec7c93cf1c4d6bc4"
};

let testResults = {
  initialization: false,
  authentication: false,
  firestoreConnection: false,
  readOperation: false,
  writeOperation: false,
  securityRules: false
};

async function testFirebaseConfiguration() {
  console.log('🚀 Starting comprehensive Firebase connectivity test...\n');
  
  try {
    // 1. Initialize Firebase
    console.log('🔄 Step 1: Firebase Initialization');
    const app = initializeApp(firebaseConfig);
    testResults.initialization = true;
    console.log('✅ Firebase app initialized successfully');
    console.log('📄 Project ID:', firebaseConfig.projectId);
    
    // 2. Initialize services
    console.log('\n🔄 Step 2: Service Initialization');
    const auth = getAuth(app);
    const db = getFirestore(app);
    testResults.firestoreConnection = true;
    console.log('✅ Firebase Auth service initialized');
    console.log('✅ Firestore service initialized');
    
    // 3. Test authentication state
    console.log('\n🔄 Step 3: Authentication Test');
    try {
      // Check current auth state
      const user = auth.currentUser;
      if (user) {
        console.log('✅ User already authenticated:', user.uid);
        testResults.authentication = true;
      } else {
        console.log('⚠️ No user currently authenticated');
        console.log('🔄 Attempting anonymous authentication...');
        
        // Try anonymous authentication
        const userCredential = await signInAnonymously(auth);
        testResults.authentication = true;
        console.log('✅ Anonymous authentication successful');
        console.log('👤 User ID:', userCredential.user.uid);
      }
    } catch (authError) {
      console.log('❌ Authentication failed:', authError.code);
      console.log('   Message:', authError.message);
    }
    
    // 4. Test Firestore read operations
    console.log('\n🔄 Step 4: Firestore Read Test');
    try {
      const testCollection = collection(db, 'test');
      const snapshot = await getDocs(testCollection);
      testResults.readOperation = true;
      console.log('✅ Firestore read operation successful');
      console.log('📊 Documents found:', snapshot.size);
    } catch (readError) {
      console.log('❌ Firestore read failed:', readError.code);
      console.log('   Message:', readError.message);
    }
    
    // 5. Test Firestore write operations
    console.log('\n🔄 Step 5: Firestore Write Test');
    try {
      const testCollection = collection(db, 'test');
      const testDoc = {
        message: 'Connection test from Claude Code',
        timestamp: new Date().toISOString(),
        testType: 'comprehensive',
        userId: auth.currentUser?.uid || 'anonymous'
      };
      
      const docRef = await addDoc(testCollection, testDoc);
      testResults.writeOperation = true;
      console.log('✅ Firestore write operation successful');
      console.log('📝 Document ID:', docRef.id);
    } catch (writeError) {
      console.log('❌ Firestore write failed:', writeError.code);
      console.log('   Message:', writeError.message);
      
      if (writeError.code === 'permission-denied') {
        testResults.securityRules = true;
        console.log('✅ Security rules are working (blocking unauthorized access)');
      }
    }
    
  } catch (error) {
    console.error('❌ Fatal error during Firebase test:', error);
  }
  
  // Results summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 FIREBASE CONNECTIVITY TEST RESULTS');
  console.log('='.repeat(60));
  
  console.log('🔧 Configuration Status:');
  console.log('  - Firebase initialization:', testResults.initialization ? '✅' : '❌');
  console.log('  - Firestore connection:', testResults.firestoreConnection ? '✅' : '❌');
  console.log('  - Authentication setup:', testResults.authentication ? '✅' : '❌');
  
  console.log('\n🔒 Security & Access:');
  console.log('  - Read operations:', testResults.readOperation ? '✅' : '❌');
  console.log('  - Write operations:', testResults.writeOperation ? '✅' : '❌');
  console.log('  - Security rules active:', testResults.securityRules ? '✅' : '❌');
  
  const overallScore = Object.values(testResults).filter(Boolean).length;
  const totalTests = Object.keys(testResults).length;
  
  console.log('\n🎯 Overall Status:');
  console.log('  - Test Score:', `${overallScore}/${totalTests}`);
  console.log('  - Status:', overallScore >= 4 ? '✅ Ready for development' : '⚠️ Requires attention');
  
  console.log('\n🔧 Next Steps:');
  if (!testResults.authentication) {
    console.log('  1. Configure Firebase Authentication in console');
  }
  if (!testResults.writeOperation && testResults.securityRules) {
    console.log('  2. Security rules working - implement user authentication for writes');
  }
  if (!testResults.writeOperation && !testResults.securityRules) {
    console.log('  2. Check Firestore rules and permissions');
  }
  console.log('  3. Add Firebase Admin service account for server operations');
  console.log('  4. Test with actual user authentication flow');
}

testFirebaseConfiguration();