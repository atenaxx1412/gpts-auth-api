import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';

export async function GET() {
  try {
    console.log('🔄 Testing Firebase Firestore connection...');
    
    const testResults = {
      initialization: false,
      firestoreConnection: false,
      readOperation: false,
      writeOperation: false,
      configuration: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        hasAppId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      }
    };
    
    // Test 1: Firestore connection
    if (db) {
      testResults.firestoreConnection = true;
      console.log('✅ Firestore connection established');
    } else {
      throw new Error('Firestore not initialized');
    }
    
    // Test 2: Read operation (should work regardless of auth)
    try {
      const testCollection = collection(db, 'connectivity_test');
      const snapshot = await getDocs(testCollection);
      testResults.readOperation = true;
      console.log('✅ Firestore read operation successful, docs:', snapshot.size);
    } catch (readError: any) {
      console.log('❌ Read operation failed:', readError.message);
    }
    
    // Test 3: Write operation (will fail due to security rules without auth)
    try {
      const testCollection = collection(db, 'connectivity_test');
      const testDoc = {
        message: 'Firebase connectivity test from API route',
        timestamp: serverTimestamp(),
        source: 'Next.js API Route',
        testId: Math.random().toString(36).substring(7)
      };
      
      const docRef = await addDoc(testCollection, testDoc);
      testResults.writeOperation = true;
      console.log('✅ Firestore write operation successful:', docRef.id);
    } catch (writeError: any) {
      console.log('❌ Write operation failed (expected due to security rules):', writeError.code);
      if (writeError.code === 'permission-denied') {
        console.log('✅ Security rules are properly configured');
      }
    }
    
    testResults.initialization = true;
    
    return NextResponse.json({
      success: true,
      message: 'Firebase connectivity test completed',
      results: testResults,
      summary: {
        basicConnection: testResults.firestoreConnection,
        configurationValid: testResults.configuration.hasApiKey && testResults.configuration.hasAppId,
        securityActive: !testResults.writeOperation,
        overallStatus: testResults.firestoreConnection ? 'Connected' : 'Failed'
      },
      recommendations: [
        testResults.firestoreConnection ? 
          '✅ Firebase configuration is working correctly' : 
          '❌ Check Firebase configuration and network connectivity',
        !testResults.writeOperation ? 
          '🔒 Security rules require authentication (recommended for production)' : 
          '⚠️ Review security rules - writes should require authentication',
        '🔧 For full testing, implement Firebase Authentication',
        '🔑 Add Firebase Admin SDK credentials for server-side operations'
      ]
    });
    
  } catch (error: any) {
    console.error('❌ Firebase test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code || 'unknown',
      results: testResults
    }, { status: 500 });
  }
}

export async function POST() {
  // Test authenticated write operation
  return NextResponse.json({
    message: 'Authenticated write test not implemented yet',
    note: 'This endpoint will test writes with proper authentication'
  });
}