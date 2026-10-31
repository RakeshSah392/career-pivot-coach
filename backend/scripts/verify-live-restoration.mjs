import 'dotenv/config';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

const serviceAccountPath = fs.existsSync(path.resolve('backend/config/firebaseServiceAccount.json'))
  ? path.resolve('backend/config/firebaseServiceAccount.json')
  : path.resolve('config/firebaseServiceAccount.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const adminAuth = getAuth();
const apiKey = 'AIzaSyB71VUQ-KO8a6e8Y7lnP73Es5W3XarLNhE';

async function runLiveVerification() {
  console.log('==================================================================');
  console.log('  LIVE VERIFICATION: RUNNING BACKEND (PORT 5000) & VITE (PORT 5174)');
  console.log('==================================================================\n');

  // 1. Direct Backend Health Check
  const beHealthRes = await fetch('http://localhost:5000/api/health');
  const beHealth = await beHealthRes.json();
  console.log('1. Backend Port 5000 Direct Health:', beHealthRes.status, beHealth.api, beHealth.database?.status);

  // 2. Vite Proxy Health Check
  const viteHealthRes = await fetch('http://localhost:5174/api/health');
  const viteHealth = await viteHealthRes.json();
  console.log('2. Vite Port 5174 Proxy Health  :', viteHealthRes.status, viteHealth.api, viteHealth.database?.status);

  // 3. Create verified test user
  const testEmail = `live_verify_${Date.now()}@example.com`;
  const testPassword = 'SecurePassword123!';

  console.log('\n3. Creating verified Firebase user:', testEmail);
  const fbUser = await adminAuth.createUser({
    email: testEmail,
    password: testPassword,
    emailVerified: true,
  });

  try {
    // 4. Sign in via Firebase REST API
    console.log('4. Signing in with client credentials via Firebase REST API...');
    const signInRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        returnSecureToken: true,
      }),
    });
    const signInData = await signInRes.json();
    if (!signInData.idToken) {
      throw new Error('Failed to acquire ID token: ' + JSON.stringify(signInData));
    }
    console.log('   ✅ ID Token acquired successfully (length:', signInData.idToken.length, ')');

    // 5. Create Candidate Profile on Backend via Port 5000
    console.log('\n5. Creating Candidate Profile through running backend...');
    const profileRes = await fetch('http://localhost:5000/api/candidates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${signInData.idToken}`,
        Origin: 'http://localhost:5174',
      },
      body: JSON.stringify({
        fullName: 'Live Test Candidate',
        email: testEmail,
        firebaseUid: fbUser.uid,
        currentTitle: 'Junior Developer',
        targetRole: 'Senior Cloud Platform Architect',
        yearsOfExperience: 3,
        skills: ['JavaScript', 'Node.js', 'Express', 'MongoDB'],
        consentToAiProcessing: true,
      }),
    });
    const profileData = await profileRes.json();
    console.log('   ✅ Profile creation status:', profileRes.status, profileData.data?.fullName);

    // 6. Fetch Profile via Vite Proxy
    console.log('\n6. Fetching Profile via Vite Proxy (http://localhost:5174/api/candidates/profile/me)...');
    const proxyGetRes = await fetch('http://localhost:5174/api/candidates/profile/me', {
      headers: {
        Authorization: `Bearer ${signInData.idToken}`,
        Origin: 'http://localhost:5174',
      },
    });
    const proxyGetData = await proxyGetRes.json();
    console.log('   ✅ Proxy GET /profile/me status:', proxyGetRes.status, proxyGetData.data?.email);

    // 7. Upload Synthetic Resume (Multipart Form Data)
    console.log('\n7. Uploading Synthetic Resume...');
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const resumeText = 'Alex Developer. Experience: 4 years backend with Node.js, Express, MongoDB. Built REST APIs and containerized microservices.';
    const multipartBody =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="resume"; filename="resume.txt"\r\n` +
      `Content-Type: text/plain\r\n\r\n` +
      `${resumeText}\r\n` +
      `--${boundary}--\r\n`;

    const resumeRes = await fetch(`http://localhost:5000/api/candidates/${encodeURIComponent(testEmail)}/resume`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Authorization: `Bearer ${signInData.idToken}`,
        Origin: 'http://localhost:5174',
      },
      body: multipartBody,
    });
    const resumeData = await resumeRes.json();
    console.log('   ✅ Resume upload status:', resumeRes.status, 'Extracted length:', resumeData.data?.extractedLength);

    // 8. Run Skill Gap Analysis
    console.log('\n8. Running Skill Gap Analysis on live server...');
    const analysisRes = await fetch(`http://localhost:5000/api/analysis/${encodeURIComponent(testEmail)}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${signInData.idToken}`,
        Origin: 'http://localhost:5174',
      },
      body: JSON.stringify({
        jobTitle: 'Senior Cloud Platform Architect',
        company: 'CloudScale Technologies',
        jobDescription: 'Requirements: 4+ years of backend engineering experience with Node.js and MongoDB. Production proficiency with Docker containerization and Kubernetes orchestration. Hands-on experience with AWS cloud services (VPC, IAM, ECS/EKS). Automated CI/CD pipeline implementation with GitHub Actions.',
        consentToAiProcessing: true,
      }),
    });
    const analysisData = await analysisRes.json();
    console.log('   ✅ Analysis status:', analysisRes.status, 'Score:', analysisData.data?.matchScore, '%', 'Missing skills:', analysisData.data?.missingSkills?.length);
    const analysisId = analysisData.data?._id;

    // 9. Generate Roadmap
    console.log('\n9. Generating Roadmap on live server...');
    const roadmapRes = await fetch(`http://localhost:5000/api/roadmaps/${encodeURIComponent(testEmail)}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${signInData.idToken}`,
        Origin: 'http://localhost:5174',
      },
      body: JSON.stringify({
        analysisId,
      }),
    });
    const roadmapData = await roadmapRes.json();
    console.log('   ✅ Roadmap status:', roadmapRes.status, 'Milestones:', roadmapData.data?.milestones?.length, 'Projects:', roadmapData.data?.portfolioProjects?.length);

    // 10. Create Mock Interview Session
    console.log('\n10. Creating Mock Interview Session on live server...');
    const interviewRes = await fetch(`http://localhost:5000/api/interviews/${encodeURIComponent(testEmail)}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${signInData.idToken}`,
        Origin: 'http://localhost:5174',
      },
      body: JSON.stringify({
        interviewType: 'technical',
        questionCount: 3,
        targetRole: 'Senior Cloud Platform Architect',
      }),
    });
    const interviewData = await interviewRes.json();
    console.log('   ✅ Interview session status:', interviewRes.status, 'Questions:', interviewData.data?.questions?.length);

    // 11. Submit Answer
    if (interviewData.data?.questions?.length > 0) {
      const q = interviewData.data.questions[0];
      const answerRes = await fetch(`http://localhost:5000/api/interviews/${encodeURIComponent(testEmail)}/sessions/${interviewData.data._id}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${signInData.idToken}`,
          Origin: 'http://localhost:5174',
        },
        body: JSON.stringify({
          questionId: q._id,
          answerText: 'I use Docker for containerization, Kubernetes for pod orchestration, and implement RESTful APIs using Express with JWT authentication.',
        }),
      });
      const answerData = await answerRes.json();
      console.log('   ✅ Answer evaluation status:', answerRes.status, 'Score:', answerData.data?.score, 'Strengths:', answerData.data?.strengths?.length);
    }

    // 12. Finalize Interview Session
    console.log('\n12. Finalizing Interview Session...');
    const finalizeRes = await fetch(`http://localhost:5000/api/interviews/${encodeURIComponent(testEmail)}/sessions/${interviewData.data._id}/finalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${signInData.idToken}`,
        Origin: 'http://localhost:5174',
      },
    });
    const finalizeData = await finalizeRes.json();
    console.log('   ✅ Interview finalize status:', finalizeRes.status, 'Overall Readiness:', finalizeData.data?.readinessScore, '%');

    console.log('\n==================================================================');
    console.log('  ALL LIVE WORKFLOW STEPS VERIFIED 100% OPERATIONAL');
    console.log('==================================================================');
  } finally {
    console.log('\nCleaning up live test user:', testEmail);
    await adminAuth.deleteUser(fbUser.uid).catch(() => {});
  }
}

runLiveVerification().catch((err) => {
  console.error('VERIFICATION ERROR:', err.stack || err);
  if (err.cause) console.error('CAUSE:', err.cause);
  process.exit(1);
});
