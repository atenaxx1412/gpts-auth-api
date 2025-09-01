const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAngRzGl0020J1kLNORL0vkqRwWcbuoIvU",
  authDomain: "navgpt-58818.firebaseapp.com",
  projectId: "navgpt-58818",
  storageBucket: "navgpt-58818.firebasestorage.app",
  messagingSenderId: "493295872909",
  appId: "1:493295872909:web:46ed31ec7c93cf1c4d6bc4"
};

async function testFirebaseConnection() {
  try {
    console.log('🔄 Initializing Firebase...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
    
    // Initialize Firestore
    const db = getFirestore(app);
    console.log('✅ Firestore initialized successfully');
    
    // Test write operation
    console.log('🔄 Testing write operation...');
    const testCollection = collection(db, 'test');
    const testData = {
      message: 'Firebase connection test',
      timestamp: new Date().toISOString(),
      status: 'success'
    };
    
    const docRef = await addDoc(testCollection, testData);
    console.log('✅ Document written successfully with ID:', docRef.id);
    
    // Test read operation
    console.log('🔄 Testing read operation...');
    const querySnapshot = await getDocs(testCollection);
    console.log('✅ Documents read successfully. Count:', querySnapshot.size);
    
    querySnapshot.forEach((doc) => {
      console.log('📄 Document ID:', doc.id, 'Data:', doc.data());
    });
    
    console.log('\n🎉 All Firebase tests passed successfully!');
    console.log('📊 Test Results:');
    console.log('  - Firebase initialization: ✅');
    console.log('  - Firestore initialization: ✅');
    console.log('  - Write operation: ✅');
    console.log('  - Read operation: ✅');
    
  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    console.error('📋 Error details:', {
      name: error.name,
      message: error.message,
      code: error.code || 'unknown'
    });
    process.exit(1);
  }
}

testFirebaseConnection();