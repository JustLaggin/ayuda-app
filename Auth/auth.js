import { auth, db } from '../firebase-config.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail // 💡 new import
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// References
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const goToLogin = document.getElementById('goToLogin');
const goToRegister = document.getElementById('goToRegister');
const forgotPassword = document.getElementById('forgotPassword'); // 💡 new
const formContainer = document.getElementById('formContainer');
const statusMsg = document.getElementById('statusMsg');

// --- SWITCH FUNCTIONS ---
function showLogin() {
  formContainer.classList.add('fade-out');
  setTimeout(() => {
    registerForm.classList.remove('active');
    loginForm.classList.add('active');
    formContainer.classList.remove('fade-out');
    formContainer.classList.add('fade-in');
  }, 300);
}

function showRegister() {
  formContainer.classList.add('fade-out');
  setTimeout(() => {
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
    formContainer.classList.remove('fade-out');
    formContainer.classList.add('fade-in');
  }, 300);
}

// --- NAVIGATION ---
if (goToLogin) goToLogin.addEventListener('click', (e) => { e.preventDefault(); showLogin(); });
if (goToRegister) goToRegister.addEventListener('click', (e) => { e.preventDefault(); showRegister(); });

// --- REGISTER ---
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const firstName = document.getElementById('registerFirstName').value.trim();
  const lastName = document.getElementById('registerLastName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value.trim();
  const Address = document.getElementById('registerAddress').value.trim();
  const Current_Ayudas = [];
  const Ayuda_Claim_History = [];

  if (!firstName || !lastName || !email || !password || !Address) {
    statusMsg.textContent = "⚠️ Please fill in all fields.";
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email,
      Address,
      role: "user",
      Current_Ayudas,
      Ayuda_Claim_History,
    });

    await signOut(auth);

    // 💡 Smooth transition after success
    statusMsg.style.color = "#2e7d32"; // green
    statusMsg.textContent = "✅ Registration successful! Redirecting to login...";

    formContainer.classList.add("fade-out");

    setTimeout(() => {
      // Switch form
      registerForm.classList.remove("active");
      loginForm.classList.add("active");
      formContainer.classList.remove("fade-out");
      formContainer.classList.add("fade-in");

      // Update status message after transition
      statusMsg.style.color = "#1565c0";
      statusMsg.textContent = "Registrain complete please log in to continue.";
    }, 1200); // smooth delay before switching forms

  } catch (error) {
    console.error("Error during registration:", error);
    statusMsg.style.color = "#d32f2f";
    statusMsg.textContent = "❌ " + error.message;
  }
});

// --- LOGIN ---
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, "users", cred.user.uid));
    const userData = userDoc.data();

    if (userData.role === 'admin') {
      window.location = '../Admin/admin-dashboard.html';
    } else {
      window.location.href = '../user/user-dashboard.html';
    }

  } catch (err) {
    console.error("Login error:", err);
    if(err.message=="Firebase: Error (auth/invalid-credential).")
    statusMsg.textContent = '❌ Invalid Email/Password';
    else statusMsg.textContent = '❌' + err.message;
  }
});

// --- ENTER KEY SUPPORT ---
document.getElementById('loginPassword').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    loginForm.dispatchEvent(new Event('submit'));
  }
});

// --- 💡 FORGOT PASSWORD FEATURE ---
forgotPassword.addEventListener('click', async (e) => {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  if (!email) {
    alert("Please enter your email to reset your password.");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    alert("📧 Password reset email sent! Check your inbox.");
  } catch (error) {
    console.error("Password reset error:", error);
    alert(error.message);
  }
});

window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('login') === 'true') {
    showLogin(); // already defined function
  }
});